import * as THREE from 'three';

export function createCameras() {
    const W = window.innerWidth;
    const H = window.innerHeight;

    const perspCam = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    perspCam.position.set(0, 5, 11);

    const orthoCam = new THREE.OrthographicCamera(
        -7 * (W / H), 7 * (W / H), 7, -7, 0.1, 100
    );
    orthoCam.position.set(0, 5, 11);

    return { perspCam, orthoCam };
}
