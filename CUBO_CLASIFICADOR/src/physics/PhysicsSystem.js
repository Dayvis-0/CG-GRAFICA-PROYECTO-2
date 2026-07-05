import * as THREE from 'three';
import { sweepMove } from '../utils/collision.js';

// ── Constantes físicas ──
const GRAVITY_ACCEL = 0.008;
const PUSH_SPEED = 0.025;

// Reusables (evitar allocs en cada frame)
const _stabilityRay = new THREE.Raycaster();
const _stabilityBox = new THREE.Box3();
const _corner = new THREE.Vector3();
const _stabilityDir = new THREE.Vector3(0, -1, 0);
const _boxA = new THREE.Box3();
const _boxB = new THREE.Box3();

/**
 * Sistema de físicas independiente: gravedad, estabilidad y empuje.
 * No sabe de drag, no sabe de UI — solo de piezas y obstáculos.
 *
 * @param {THREE.Group}           piecesGroup      — grupo con las piezas
 * @param {THREE.Mesh[]}          classifierMeshes — paredes + panel del clasificador
 * @param {object}                classifierRules  — { shouldIgnoreCollision(mesh, obstacle) }
 */
export function createPhysicsSystem(piecesGroup, classifierMeshes, classifierRules) {

    function getObstacles(exclude) {
        const pieces = piecesGroup.children.filter(c => c.isMesh && c !== exclude);
        return [...pieces, ...classifierMeshes];
    }

    // ─── Estabilidad ──────────────────────────────────────────────

    function isStable(mesh) {
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

    // ─── Dirección de empuje ─────────────────────────────────────

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

    // ─── Física por pieza (gravedad + estabilidad + empuje) ──────

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

        // Mover con colisiones, delegando reglas de juego
        sweepMove(mesh, targetPos, getObstacles(mesh),
            (m, ob) => classifierRules.shouldIgnoreCollision(m, ob));

        // Si estaba inestable y se detuvo, re-evaluar
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

    // ─── Update por frame ────────────────────────────────────────

    /**
     * Ejecuta la física para todas las piezas (excepto la que se arrastra).
     * @param {THREE.Mesh|null} draggedMesh — pieza agarrada por el mouse (se salta)
     */
    function update(draggedMesh) {
        for (const child of piecesGroup.children) {
            if (!child.isMesh) continue;

            // La pieza arrastrada no recibe físicas
            if (child === draggedMesh) {
                child.userData.velY = 0;
                child.userData.unstable = false;
                continue;
            }

            applyPhysics(child);
        }
    }

    return { update };
}
