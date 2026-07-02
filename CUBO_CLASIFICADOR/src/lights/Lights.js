import * as THREE from 'three';

/**
 * Configura la iluminación base de la escena.
 * @param {THREE.Scene} scene
 * @returns {{ ambient: THREE.AmbientLight, dir: THREE.DirectionalLight, fill: THREE.DirectionalLight }}
 */
export function createLights(scene) {
    const lights = {};

    // --- Luz ambiental suave ---
    lights.ambient = new THREE.AmbientLight(0x404565, 0.5);
    scene.add(lights.ambient);

    // --- Luz direccional principal (con sombras) ---
    lights.dir = new THREE.DirectionalLight(0xffeedd, 1.2);
    lights.dir.position.set(5, 10, 7);
    lights.dir.castShadow = true;
    lights.dir.shadow.mapSize.set(1024, 1024);
    lights.dir.shadow.camera.left   = -6;
    lights.dir.shadow.camera.right  =  6;
    lights.dir.shadow.camera.top    =  6;
    lights.dir.shadow.camera.bottom = -6;
    lights.dir.shadow.camera.near   = 0.5;
    lights.dir.shadow.camera.far    = 20;
    scene.add(lights.dir);

    // --- Luz de relleno (desde atrás) ---
    lights.fill = new THREE.DirectionalLight(0x8899ff, 0.4);
    lights.fill.position.set(-3, 4, -5);
    scene.add(lights.fill);

    return lights;
}
