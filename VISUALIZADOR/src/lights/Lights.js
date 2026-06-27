import * as THREE from 'three';

export function createLights(scene) {
    // Luz ambiental tenue
    scene.add(new THREE.AmbientLight(0x0a0a22, 0.6));

    // Luz direccional frontal
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(5, 20, 10);
    scene.add(dirLight);

    // Luces de acento reactivas
    const accentLight1 = new THREE.PointLight(0x00ffaa, 3, 45);
    accentLight1.position.set(12, 12, 8);
    scene.add(accentLight1);

    const accentLight2 = new THREE.PointLight(0xff3366, 2, 45);
    accentLight2.position.set(-12, 10, -8);
    scene.add(accentLight2);

    return { accentLight1, accentLight2 };
}
