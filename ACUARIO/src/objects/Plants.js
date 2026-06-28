import * as THREE from 'three';

/**
 * PLANTAS ACUÁTICAS
 *
 * Cada planta = un tallo (cilindro) + múltiples hojas (esferas aplanadas
 * o conos pequeños) que se mecen con la corriente simulada.
 */

const NUM_PLANTS = 8;

// Posiciones predefinidas en el fondo del tanque
const PLANT_POSITIONS = [
    { x: -3.0, z: -2.0 },
    { x: -2.5, z: 2.0 },
    { x: -1.5, z: -1.8 },
    { x: 0.0, z: 2.3 },
    { x: 1.5, z: -2.0 },
    { x: 2.5, z: 1.8 },
    { x: 3.0, z: -1.5 },
    { x: -0.5, z: -2.2 },
];

const PLANT_COLORS = [
    0x2a8a4a,
    0x3aaa5a,
    0x1a7a3a,
    0x4aba6a,
    0x2a9a5a,
    0x3a8a4a,
    0x1a8a3a,
    0x4a9a5a,
];

/**
 * Crea una planta individual.
 */
function createPlant(index) {
    const group = new THREE.Group();
    const pos = PLANT_POSITIONS[index % PLANT_POSITIONS.length];
    const color = PLANT_COLORS[index % PLANT_COLORS.length];

    const height = 0.6 + Math.random() * 0.8;
    const stemRad = 0.04;

    // --- Tallo (cilindro delgado) ---
    const stemMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.8,
        metalness: 0.0,
    });
    const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(stemRad * 0.5, stemRad, height, 6),
        stemMat
    );
    stem.position.y = height / 2;
    stem.castShadow = true;
    group.add(stem);

    // --- Hojas (esferas aplanadas a los lados) ---
    const leafMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.7,
        metalness: 0.0,
        flatShading: true,
    });

    const numLeaves = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numLeaves; i++) {
        const leaf = new THREE.Mesh(
            new THREE.SphereGeometry(0.08 + Math.random() * 0.06, 6, 6),
            leafMat
        );
        const t = (i + 1) / (numLeaves + 1);
        leaf.position.set(
            (Math.random() - 0.5) * 0.25,
            t * height,
            (Math.random() - 0.5) * 0.25,
        );
        leaf.scale.set(1, 0.4, 1);
        leaf.castShadow = true;
        group.add(leaf);
    }

    group.position.set(pos.x, 0.1, pos.z);

    // Rotación aleatoria
    group.rotation.y = Math.random() * Math.PI * 2;

    return { group, stem, height, pos, phase: Math.random() * Math.PI * 2 };
}

/**
 * Crea todas las plantas del acuario.
 * @returns {{ group: THREE.Group, plantData: Array }}
 */
export function createPlants() {
    const group = new THREE.Group();
    const plantData = [];

    for (let i = 0; i < NUM_PLANTS; i++) {
        const { group: pGroup, stem, height, pos, phase } = createPlant(i);
        group.add(pGroup);
        plantData.push({ group: pGroup, stem, height, pos, phase });
    }

    return { group, plantData };
}

/**
 * Actualiza el movimiento de las plantas (simula corriente).
 */
export function updatePlants(plantData, time) {
    for (const p of plantData) {
        const sway = Math.sin(time * 0.5 + p.phase) * 0.03;
        p.group.rotation.z = sway;
        p.group.rotation.x = Math.sin(time * 0.4 + p.phase + 1) * 0.02;
    }
}
