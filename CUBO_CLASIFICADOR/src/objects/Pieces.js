import * as THREE from 'three';
import { HOLE_CONFIGS } from '../data/holeConfigs.js';
import { computeStarPoints } from '../utils/geometry.js';

// ── Fábrica de geometrías según el tipo de pieza ──
const GEO_BUILDERS = {
    sphere:   (args) => new THREE.SphereGeometry(...args),
    box:      (args) => new THREE.BoxGeometry(...args),

    triangle: ([r, depth]) => {
        const shape = new THREE.Shape();
        for (let i = 0; i < 3; i++) {
            const angle = Math.PI / 2 - (i / 3) * Math.PI * 2;
            const x = r * Math.cos(angle);
            const y = r * Math.sin(angle);
            if (i === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        }
        shape.closePath();
        const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
        geo.translate(0, 0, -depth / 2);
        geo.rotateX(-Math.PI / 2);
        return geo;
    },
    star: ([outerR, innerR, depth, points = 4]) => {
        const verts = computeStarPoints(outerR, innerR, points);
        const shape = new THREE.Shape();
        verts.forEach((v, i) => {
            if (i === 0) shape.moveTo(v.x, v.y);
            else shape.lineTo(v.x, v.y);
        });
        shape.closePath();
        const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
        geo.translate(0, 0, -depth / 2);
        geo.rotateX(-Math.PI / 2);
        return geo;
    },
};

/**
 * Crea las 4 piezas geométricas que encajan en los huecos del clasificador.
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
        mesh.userData.pieceType = cfg.pieceType;
        mesh.userData.pieceArgs = cfg.pieceArgs;
        mesh.userData.minY = cfg.pieceY;
        group.add(mesh);
    }

    return group;
}