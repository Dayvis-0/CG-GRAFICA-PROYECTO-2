import * as THREE from 'three';

import { attachAnimations } from './pieceAnimations.js';

/**
 * Bucle de renderizado con físicas y comportamiento polimórfico por pieza.
 *
 * Responsabilidades:
 * 1. Avanzar el control FPS
 * 2. Step + sincronizar físicas (delegado a PhysicsSystem que usa cannon-es)
 * 3. Clamp de seguridad post-física (evita que piezas salgan del cuarto)
 * 4. Mover pieza seleccionada con flechas (desde InputManager)
 * 5. Update polimórfico de cada pieza (delegado a pieceAnimations)
 * 6. Renderizar
 *
 * El bucle NO sabe qué piezas existen ni cómo animarlas — eso vive en
 * pieceAnimations.js. Cada pieza expone su propio update().
 *
 * @param {object} opts
 * @param {THREE.Scene}           opts.scene
 * @param {THREE.WebGLRenderer}   opts.renderer
 * @param {{ current: THREE.Camera }} opts.activeCameraRef
 * @param {{ update: function, dispose: function }}   opts.fpsControl
 * @param {THREE.Group}           opts.pieces
 * @param {object}                opts.physicsSystem
 * @param {object}                opts.inputManager
 * @param {object}                opts.dragManager
 * @param {{ half: number, height: number }} opts.roomBounds
 */
export function setupAnimationLoop({
    scene,
    renderer,
    activeCameraRef,
    fpsControl,
    pieces,
    physicsSystem,
    inputManager,
    dragManager,
    roomBounds,
}) {
    // Vincular comportamientos de animación por tipo de pieza
    attachAnimations(pieces);

    // ─── Reusables para clamp post-física ────────────────────────
    const _box    = new THREE.Box3();
    const _offMin = new THREE.Vector3();
    const _offMax = new THREE.Vector3();
    const HALF   = roomBounds?.half ?? 7;
    const HEIGHT = roomBounds?.height ?? 8;
    const MARGIN = 0.5; // mismo margen que DragManager

    /**
     * Safety net: después del step de física, verifica que todas las
     * piezas dinámicas estén dentro del cuarto. Si alguna se salió
     * (por tunneling, solver insuficiente, etc.), la clampa de vuelta
     * y anula TODA la velocidad (no solo el eje que se salió).
     *
     * Si solo se anulara la velocidad del eje clampado, la pieza podría
     * seguir moviéndose por otro eje, llegar a otra pared, y repetir el
     * ciclo hasta que la gravedad + momentum la saquen definitivamente.
     * Al anular TODA la velocidad, la pieza se queda quieta en el borde,
     * y solo la gravedad actúa sobre ella.
     *
     * Sin esto, una pieza que atraviesa una pared se pierde para siempre.
     */
    function clampToRoomBounds(draggedMesh) {
        for (const child of pieces.children) {
            if (!child.isMesh || child === draggedMesh) continue;

            const body = child.userData.body;
            if (!body || body.type !== 2) continue; // 2 = DYNAMIC en cannon-es

            _box.setFromObject(child);

            // Distancia del centro a cada cara del AABB
            _offMin.set(
                child.position.x - _box.min.x,
                child.position.y - _box.min.y,
                child.position.z - _box.min.z,
            );
            _offMax.set(
                _box.max.x - child.position.x,
                _box.max.y - child.position.y,
                _box.max.z - child.position.z,
            );

            const cx = Math.max(-HALF + _offMin.x + MARGIN, Math.min(HALF - _offMax.x - MARGIN, child.position.x));
            const cz = Math.max(-HALF + _offMin.z + MARGIN, Math.min(HALF - _offMax.z - MARGIN, child.position.z));
            const cy = Math.min(HEIGHT - _offMax.y - MARGIN, child.position.y);

            let clamped = false;

            if (cx !== child.position.x) {
                child.position.x = cx;
                body.position.x = cx;
                clamped = true;
            }
            if (cz !== child.position.z) {
                child.position.z = cz;
                body.position.z = cz;
                clamped = true;
            }
            if (cy !== child.position.y) {
                child.position.y = cy;
                body.position.y = cy;
                clamped = true;
            }

            // Si algún eje se clampó, anular TODA la velocidad y angular.
            // Esto evita que la pieza siga moviéndose por otro eje y
            // termine contra otra pared o escapando definitivamente.
            if (clamped) {
                body.velocity.setZero();
                body.angularVelocity.setZero();
                body.wakeUp();
            }
        }
    }

    // ─── Bucle ────────────────────────────────────────────────────

    let lastTime = performance.now();

    function animate(now) {
        requestAnimationFrame(animate);

        const dt = Math.min((now - lastTime) / 1000, 1 / 30);
        lastTime = now;

        // 1. Movimiento FPS (WASD + mouse look)
        fpsControl.update();

        const draggedMesh = dragManager.getSelected();

        // 2. Físicas (cannon-es step + sincronizar meshes)
        physicsSystem.update(dt, draggedMesh);

        // 3. Safety net: clampa piezas dinámicas al cuarto
        //     (evita que tunneling o errores del solver las saquen del recinto)
        clampToRoomBounds(draggedMesh);

        // 4. Movimiento con flechas (polling desde InputManager)
        if (draggedMesh) {
            const step = 0.08;
            if (inputManager.isDown('ArrowUp'))    dragManager.moveSelectedBy( 0, -step);
            if (inputManager.isDown('ArrowDown'))  dragManager.moveSelectedBy( 0,  step);
            if (inputManager.isDown('ArrowLeft'))  dragManager.moveSelectedBy(-step,  0);
            if (inputManager.isDown('ArrowRight')) dragManager.moveSelectedBy( step,  0);
        }

        // 5. Update polimórfico por pieza (delegado a pieceAnimations)
        for (const child of pieces.children) {
            if (child.userData.update) {
                child.userData.update(child, child === draggedMesh);
            }
        }

        // 6. Render
        renderer.render(scene, activeCameraRef.current);
    }

    animate(performance.now());
}
