import * as THREE from 'three';

/**
 * Crea una cámara perspectiva situada frente al clasificador.
 * @returns {THREE.PerspectiveCamera}
 */
export function createCamera() {
    const W = window.innerWidth;
    const H = window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(6, 5, 8);
    camera.lookAt(0, 1.5, 0);

    return camera;
}
