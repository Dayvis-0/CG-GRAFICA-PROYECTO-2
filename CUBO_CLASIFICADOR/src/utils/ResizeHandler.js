/**
 * Adapta la cámara y el renderer al cambiar el tamaño de la ventana.
 *
 * @param {THREE.PerspectiveCamera} camera
 * @param {THREE.WebGLRenderer}     renderer
 */
export function setupResize(camera, renderer) {
    window.addEventListener('resize', () => {
        const w = window.innerWidth;
        const h = window.innerHeight;

        camera.aspect = w / h;
        camera.updateProjectionMatrix();

        renderer.setSize(w, h);
    });
}
