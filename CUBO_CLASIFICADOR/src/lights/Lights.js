import * as THREE from 'three';

/**
 * Configura la iluminación base de la escena.
 * @param {THREE.Scene} scene
 * @returns {{ lights: object }}
 *
 * lights: { ambient, directional, fill }
 */
export function createLights(scene) {
    const lights = {};

    // --- Luz ambiental suave ---
    lights.ambient = new THREE.AmbientLight(0x404565, 0.5);
    scene.add(lights.ambient);

    // --- Luz direccional principal (con sombras) ---
    lights.directional = new THREE.DirectionalLight(0xffeedd, 1.2);
    lights.directional.position.set(5, 10, 7);
    lights.directional.castShadow = true;
    lights.directional.shadow.mapSize.set(1024, 1024);
    lights.directional.shadow.camera.left   = -6;
    lights.directional.shadow.camera.right  =  6;
    lights.directional.shadow.camera.top    =  6;
    lights.directional.shadow.camera.bottom = -6;
    lights.directional.shadow.camera.near   = 0.5;
    lights.directional.shadow.camera.far    = 20;
    scene.add(lights.directional);

    // --- Luz de relleno (desde atrás) ---
    lights.fill = new THREE.DirectionalLight(0x8899ff, 0.4);
    lights.fill.position.set(-3, 4, -5);
    scene.add(lights.fill);

    return { lights };
}
