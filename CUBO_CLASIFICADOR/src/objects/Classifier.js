import * as THREE from 'three';
import { HOLE_CONFIGS } from '../data/holeConfigs.js';
import {
    circleHole,
    squareHole,
    triangleHole,
    diamondHole,
    hexagonHole,
    starHole,
} from '../utils/holeShapes.js';

// Constantes del cubo
const OUTER       = 4;      // ancho y fondo exterior
const WALL_THICK  = 0.08;   // grosor de cada pared (más delgada = más hueco)
export const WALL_HEIGHT = 2.5;    // altura de las paredes (sin tapa)
const PANEL_DEPTH = 0.5;    // grosor del panel superior con huecos
const MID         = OUTER / 2;

// Material compartido para paredes y panel
const BOX_MAT = new THREE.MeshStandardMaterial({
    color: 0x2a4a55,
    roughness: 0.6,
    metalness: 0.15,
    side: THREE.DoubleSide,
});

// Dispatcher de creación de huecos
const HOLE_BUILDERS = {
    circle:   (cfg) => circleHole(cfg.cx, cfg.cy, cfg.hole.r),
    square:   (cfg) => squareHole(cfg.cx, cfg.cy, cfg.hole.side),
    triangle: (cfg) => triangleHole(cfg.cx, cfg.cy, cfg.hole.r),
    diamond:  (cfg) => diamondHole(cfg.cx, cfg.cy, cfg.hole.rx, cfg.hole.ry),
    hexagon:  (cfg) => hexagonHole(cfg.cx, cfg.cy, cfg.hole.r),
    star:     (cfg) => starHole(cfg.cx, cfg.cy, cfg.hole.outerR, cfg.hole.innerR, cfg.hole.points || 4),
};

// Función principal
/**
 * Crea el cubo clasificador HUECO con 6 huecos agrandados en la cara superior.
 *
 * @returns {{ group: THREE.Group, walls: THREE.Mesh[], panel: THREE.Mesh }}
 */
export function createClassifier() {
    const group = new THREE.Group();
    const walls = [];

    // --- 1. Pared inferior (suelo) ---
    const floor = new THREE.Mesh(
        new THREE.BoxGeometry(OUTER, WALL_THICK, OUTER),
        BOX_MAT
    );
    floor.position.y = WALL_THICK / 2;
    floor.receiveShadow = true;
    group.add(floor);
    walls.push(floor);

    // --- 2-5. Paredes laterales (loop: front, back, left, right) ---
    // Cada config tiene { w, h, d } para el Box y { x, y, z } para la posición
    const W = OUTER, H = WALL_HEIGHT, T = WALL_THICK;
    const halfGap = MID - T / 2;
    const wallConfigs = [
        { size: [W, H, T], pos: [0,     H / 2,  halfGap] }, // front
        { size: [W, H, T], pos: [0,     H / 2, -halfGap] }, // back
        { size: [T, H, W], pos: [-halfGap, H / 2,  0] },    // left
        { size: [T, H, W], pos: [ halfGap, H / 2,  0] },    // right
    ];

    for (const cfg of wallConfigs) {
        const wall = new THREE.Mesh(
            new THREE.BoxGeometry(...cfg.size),
            BOX_MAT
        );
        wall.position.set(...cfg.pos);
        wall.castShadow = true;
        wall.receiveShadow = true;
        group.add(wall);
        walls.push(wall);
    }

    // --- 6. Panel superior con huecos ---
    const panel = buildTopPanel();
    group.add(panel);

    return { group, walls, panel };
}

// Construcción del panel superior con los 6 huecos
function buildTopPanel() {
    const shape = new THREE.Shape();
    shape.moveTo(-MID, -MID);
    shape.lineTo( MID, -MID);
    shape.lineTo( MID,  MID);
    shape.lineTo(-MID,  MID);
    shape.closePath();

    for (const cfg of HOLE_CONFIGS) {
        const builder = HOLE_BUILDERS[cfg.shape];
        if (!builder) {
            console.warn(`Unknown hole shape: ${cfg.shape}`);
            continue;
        }
        shape.holes.push(builder(cfg));
    }

    const geo = new THREE.ExtrudeGeometry(shape, {
        depth: PANEL_DEPTH,
        bevelEnabled: false,
    });

    const mesh = new THREE.Mesh(geo, BOX_MAT);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = WALL_HEIGHT;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
}