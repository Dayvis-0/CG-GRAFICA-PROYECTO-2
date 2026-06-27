import * as THREE from 'three';

/**
 * Crea el sistema de iluminación de la escena con cuatro fuentes:
 *   1. AmbientLight — iluminación base uniforme
 *   2. DirectionalLight — luz direccional que proyecta sombras
 *   3. PointLight (acento 1 — teal)
 *   4. PointLight (acento 2 — rosa)
 *
 * Expone funciones para encender/apagar cada luz individualmente,
 * demostrando el efecto de cada tipo de fuente (Semana 11).
 */
export function createLights(scene) {
    // --- Luz ambiental ---
    const ambient = new THREE.AmbientLight(0x0a0a22, 0.35);
    scene.add(ambient);

    // --- Luz direccional (proyecta sombras) ---
    const directional = new THREE.DirectionalLight(0xffeedd, 0.7);
    directional.position.set(8, 20, 10);
    directional.castShadow = true;

    // Configurar mapa de sombras
    directional.shadow.mapSize.width  = 1024;
    directional.shadow.mapSize.height = 1024;
    directional.shadow.camera.near    = 0.5;
    directional.shadow.camera.far     = 50;
    directional.shadow.camera.left    = -15;
    directional.shadow.camera.right   = 15;
    directional.shadow.camera.top     = 15;
    directional.shadow.camera.bottom  = -15;
    directional.shadow.bias          = -0.001;

    scene.add(directional);

    // --- Luz puntual de acento 1 (teal) ---
    const accent1 = new THREE.PointLight(0x00ffaa, 4, 45);
    accent1.position.set(12, 10, 8);
    accent1.castShadow = true;
    scene.add(accent1);

    // --- Luz puntual de acento 2 (rosa) ---
    const accent2 = new THREE.PointLight(0xff3366, 3, 45);
    accent2.position.set(-12, 8, -8);
    accent2.castShadow = true;
    scene.add(accent2);

    // --- Control individual de luces ---
    const lights = { ambient, directional, accent1, accent2 };
    const states = {
        ambient:     true,
        directional: true,
        accent1:     true,
        accent2:     true,
    };

    /** Enciende o apaga una luz por nombre. Retorna el nuevo estado. */
    function toggle(name) {
        if (!(name in lights)) return false;
        states[name] = !states[name];
        lights[name].visible = states[name];
        return states[name];
    }

    /** Activa una luz específica. */
    function turnOn(name) {
        if (!(name in lights)) return;
        states[name] = true;
        lights[name].visible = true;
    }

    /** Desactiva una luz específica. */
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
        ambient, directional, accent1, accent2,
        toggle, turnOn, turnOff,
        getState, getAllStates,
        lights,
    };
}
