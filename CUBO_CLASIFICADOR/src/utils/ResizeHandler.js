import * as THREE from 'three';

/**
 * Adapta ambas cámaras y el renderer al cambiar el tamaño de la ventana.
 *
 * @param {{ perspCam: THREE.PerspectiveCamera, orthoCam: THREE.OrthographicCamera }} cameras
 * @param {THREE.WebGLRenderer} renderer
 * @param {{ current: THREE.Camera }} activeCameraRef
 */
export function setupResize(cameras, renderer, activeCameraRef) {
    window.addEventListener('resize', () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const ASP = w / h;

        cameras.perspCam.aspect = ASP;
        cameras.perspCam.updateProjectionMatrix();

        cameras.orthoCam.left   = -7 * ASP;
        cameras.orthoCam.right  =  7 * ASP;
        cameras.orthoCam.top    =  7;
        cameras.orthoCam.bottom = -7;
        cameras.orthoCam.updateProjectionMatrix();

        renderer.setSize(w, h);
    });
}
