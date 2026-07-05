import * as THREE from 'three';
import { sweepMove } from '../utils/collision.js';

const STEP_SIZE = 0.04;

/**
 * Maneja exclusivamente el ARRASTRE de piezas con el mouse.
 * - No sabe de físicas (gravedad, estabilidad, empuje).
 * - No sabe de reglas del juego.
 * - Delega colisiones a utils/collision.js y reglas a ClassifierRules.
 *
 * @param {{ current: THREE.Camera }} activeCameraRef
 * @param {THREE.WebGLRenderer}       renderer
 * @param {object}                    opts
 * @param {THREE.Group}               opts.piecesGroup
 * @param {THREE.Mesh[]}              opts.classifierMeshes
 * @param {object}                    opts.classifierRules   — { shouldIgnoreCollision(mesh, obstacle) }
 * @param {function}                  opts.onSelect          — (mesh | null) => void
 * @param {function}                  opts.onDragStart       — () => void
 * @param {function}                  opts.onDragEnd         — () => void
 */
export function setupDragManager(activeCameraRef, renderer, {
    piecesGroup,
    classifierMeshes,
    classifierRules,
    onSelect,
    onDragStart,
    onDragEnd,
}) {
    const raycaster = new THREE.Raycaster();
    const pointer   = new THREE.Vector2();
    const dragPlane = new THREE.Plane();
    const camDir    = new THREE.Vector3();
    const target    = new THREE.Vector3();
    const offset    = new THREE.Vector3();

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

    // ─── Eventos de puntero ───────────────────────────────────────

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

        // Al agarrar, limpia estado físico (la pieza deja de caer/deslizarse)
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

        // Mover con colisiones + reglas del clasificador
        sweepMove(selected, newPos, getObstacles(selected),
            (m, ob) => classifierRules.shouldIgnoreCollision(m, ob));
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

        /**
         * Mueve la pieza seleccionada mediante teclado (flechas).
         * Reusa la misma lógica de colisiones que el drag con mouse.
         */
        moveSelectedBy(dx, dz) {
            if (!selected) return;
            const pos = selected.position.clone();
            pos.x += dx;
            pos.z += dz;
            if (selected.userData.minY !== undefined) {
                pos.y = Math.max(selected.userData.minY, pos.y);
            }
            sweepMove(selected, pos, getObstacles(selected),
                (m, ob) => classifierRules.shouldIgnoreCollision(m, ob));
        },

        dispose() {
            el.removeEventListener('pointerdown', onPointerDown);
            el.removeEventListener('pointermove', onPointerMove);
            el.removeEventListener('pointerup', onPointerUp);
        },
    };
}
