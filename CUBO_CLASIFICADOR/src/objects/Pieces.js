import * as THREE from 'three';
import { HOLE_CONFIGS } from '../data/holeConfigs.js';

// ── Fábrica de geometrías según el tipo de pieza ──
const GEO_BUILDERS = {
    sphere:   (args) => new THREE.SphereGeometry(...args),
    box:      (args) => new THREE.BoxGeometry(...args),
    cone:     (args) => new THREE.ConeGeometry(...args),
    cylinder: (args) => new THREE.CylinderGeometry(...args),
};

/**
 * Crea las 6 piezas geométricas que encajan en los huecos del clasificador.
 * Los tamaños se definen en data/holeConfigs.js (fuente única).
 * @returns {THREE.Group}
 */
export function createPieces() {
    const group = new THREE.Group();

    const mat = new THREE.MeshStandardMaterial({
        roughness: 0.4,
        metalness: 0.3,
    });

    for (const cfg of HOLE_CONFIGS) {
        const builder = GEO_BUILDERS[cfg.pieceType];
        if (!builder) {
            console.warn(`Unknown piece type: ${cfg.pieceType}`);
            continue;
        }

        const mesh = new THREE.Mesh(builder(cfg.pieceArgs), mat.clone());
        mesh.material.color.setHex(cfg.pieceColor);
        mesh.position.set(cfg.piecePos.x, cfg.pieceY, cfg.piecePos.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.label = cfg.label;
        mesh.userData.minY = cfg.pieceY;
        group.add(mesh);
    }

    return group;
}
