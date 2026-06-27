import * as THREE from 'three';

export function createCamera() {
    const camera = new THREE.PerspectiveCamera(
        55,
        window.innerWidth / window.innerHeight,
        0.1,
        200
    );
    camera.position.set(0, 14, 18);

    return camera;
}
