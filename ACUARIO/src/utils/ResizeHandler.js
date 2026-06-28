/**
 * Maneja el cambio de tamaño de la ventana.
 * Actualiza ambas cámaras y redimensiona el renderizador.
 */
export function setupResize(updateCameras, renderer) {
    window.addEventListener('resize', () => {
        updateCameras();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}
