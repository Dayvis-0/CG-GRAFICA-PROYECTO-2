import * as THREE from 'three';

const STEP_SIZE = 0.04;

/**
 * @param {{ current: THREE.Camera }} activeCameraRef
 * @param {THREE.WebGLRenderer}       renderer
 * @param {object}                    opts
 * @param {THREE.Group}               opts.piecesGroup
 * @param {THREE.Mesh[]}              opts.classifierMeshes
 * @param {function}                  opts.onSelect  — (mesh | null) => void
 */
export function setupDragManager(activeCameraRef, renderer, { piecesGroup, classifierMeshes, onSelect }) {
    const raycaster = new THREE.Raycaster();
    const pointer   = new THREE.Vector2();
    const dragPlane = new THREE.Plane();
    const camDir    = new THREE.Vector3();
    const target    = new THREE.Vector3();
    const offset    = new THREE.Vector3();
    const boxA      = new THREE.Box3();
    const boxB      = new THREE.Box3();
    const delta     = new THREE.Vector3();

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
        window.__draggingPiece = true;
        notifySelect(selected);

        // Capturar el pointer para no perder eventos aunque salga del canvas
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
        window.__draggingPiece = false;
        renderer.domElement.style.cursor = 'default';
    }

    const el = renderer.domElement;
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);

    return {
        getSelected: () => selected,
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
