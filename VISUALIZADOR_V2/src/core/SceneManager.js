import * as THREE from 'three';

/**
 * Crea la escena 3D con fondo oscuro y niebla exponencial.
 * La niebla se modifica en tiempo real desde el bucle de animación.
 */
export function createScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);
    scene.fog = new THREE.FogExp2(0x050510, 0.018);

    return scene;
}
