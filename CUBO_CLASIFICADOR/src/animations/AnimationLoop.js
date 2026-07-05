/**
 * Bucle de renderizado con físicas y comportamiento polimórfico por pieza.
 *
 * Responsabilidades:
 * 1. Avanzar el control FPS
 * 2. Ejecutar físicas (delegado a PhysicsSystem)
 * 3. Mover pieza seleccionada con flechas (desde InputManager)
 * 4. Ejecutar update() polimórfico de cada pieza (evita ifs por tipo)
 * 5. Renderizar
 *
 * @param {object} opts
 * @param {THREE.Scene}           opts.scene
 * @param {THREE.WebGLRenderer}   opts.renderer
 * @param {{ current: THREE.Camera }} opts.activeCameraRef
 * @param {{ update: function }}   opts.fpsControl
 * @param {THREE.Group}           opts.pieces
 * @param {object}                opts.physicsSystem   — { update(draggedMesh) }
 * @param {object}                opts.inputManager    — { isDown(key) }
 * @param {object}                opts.dragManager     — { getSelected(), moveSelectedBy(dx, dz) }
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
    // ─── Comportamiento polimórfico por pieza ────────────────────
    // En lugar de if (label === 'Esfera') en el loop, cada pieza
    // expone su propio update(). Mañana agregar otra animación es
    // tan simple como setear child.userData.update = fn.

    for (const child of pieces.children) {
        if (!child.isMesh) continue;

        switch (child.userData.label) {
            case 'Esfera':
                child.userData.update = function sphereUpdate(mesh, isDragged) {
                    if (isDragged) return;
                    const prevX = mesh.userData.prevX ?? mesh.position.x;
                    const prevZ = mesh.userData.prevZ ?? mesh.position.z;
                    const dx = mesh.position.x - prevX;
                    const dz = mesh.position.z - prevZ;
                    mesh.rotation.x -= dz * 3;
                    mesh.rotation.z += dx * 3;
                    mesh.userData.prevX = mesh.position.x;
                    mesh.userData.prevZ = mesh.position.z;
                };
                break;
            // Futuras piezas con comportamiento propio se agregan acá
            // case 'Cubo': child.userData.update = ...
        }
    }

    // ─── Bucle ────────────────────────────────────────────────────

    function animate() {
        requestAnimationFrame(animate);

        // 1. Movimiento FPS (WASD + mouse look)
        fpsControl.update();

        const draggedMesh = dragManager.getSelected();

        // 2. Físicas (gravedad, estabilidad, empuje)
        physicsSystem.update(draggedMesh);

        // 3. Movimiento con flechas (polling desde InputManager)
        if (draggedMesh) {
            const step = 0.08;
            if (inputManager.isDown('ArrowUp'))    dragManager.moveSelectedBy( 0, -step);
            if (inputManager.isDown('ArrowDown'))  dragManager.moveSelectedBy( 0,  step);
            if (inputManager.isDown('ArrowLeft'))  dragManager.moveSelectedBy(-step,  0);
            if (inputManager.isDown('ArrowRight')) dragManager.moveSelectedBy( step,  0);
        }

        // 4. Update polimórfico por pieza (rotación de esfera, etc.)
        for (const child of pieces.children) {
            if (child.userData.update) {
                child.userData.update(child, child === draggedMesh);
            }
        }

        // 5. Render
        renderer.render(scene, activeCameraRef.current);
    }

    animate();
}
