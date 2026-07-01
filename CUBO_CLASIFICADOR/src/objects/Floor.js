import * as THREE from 'three';

/**
 * Crea el suelo de la escena: un plano semitransparente que recibe sombras.
 * @returns {THREE.Mesh}
 */
export function createFloor() {
    const geometry = new THREE.PlaneGeometry(14, 14);
    const material = new THREE.MeshStandardMaterial({
        color: 0x1a2a30,
        roughness: 0.85,
        metalness: 0.05,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
    });

    const floor = new THREE.Mesh(geometry, material);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;

    return floor;
}
