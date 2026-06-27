/**
 * Maneja el cambio de tamaño de la ventana.
 * Actualiza ambas cámaras (perspectiva y ortográfica)
 * y redimensiona el renderizador.
 *
 * @param {Function} updateCameras — función que actualiza las matrices de ambas cámaras
 * @param {THREE.WebGLRenderer} renderer
 */
export function setupResize(updateCameras, renderer) {
    window.addEventListener('resize', () => {
        updateCameras();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}
