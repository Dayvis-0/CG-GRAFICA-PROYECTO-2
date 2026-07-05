import * as THREE from 'three';
import { HOLE_CONFIGS } from '../data/holeConfigs.js';
import { WALL_HEIGHT } from '../objects/Classifier.js';
import { isInsideHole } from '../utils/HoleDetector.js';

const STEP_SIZE = 0.04;
const PUSH_SPEED = 0.025;
const GRAVITY_ACCEL = 0.008;

/**
 * @param {{ current: THREE.Camera }} activeCameraRef
 * @param {THREE.WebGLRenderer}       renderer
 * @param {object}                    opts
 * @param {THREE.Group}               opts.piecesGroup
 * @param {THREE.Mesh[]}              opts.classifierMeshes
 * @param {THREE.Mesh}                opts.panelMesh
 * @param {function}                  opts.onSelect     — (mesh | null) => void
 * @param {function}                  opts.onDragStart  — () => void
 * @param {function}                  opts.onDragEnd    — () => void
 */
export function setupDragManager(activeCameraRef, renderer, { piecesGroup, classifierMeshes, panelMesh, onSelect, onDragStart, onDragEnd }) {
    const raycaster = new THREE.Raycaster();
    const pointer   = new THREE.Vector2();
    const dragPlane = new THREE.Plane();
    const camDir    = new THREE.Vector3();
    const target    = new THREE.Vector3();
    const offset    = new THREE.Vector3();
    const boxA      = new THREE.Box3();
    const boxB      = new THREE.Box3();
    const delta     = new THREE.Vector3();

    // Reusables para físicas
    const _stabilityRay = new THREE.Raycaster();
    const _stabilityBox = new THREE.Box3();
    const _corner = new THREE.Vector3();
    const _stabilityDir = new THREE.Vector3(0, -1, 0);

    /** @type {THREE.Mesh | null} */
    let selected = null;
    let dragging = false;

    function notifySelect(mesh) {
        if (onSelect) onSelect(mesh);
    }

    function getPieceMeshes() {
        return piecesGroup.children.filter(c => c.isMesh);
    }

    function getObstacles(exclude) {
        const pieces = getPieceMeshes().filter(p => p !== exclude);
        return [...pieces, ...classifierMeshes];
    }

    function sweepMove(mesh, targetPos) {
        const start = mesh.position.clone();
        delta.copy(targetPos).sub(start);
        const dist = delta.length();

        if (dist < 0.001) return;

        const steps = Math.max(1, Math.ceil(dist / STEP_SIZE));
        const stepDelta = delta.clone().divideScalar(steps);
        const obstacles = getObstacles(mesh);

        for (let i = 1; i <= steps; i++) {
            const testPos = start.clone().addScaledVector(stepDelta, i);
            mesh.position.copy(testPos);
            mesh.updateMatrixWorld(true);
            boxA.setFromObject(mesh);

            let hit = false;
            for (const ob of obstacles) {
                if (!ob.visible) continue;
                // Si la pieza está sobre su hueco, el panel no bloquea
                if (ob === panelMesh && isOverMatchingHole(mesh)) continue;
                boxB.setFromObject(ob);
                if (boxA.intersectsBox(boxB)) { hit = true; break; }
            }

            if (hit) {
                const validPos = i > 1
                    ? start.clone().addScaledVector(stepDelta, i - 1)
                    : start;
                mesh.position.copy(validPos);
                mesh.updateMatrixWorld(true);
                return;
            }
        }

        mesh.position.copy(targetPos);
        mesh.updateMatrixWorld(true);
    }

    // ─── Detección de pieza sobre su hueco correspondiente ───
    // La lógica de point-in-hole vive en utils/HoleDetector.js

    // Cada pieza solo puede pasar por el hueco que coincide con su label
    // (cubo clasificador tradicional — cada figura tiene su entrada única).
    function isOverMatchingHole(mesh) {
        if (!panelMesh || !mesh || mesh.position.y < WALL_HEIGHT - 1.0) return false;
        const cfg = HOLE_CONFIGS.find(c => c.label === mesh.userData.label);
        if (!cfg) return false;

        // Convertir posición mundial a coordenadas del Shape (shape_Y → -world_Z)
        const sx = mesh.position.x;
        const sy = -mesh.position.z;

        return isInsideHole(sx, sy, cfg);
    }

    // ─── Estabilidad ───
    function isStable(mesh) {
        if (!mesh) return true;
        const obstacles = getObstacles(mesh);
        if (obstacles.length === 0) return true;

        _stabilityBox.setFromObject(mesh);
        const mn = _stabilityBox.min;
        const mx = _stabilityBox.max;

        const corners = [
            [mn.x, mn.z], [mx.x, mn.z],
            [mn.x, mx.z], [mx.x, mx.z],
        ];

        let supported = 0;
        for (const [cx, cz] of corners) {
            _corner.set(cx, mn.y + 0.15, cz);
            _stabilityRay.set(_corner, _stabilityDir);
            _stabilityRay.far = 0.35;
            const hits = _stabilityRay.intersectObjects(obstacles, false);
            if (hits.length > 0 && hits[0].distance > 0.01) supported++;
        }
        return supported >= 3;
    }

    // ─── Dirección de empuje para piezas inestables ───
    function computePushDirection(mesh) {
        const obstacles = getObstacles(mesh);
        _stabilityBox.setFromObject(mesh);
        const mn = _stabilityBox.min;
        const mx = _stabilityBox.max;
        const cx = (mn.x + mx.x) / 2;
        const cz = (mn.z + mx.z) / 2;

        const corners = [
            { x: mn.x, z: mn.z }, { x: mx.x, z: mn.z },
            { x: mn.x, z: mx.z }, { x: mx.x, z: mx.z },
        ];

        let pushX = 0, pushZ = 0, count = 0;
        for (const c of corners) {
            _corner.set(c.x, mn.y + 0.15, c.z);
            _stabilityRay.set(_corner, _stabilityDir);
            _stabilityRay.far = 0.35;
            const hits = _stabilityRay.intersectObjects(obstacles, false);
            if (hits.length === 0 || hits[0].distance <= 0.01) {
                pushX += c.x - cx;
                pushZ += c.z - cz;
                count++;
            }
        }

        if (count > 0 && count < 3) {
            const len = Math.sqrt(pushX * pushX + pushZ * pushZ);
            if (len > 0.001) {
                mesh.userData.pushX = pushX / len;
                mesh.userData.pushZ = pushZ / len;
                mesh.userData.unstable = true;
            }
        }
    }

    // ─── Física completa: gravedad + empuje + estabilidad ───
    function applyPhysics(mesh) {
        const minY = mesh.userData.minY;
        if (!mesh.userData.unstable && mesh.position.y <= minY) return;

        // Aceleración por gravedad
        if (!mesh.userData.unstable) {
            mesh.userData.velY = (mesh.userData.velY || 0) + GRAVITY_ACCEL;
        }

        const targetPos = mesh.position.clone();

        // Caída vertical
        targetPos.y -= mesh.userData.velY || 0;

        // Empuje horizontal si inestable
        if (mesh.userData.unstable) {
            targetPos.x += (mesh.userData.pushX || 0) * PUSH_SPEED;
            targetPos.z += (mesh.userData.pushZ || 0) * PUSH_SPEED;
        }

        sweepMove(mesh, targetPos);

        // Si estaba inestable y ahora se detuvo, re-evaluar
        if (mesh.userData.unstable) {
            const stopped = mesh.position.distanceTo(targetPos) < 0.001
                || mesh.position.y <= minY + 0.01;
            if (stopped) {
                if (isStable(mesh) || mesh.position.y <= minY + 0.01) {
                    mesh.userData.unstable = false;
                    mesh.userData.pushX = 0;
                    mesh.userData.pushZ = 0;
                    if (mesh.position.y <= minY) mesh.userData.velY = 0;
                }
            }
            return;
        }

        // Recién asentado → verificar estabilidad
        if (mesh.position.y <= minY + 0.01) {
            mesh.userData.velY = 0;
            if (!isStable(mesh)) {
                computePushDirection(mesh);
            }
        }
    }

    function onPointerDown(e) {
        pointer.x =  (e.clientX / window.innerWidth)  * 2 - 1;
        pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(pointer, activeCameraRef.current);
        const hits = raycaster.intersectObjects(getPieceMeshes(), false);

        if (hits.length === 0) {
            notifySelect(null);
            return;
        }

        selected = hits[0].object;
        dragging = true;
        if (onDragStart) onDragStart();
        notifySelect(selected);

        // Al agarrar, limpia estado inestable
        selected.userData.unstable = false;
        selected.userData.pushX = 0;
        selected.userData.pushZ = 0;
        selected.userData.velY = 0;

        renderer.domElement.setPointerCapture(e.pointerId);

        activeCameraRef.current.getWorldDirection(camDir);
        dragPlane.setFromNormalAndCoplanarPoint(camDir, selected.position);
        raycaster.ray.intersectPlane(dragPlane, target);
        offset.copy(target).sub(selected.position);

        renderer.domElement.style.cursor = 'grabbing';
    }

    function onPointerMove(e) {
        pointer.x =  (e.clientX / window.innerWidth)  * 2 - 1;
        pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

        if (!dragging || !selected) return;

        raycaster.setFromCamera(pointer, activeCameraRef.current);
        raycaster.ray.intersectPlane(dragPlane, target);

        const newPos = target.clone().sub(offset);

        if (selected.userData.minY !== undefined) {
            newPos.y = Math.max(selected.userData.minY, newPos.y);
        }

        sweepMove(selected, newPos);
    }

    function onPointerUp() {
        if (selected) selected = null;
        dragging = false;
        if (onDragEnd) onDragEnd();
        renderer.domElement.style.cursor = 'default';
    }

    const el = renderer.domElement;
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);

    return {
        getSelected: () => selected,
        applyPhysics,
        moveSelectedBy(dx, dz) {
            if (!selected) return;
            const pos = selected.position.clone();
            pos.x += dx;
            pos.z += dz;
            if (selected.userData.minY !== undefined) {
                pos.y = Math.max(selected.userData.minY, pos.y);
            }
            sweepMove(selected, pos);
        },
        dispose() {
            el.removeEventListener('pointerdown', onPointerDown);
            el.removeEventListener('pointermove', onPointerMove);
            el.removeEventListener('pointerup', onPointerUp);
        },
    };
}
