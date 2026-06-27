import * as THREE from 'three';

export function createScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);
    scene.fog = new THREE.FogExp2(0x050510, 0.018);

    return scene;
}
