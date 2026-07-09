import * as THREE from 'three';

/**
 * Maneja el arrastre de piezas con el mouse (modo kinematic en cannon-es).
 * Colisiones: clasificador via AABB, cuarto via clamp de límites.
 * Deslizamiento natural por eje (X → Z → Y).
 */
export function setupDragManager(activeCameraRef, renderer, {
    piecesGroup,
    classifierRules,
    physicsSystem,
    roomBounds = { half: 7, height: 8 },
    obstacles = [],
    classifierTop = 3.0,
    classifierHalf = 2.0,
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

    // ─── AABBs de obstáculos (solo clasificador, pre-computados) ──
    const obstacleBoxes = obstacles.map(m => new THREE.Box3().setFromObject(m));

    // Reusables (evitar GC en el hot path)
    const _pieceBox  = new THREE.Box3();
    const _candBox   = new THREE.Box3();
    const _size      = new THREE.Vector3();
    const _offMin    = new THREE.Vector3();
    const _offMax    = new THREE.Vector3();

    // ─── Colisión contra obstáculos del clasificador (AABB) ──────
    /**
     * ¿El AABB de la pieza en `pos` intersecta alguna pared del clasificador?
     * @param {THREE.Vector3} pos
     * @returns {boolean}
     */
    function overlapsClassifier(pos) {
        if (obstacleBoxes.length === 0) return false;

        // AABB de la pieza centrado en la posición candidata
        _pieceBox.setFromObject(selected);
        _pieceBox.getSize(_size);

        _candBox.min.set(
            pos.x - _size.x * 0.5,
            pos.y - _size.y * 0.5,
            pos.z - _size.z * 0.5
        );
        _candBox.max.set(
            pos.x + _size.x * 0.5,
            pos.y + _size.y * 0.5,
            pos.z + _size.z * 0.5
        );

        for (const obsBox of obstacleBoxes) {
            if (_candBox.intersectsBox(obsBox)) return true;
        }
        return false;
    }

    // ─── Clamp a límites del cuarto ──────────────────────────────
    /**
     * Margen de seguridad contra las paredes del cuarto.
     * Las paredes del cuarto usan CANNON.Plane (sin grosor), pero el clamp
     * del drag debe mantener la pieza dentro del área visible para que
     * la posición Three y el body Cannon estén siempre alineados.
     */
    const ROOM_MARGIN = 0.5;

    /**
     * Clampea `pos` para que el AABB de la pieza quede dentro del cuarto.
     * @param {THREE.Vector3} pos
     * @returns {THREE.Vector3} — misma referencia, mutada
     */
    // ─── Colisión contra el panel del clasificador (eje Y) ──────
    /**
     * ¿La pieza está sobre el área del clasificador (en X/Z)?
     * @param {THREE.Vector3} pos
     * @returns {boolean}
     */
    function isOverClassifier(pos) {
        const margin = 0.2;
        return Math.abs(pos.x) < classifierHalf + margin
            && Math.abs(pos.z) < classifierHalf + margin;
    }

    function clampToRoom(pos) {
        _pieceBox.setFromObject(selected);

        // Distancia desde selected.position hasta cada cara del AABB
        _offMin.set(
            selected.position.x - _pieceBox.min.x,
            selected.position.y - _pieceBox.min.y,
            selected.position.z - _pieceBox.min.z,
        );
        _offMax.set(
            _pieceBox.max.x - selected.position.x,
            _pieceBox.max.y - selected.position.y,
            _pieceBox.max.z - selected.position.z,
        );

        const half = roomBounds.half;
        const h    = roomBounds.height;

        const m = ROOM_MARGIN;
        pos.x = Math.max(-half + _offMin.x + m, Math.min(half - _offMax.x - m, pos.x));
        pos.z = Math.max(-half + _offMin.z + m, Math.min(half - _offMax.z - m, pos.z));
        // Y: sin piso (minY ya lo maneja), solo techo
        pos.y = Math.min(h - _offMax.y - m, pos.y);

        return pos;
    }

    // ─── Limitador de paso (anti-teleport) ──────────────────────────
    /**
     * Limita el paso por eje al tamaño del AABB de la pieza — evita teleport entre paredes.
     * @param {THREE.Vector3} pos  — posición deseada
     * @param {THREE.Vector3} from — posición actual
     * @returns {THREE.Vector3}
     */
    function limitStep(pos, from) {
        _pieceBox.setFromObject(selected);
        _pieceBox.getSize(_size);

        const maxDx = _size.x * 0.5;
        const maxDy = _size.y * 0.5;
        const maxDz = _size.z * 0.5;

        pos.x = Math.max(from.x - maxDx, Math.min(from.x + maxDx, pos.x));
        pos.y = Math.max(from.y - maxDy, Math.min(from.y + maxDy, pos.y));
        pos.z = Math.max(from.z - maxDz, Math.min(from.z + maxDz, pos.z));

        return pos;
    }

    // ─── Deslizamiento por eje ────────────────────────────────────
    /**
     * Intenta el movimiento en X, Z, Y por separado. Para cada eje,
     * primero verifica obstáculos del clasificador (AABB), y si pasa,
     * después aplica clamp a límites del cuarto.
     * Así la pieza desliza contra paredes/clasificador.
     *
     * @param {THREE.Vector3} pos  — posición deseada
     * @param {THREE.Vector3} from — posición actual
     * @returns {THREE.Vector3} — posición con colisiones resueltas
     */
    function clampMovement(pos, from) {
        const guarded = from.clone();

        // ── Eje X ──
        if (pos.x !== guarded.x) {
            const cx = guarded.clone();
            cx.x = pos.x;
            if (!overlapsClassifier(cx)) {
                // Pasa el clasificador → aplicar room bounds
                clampToRoom(cx);
                guarded.x = cx.x;
            }
        }

        // ── Eje Z ──
        if (pos.z !== guarded.z) {
            const cz = guarded.clone();
            cz.z = pos.z;
            if (!overlapsClassifier(cz)) {
                clampToRoom(cz);
                guarded.z = cz.z;
            }
        }

        // ── Eje Y ──
        if (pos.y !== guarded.y) {
            const cy = guarded.clone();
            cy.y = pos.y;
            if (!overlapsClassifier(cy)) {
                clampToRoom(cy);
                guarded.y = cy.y;
            }
        }

        return guarded;
    }

    // ─── Helpers ──────────────────────────────────────────────────
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

        let newPos = target.clone().sub(offset);

        // ─── Límite inferior (piso / hueco / panel) ────────────
        if (selected.userData.minY !== undefined) {
            if (classifierRules.isOverOwnHole(selected)) {
                newPos.y = Math.max(0.3, newPos.y);
            } else if (isOverClassifier(newPos)) {
                // Sobre el clasificador pero no sobre su hueco → no atravesar el panel
                newPos.y = Math.max(classifierTop + 0.1, newPos.y);
            } else {
                newPos.y = Math.max(selected.userData.minY, newPos.y);
            }
        }

        // ─── Límite de paso (anti-teleport) ────────────────────
        // Evita que la pieza se salte una pared si el mouse/cámara
        // se movieron muy rápido entre frames.
        newPos = limitStep(newPos, selected.position);

        // ─── Colisión: clasificador (AABB) + room bounds ────────
        newPos = clampMovement(newPos, selected.position);

        // Cannon resuelve colisiones contra otras piezas dinámicas
        physicsSystem.setKinematicPosition(selected, newPos);
        selected.position.copy(newPos);
    }

    function onPointerUp() {
        if (selected) {
            // Antes de soltar, reposicionar la pieza para evitar que cannon
            // la eyecte por penetración con el Trimesh del panel.
            const pos = selected.position.clone();
            if (classifierRules.isOverOwnHole(selected)) {
                // Sobre su hueco → mandarla YA abajo del panel para que caiga
                pos.y = 0.3;
            } else if (isOverClassifier(pos)) {
                // Sobre el clasificador pero no sobre su hueco → justo arriba del panel
                pos.y = classifierTop + 0.15;
            }
            selected.position.copy(pos);
            physicsSystem.setKinematic(selected, false);
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

        moveSelectedBy(dx, dz) {
            if (!selected) return;
            const pos = selected.position.clone();
            pos.x += dx;
            pos.z += dz;

            if (selected.userData.minY !== undefined) {
                if (classifierRules.isOverOwnHole(selected)) {
                    pos.y = Math.max(0.3, pos.y);
                } else if (isOverClassifier(pos)) {
                    pos.y = Math.max(classifierTop + 0.1, pos.y);
                } else {
                    pos.y = Math.max(selected.userData.minY, pos.y);
                }
            }

            const clamped = clampMovement(pos, selected.position);

            physicsSystem.setKinematicPosition(selected, clamped);
            selected.position.copy(clamped);
        },

        dispose() {
            el.removeEventListener('pointerdown', onPointerDown);
            el.removeEventListener('pointermove', onPointerMove);
            el.removeEventListener('pointerup', onPointerUp);
        },
    };
}