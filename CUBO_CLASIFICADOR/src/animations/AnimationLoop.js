import { attachAnimations } from './pieceAnimations.js';

/**
 * Bucle de renderizado con físicas y comportamiento polimórfico por pieza.
 *
 * Responsabilidades:
 * 1. Avanzar el control FPS
 * 2. Step + sincronizar físicas (delegado a PhysicsSystem que usa cannon-es)
 * 3. Mover pieza seleccionada con flechas (desde InputManager)
 * 4. Update polimórfico de cada pieza (delegado a pieceAnimations)
 * 5. Renderizar
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
}) {
    // Vincular comportamientos de animación por tipo de pieza
    attachAnimations(pieces);

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

        // 3. Movimiento con flechas (polling desde InputManager)
        if (draggedMesh) {
            const step = 0.08;
            if (inputManager.isDown('ArrowUp'))    dragManager.moveSelectedBy( 0, -step);
            if (inputManager.isDown('ArrowDown'))  dragManager.moveSelectedBy( 0,  step);
            if (inputManager.isDown('ArrowLeft'))  dragManager.moveSelectedBy(-step,  0);
            if (inputManager.isDown('ArrowRight')) dragManager.moveSelectedBy( step,  0);
        }

        // 4. Update polimórfico por pieza (delegado a pieceAnimations)
        for (const child of pieces.children) {
            if (child.userData.update) {
                child.userData.update(child, child === draggedMesh);
            }
        }

        // 5. Render
        renderer.render(scene, activeCameraRef.current);
    }

    animate(performance.now());
}
