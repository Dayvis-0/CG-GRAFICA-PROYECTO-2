import * as THREE from 'three';

/**
 * Crea la escena 3D con fondo azul profundo nocturno y niebla submarina.
 * La niebla simula la turbidez del agua.
 */
export function createScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020a18);
    scene.fog = new THREE.FogExp2(0x020a18, 0.012);

    return scene;
}
