import * as THREE from 'three';
import { HOLE_CONFIGS } from '../data/holeConfigs.js';
import {
    circleHole,
    squareHole,
    triangleHole,
    diamondHole,
    rectHole,
} from '../utils/holeShapes.js';

// Constantes del cubo

const OUTER       = 4;      // ancho y fondo exterior
const WALL_THICK  = 0.08;   // grosor de cada pared (más delgada = más hueco)
const WALL_HEIGHT = 2.5;    // altura de las paredes (sin tapa)
const PANEL_DEPTH = 0.5;    // grosor del panel superior con huecos
const MID         = OUTER / 2;

// Material compartido

const WALL_MAT = new THREE.MeshStandardMaterial({
    color: 0x2a4a55,
    roughness: 0.6,
    metalness: 0.15,
    side: THREE.DoubleSide,
});

const PANEL_MAT = new THREE.MeshStandardMaterial({
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
    rect:     (cfg) => rectHole(cfg.cx, cfg.cy, cfg.hole.w, cfg.hole.h),
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
        WALL_MAT
    );
    floor.position.y = WALL_THICK / 2;
    floor.receiveShadow = true;
    group.add(floor);
    walls.push(floor);

    // --- 2-5. Paredes laterales ---
    const front = new THREE.Mesh(
        new THREE.BoxGeometry(OUTER, WALL_HEIGHT, WALL_THICK),
        WALL_MAT
    );
    front.position.set(0, WALL_HEIGHT / 2, MID - WALL_THICK / 2);
    front.castShadow = true;
    front.receiveShadow = true;
    group.add(front);
    walls.push(front);

    const back = new THREE.Mesh(
        new THREE.BoxGeometry(OUTER, WALL_HEIGHT, WALL_THICK),
        WALL_MAT
    );
    back.position.set(0, WALL_HEIGHT / 2, -(MID - WALL_THICK / 2));
    back.castShadow = true;
    back.receiveShadow = true;
    group.add(back);
    walls.push(back);

    const left = new THREE.Mesh(
        new THREE.BoxGeometry(WALL_THICK, WALL_HEIGHT, OUTER),
        WALL_MAT
    );
    left.position.set(-(MID - WALL_THICK / 2), WALL_HEIGHT / 2, 0);
    left.castShadow = true;
    left.receiveShadow = true;
    group.add(left);
    walls.push(left);

    const right = new THREE.Mesh(
        new THREE.BoxGeometry(WALL_THICK, WALL_HEIGHT, OUTER),
        WALL_MAT
    );
    right.position.set(MID - WALL_THICK / 2, WALL_HEIGHT / 2, 0);
    right.castShadow = true;
    right.receiveShadow = true;
    group.add(right);
    walls.push(right);

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

    const mesh = new THREE.Mesh(geo, PANEL_MAT);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = WALL_HEIGHT;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
}
