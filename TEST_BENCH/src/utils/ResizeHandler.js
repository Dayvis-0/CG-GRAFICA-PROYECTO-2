/**
 * Maneja el resize de la ventana: actualiza aspecto de ambas cámaras
 * y el tamaño del renderer.
 *
 * @param {{ perspCam, orthoCam }} cameras
 * @param {THREE.WebGLRenderer}    renderer
 */
export function setupResize(cameras, renderer) {
    window.addEventListener('resize', () => {
        const w = window.innerWidth;
        const h = window.innerHeight;

        cameras.perspCam.aspect = w / h;
        cameras.perspCam.updateProjectionMatrix();

        cameras.orthoCam.left   = -7 * (w / h);
        cameras.orthoCam.right  =  7 * (w / h);
        cameras.orthoCam.updateProjectionMatrix();

        renderer.setSize(w, h);
    });
}
