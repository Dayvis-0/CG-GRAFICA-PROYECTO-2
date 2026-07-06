import * as THREE from 'three';

/**
 * Maneja exclusivamente el ARRASTRE de piezas con el mouse.
 * - No implementa colisiones AABB a mano: cannon-es resuelve las colisiones
 *   automáticamente entre la pieza kinematic y los demás cuerpos.
 * - Respeto del hueco: si el cursor deja la pieza sobre su hueco correcto,
 *   permitimos que baje dentro (no la frenamos en Y = minY).
 *
 * @param {{ current: THREE.Camera }} activeCameraRef
 * @param {THREE.WebGLRenderer}       renderer
 * @param {object}                    opts
 * @param {THREE.Group}               opts.piecesGroup
 * @param {object}                    opts.classifierRules   — { isOverOwnHole(mesh) }
 * @param {object}                    opts.physicsSystem      — { setKinematic, setKinematicPosition }
 * @param {function}                  opts.onSelect           — (mesh | null) => void
 * @param {function}                  opts.onDragStart         — () => void
 * @param {function}                  opts.onDragEnd           — () => void
 */
export function setupDragManager(activeCameraRef, renderer, {
    piecesGroup,
    classifierRules,
    physicsSystem,
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

        // Modo kinematic: la pieza ya no recibe gravedad, pero sigue
        // siendo un obstáculo para las demás.
        physicsSystem.setKinematic(selected, true);
        physicsSystem.setKinematicPosition(selected, selected.position);

        renderer.domElement.setPointerCapture(e.pointerId);

        // Plano de arrastre paralelo a la cámara, pasando por el centro de la pieza
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

        // Limite inferior: por defecto minY (no atraviesa el piso),
        // PERO si está sobre su hueco correcto, permitimos bajarla
        // dentro del clasificador (hasta y = 0.3 para que entre al cubo).
        if (selected.userData.minY !== undefined) {
            if (classifierRules.isOverOwnHole(selected)) {
                // Sobre el hueco correcto: permitir bajar dentro del cubo
                newPos.y = Math.max(0.3, newPos.y);
            } else {
                // Suelo normal
                newPos.y = Math.max(selected.userData.minY, newPos.y);
            }
        }

        // Cannon se encarga del resto: las demás piezas y las paredes
        // (incluida el panel perforado) responden al mover la pieza kinematic.
        physicsSystem.setKinematicPosition(selected, newPos);
        selected.position.copy(newPos);
    }

    function onPointerUp() {
        if (selected) {
            // Al soltar: volver a dinámico. Cannon ahora aplica gravedad y
            // todas las fuerzas de contacto correspondientes → si la pieza
            // estaba sobre otra (cono, pirámide, etc.), se cae y rueda como
            // en la vida real.
            physicsSystem.setKinematic(selected, false);
            // Forzar sincronización body ≈ mesh final
            const body = selected.userData.body;
            if (body) {
                body.position.set(selected.position.x, selected.position.y, selected.position.z);
                body.velocity.setZero();
                body.angularVelocity.setZero();
                body.wakeUp();
            }
            selected = null;
        }
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
         * Mueve la pieza seleccionada mediante teclado (flechas) en modo kinematic.
         * Cannon resuelve colisiones de las demás piezas contra esta.
         */
        moveSelectedBy(dx, dz) {
            if (!selected) return;
            const pos = selected.position.clone();
            pos.x += dx;
            pos.z += dz;

            if (selected.userData.minY !== undefined) {
                if (classifierRules.isOverOwnHole(selected)) {
                    pos.y = Math.max(0.3, pos.y);
                } else {
                    pos.y = Math.max(selected.userData.minY, pos.y);
                }
            }

            physicsSystem.setKinematicPosition(selected, pos);
            selected.position.copy(pos);
        },

        dispose() {
            el.removeEventListener('pointerdown', onPointerDown);
            el.removeEventListener('pointermove', onPointerMove);
            el.removeEventListener('pointerup', onPointerUp);
        },
    };
}
