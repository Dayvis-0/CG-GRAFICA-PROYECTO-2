import * as THREE from 'three';

/**
 * Crea las 6 piezas geométricas que encajan en los huecos del clasificador.
 * Cada pieza se coloca sobre el suelo, alrededor del cubo.
 * @returns {THREE.Group}
 */
export function createPieces() {
    const group = new THREE.Group();

    // ── Configuración de cada pieza ──
    const pieces = [
        {
            label: 'Esfera',
            geo: new THREE.SphereGeometry(0.55, 32, 32),
            color: 0xff5566,
            pos: { x: 4.5, z: 0, y: 0.55 },
        },
        {
            label: 'Cubo',
            geo: new THREE.BoxGeometry(0.9, 0.9, 0.9),
            color: 0x5588ff,
            pos: { x: 2.25, z: 3.9, y: 0.45 },
        },
        {
            label: 'Cono',
            geo: new THREE.ConeGeometry(0.65, 1.1, 32),
            color: 0x44dd88,
            pos: { x: -2.25, z: 3.9, y: 0.55 },
        },
        {
            label: 'Cilindro',
            geo: new THREE.CylinderGeometry(0.5, 0.5, 0.9, 32),
            color: 0xffbb44,
            pos: { x: -4.5, z: 0, y: 0.45 },
        },
        {
            label: 'Pirámide',
            geo: new THREE.ConeGeometry(0.6, 1.0, 4),
            color: 0xdd66ff,
            pos: { x: -2.25, z: -3.9, y: 0.5 },
        },
        {
            label: 'Prisma',
            geo: new THREE.BoxGeometry(0.9, 0.6, 0.85),
            color: 0x44ddff,
            pos: { x: 2.25, z: -3.9, y: 0.3 },
        },
    ];

    const mat = new THREE.MeshStandardMaterial({
        roughness: 0.4,
        metalness: 0.3,
    });

    for (const p of pieces) {
        const mesh = new THREE.Mesh(p.geo, mat.clone());
        mesh.material.color.setHex(p.color);
        mesh.position.set(p.pos.x, p.pos.y, p.pos.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.label = p.label;
        group.add(mesh);
    }

    return group;
}
