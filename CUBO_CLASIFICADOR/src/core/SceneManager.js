import * as THREE from 'three';

/**
 * Crea la escena base con fondo y niebla.
 * @returns {THREE.Scene}
 */
export function createScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e0e18);
    scene.fog = new THREE.Fog(0x0e0e18, 12, 30);
    return scene;
}
