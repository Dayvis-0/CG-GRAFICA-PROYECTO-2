/**
 * Bucle de renderizado con físicas, FPS y rotación de esfera.
 *
 * @param {object} opts
 * @param {THREE.Scene}           opts.scene
 * @param {THREE.WebGLRenderer}   opts.renderer
 * @param {{ current: THREE.Camera }} opts.activeCameraRef
 * @param {{ update: function }}   opts.fpsControl
 * @param {THREE.Group}           opts.pieces
 * @param {object}                opts.dragManager
 */
export function setupAnimationLoop({
    scene,
    renderer,
    activeCameraRef,
    fpsControl,
    pieces,
    dragManager,
}) {
    function animate() {
        requestAnimationFrame(animate);

        // 1. Movimiento FPS (WASD + mouse look)
        fpsControl.update();

        // 2. Físicas por pieza
        const draggedMesh = dragManager.getSelected();
        const isDragging = draggedMesh !== null;

        for (const child of pieces.children) {
            if (!child.isMesh) continue;

            // La pieza que se arrastra no recibe físicas
            if (child === draggedMesh) {
                child.userData.velY = 0;
                child.userData.unstable = false;
                continue;
            }

            // Gravedad + estabilidad + empuje
            dragManager.applyPhysics(child);

            // Rotación de la esfera (rodar al moverse)
            if (child.userData.label === 'Esfera') {
                const prevX = child.userData.prevX ?? child.position.x;
                const prevZ = child.userData.prevZ ?? child.position.z;
                const dx = child.position.x - prevX;
                const dz = child.position.z - prevZ;
                child.rotation.x -= dz * 3;
                child.rotation.z += dx * 3;
                child.userData.prevX = child.position.x;
                child.userData.prevZ = child.position.z;
            }
        }

        // 3. Render
        renderer.render(scene, activeCameraRef.current);
    }

    animate();
}
