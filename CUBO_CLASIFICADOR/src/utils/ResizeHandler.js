/**
 * Adapta la cámara FPS y el renderer al cambiar el tamaño de la ventana.
 *
 * @param {THREE.PerspectiveCamera} camera
 * @param {THREE.WebGLRenderer} renderer
 */
export function setupResize(camera, renderer) {
    window.addEventListener('resize', () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const ASP = w / h;

        camera.aspect = ASP;
        camera.updateProjectionMatrix();

        renderer.setSize(w, h);
    });
}