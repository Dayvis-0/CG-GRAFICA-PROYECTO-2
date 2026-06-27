import * as THREE from 'three';

//  DEFINICIÓN DE LAS 4 PRIMITIVAS
const defs = [
    { key: 'sphere', label: 'Esfera',  geo: () => new THREE.SphereGeometry(1, 48, 32),       x: -4.5, color: 0x5be3ff },
    { key: 'torus',  label: 'Toro',    geo: () => new THREE.TorusGeometry(0.9, 0.38, 24, 48), x: -1.5, color: 0xff7a9c },
    { key: 'cube',   label: 'Cubo',    geo: () => new THREE.BoxGeometry(1.5, 1.5, 1.5),       x:  1.5, color: 0x9be8a0 },
    { key: 'cone',   label: 'Cono',    geo: () => new THREE.ConeGeometry(1, 2, 32),            x:  4.5, color: 0xffb45b },
];

const RING_GEO = new THREE.RingGeometry(1.5, 1.65, 32);
const RING_MAT = new THREE.MeshBasicMaterial({
    color: 0x5be3ff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
});

/**
 * Crea pedestal, grilla decorativa y las 4 primitivas con sus anillos de selección.
 * @param {function} buildMaterial  (type, color, textureKey) => Material
 * @returns {{ objects, pedestal, ringGeo, ringMat }}
 *
 * objects: { key: { mesh, ring, def, state } }
 */
export function createSceneObjects(buildMaterial) {
    const objects = {};

    // --- Pedestal ---
    const pedGeo = new THREE.BoxGeometry(14, 0.4, 5.5);
    const pedMat = new THREE.MeshStandardMaterial({ color: 0x1c2228, roughness: 0.8 });
    const pedestal = new THREE.Mesh(pedGeo, pedMat);
    pedestal.position.y = -0.2;
    pedestal.receiveShadow = true;

    // --- Grilla decorativa ---
    const grid = new THREE.GridHelper(14, 14, 0x2a6f7a, 0x182228);
    grid.position.y = 0.01;

    // --- 4 objetos ---
    defs.forEach(d => {
        const state = { material: 'phong', texture: 'none', color: d.color };
        const mat = buildMaterial(state.material, state.color, state.texture);
        const mesh = new THREE.Mesh(d.geo(), mat);
        mesh.position.set(d.x, 1.1, 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.key   = d.key;
        mesh.userData.label = d.label;
        mesh.userData.state = state;

        // Anillo de selección (oculto por defecto)
        const ring = new THREE.Mesh(RING_GEO, RING_MAT);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(d.x, 0.05, 0);
        ring.visible = false;

        objects[d.key] = { mesh, ring, def: d, state };
    });

    return { objects, pedestal, grid };
}
