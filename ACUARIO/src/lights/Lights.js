import * as THREE from 'three';

/**
 * SISTEMA DE ILUMINACIÓN SUBMARINA
 *
 * 4 fuentes de luz que demuestran diferentes tipos:
 *   1. DirectionalLight — luz superior que penetra el agua (con sombras)
 *   2. PointLight (submarina 1) — luz de acento color cian
 *   3. PointLight (submarina 2) — luz de acento color violeta
 *   4. AmbientLight — iluminación base tenue
 */
export function createLights(scene) {
    // --- Luz ambiental (tenue, nocturna) ---
    const ambient = new THREE.AmbientLight(0x0a1a2a, 0.4);
    scene.add(ambient);

    // --- Luz direccional superior (penetra el agua) ---
    const directional = new THREE.DirectionalLight(0xaaccff, 1.2);
    directional.position.set(3, 12, 5);
    directional.castShadow = true;

    directional.shadow.mapSize.width  = 1024;
    directional.shadow.mapSize.height = 1024;
    directional.shadow.camera.near    = 0.5;
    directional.shadow.camera.far     = 30;
    directional.shadow.camera.left    = -10;
    directional.shadow.camera.right   = 10;
    directional.shadow.camera.top     = 10;
    directional.shadow.camera.bottom  = -10;
    directional.shadow.bias          = -0.001;

    scene.add(directional);

    // --- Luz submarina 1 (cian) ---
    const submarine1 = new THREE.PointLight(0x00ddff, 3, 20);
    submarine1.position.set(-3, 1.5, -1);
    submarine1.castShadow = true;
    scene.add(submarine1);

    // --- Luz submarina 2 (violeta) ---
    const submarine2 = new THREE.PointLight(0xaa66ff, 3, 20);
    submarine2.position.set(3, 1.5, 1);
    submarine2.castShadow = true;
    scene.add(submarine2);

    // --- Marcadores visuales (esferitas de color) ---
    const markerMat1 = new THREE.MeshBasicMaterial({ color: 0x00ddff });
    const marker1 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), markerMat1);
    marker1.position.copy(submarine1.position);
    scene.add(marker1);

    const markerMat2 = new THREE.MeshBasicMaterial({ color: 0xaa66ff });
    const marker2 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), markerMat2);
    marker2.position.copy(submarine2.position);
    scene.add(marker2);

    // --- Control individual de luces ---
    const lights = { ambient, directional, submarine1, submarine2 };
    const states = {
        ambient:      true,
        directional:  true,
        submarine1:   true,
        submarine2:   true,
    };

    function toggle(name) {
        if (!(name in lights)) return false;
        states[name] = !states[name];
        lights[name].visible = states[name];
        return states[name];
    }

    function turnOn(name) {
        if (!(name in lights)) return;
        states[name] = true;
        lights[name].visible = true;
    }

    function turnOff(name) {
        if (!(name in lights)) return;
        states[name] = false;
        lights[name].visible = false;
    }

    function getState(name) {
        return states[name] || false;
    }

    function getAllStates() {
        return { ...states };
    }

    return {
        ambient, directional, submarine1, submarine2,
        toggle, turnOn, turnOff,
        getState, getAllStates,
        lights,
        markers: [marker1, marker2],
    };
}
