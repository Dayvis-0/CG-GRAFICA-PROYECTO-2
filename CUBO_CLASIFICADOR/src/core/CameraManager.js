import * as THREE from 'three';

/**
 * Crea cámaras perspectiva y ortográfica.
 * @returns {{ perspCam: THREE.PerspectiveCamera, orthoCam: THREE.OrthographicCamera }}
 */
export function createCameras() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const ASP = W / H;

    const perspCam = new THREE.PerspectiveCamera(45, ASP, 0.1, 100);
    perspCam.position.set(6, 5, 8);

    const orthoCam = new THREE.OrthographicCamera(
        -7 * ASP, 7 * ASP, 7, -7, 0.1, 100
    );
    orthoCam.position.set(6, 5, 8);

    return { perspCam, orthoCam };
}
