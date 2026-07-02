import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Herramientas de creación de huecos (Path en sentido horario para holes)
// ---------------------------------------------------------------------------

/**
 * Crea un hueco circular (para Esfera y Cilindro).
 */
function circleHole(cx, cy, r) {
    const path = new THREE.Path();
    path.absarc(cx, cy, r, 0, Math.PI * 2, true);
    return path;
}

/**
 * Crea un hueco cuadrado.
 */
function squareHole(cx, cy, side) {
    const half = side / 2;
    const path = new THREE.Path();
    path.moveTo(cx - half, cy - half);
    path.lineTo(cx - half, cy + half);
    path.lineTo(cx + half, cy + half);
    path.lineTo(cx + half, cy - half);
    return path;
}

/**
 * Crea un hueco triangular equilátero (para Cono).
 */
function triangleHole(cx, cy, r) {
    const path = new THREE.Path();
    const top = Math.PI / 2;
    for (let i = 0; i < 3; i++) {
        const angle = top - (i / 3) * Math.PI * 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) path.moveTo(x, y);
        else path.lineTo(x, y);
    }
    return path;
}

/**
 * Crea un hueco en forma de rombo (para Pirámide).
 */
function diamondHole(cx, cy, rx, ry) {
    const path = new THREE.Path();
    path.moveTo(cx,       cy + ry);
    path.lineTo(cx + rx,  cy);
    path.lineTo(cx,       cy - ry);
    path.lineTo(cx - rx,  cy);
    return path;
}

/**
 * Crea un hueco rectangular (para Prisma rectangular).
 */
function rectHole(cx, cy, w, h) {
    const hw = w / 2, hh = h / 2;
    const path = new THREE.Path();
    path.moveTo(cx - hw, cy - hh);
    path.lineTo(cx - hw, cy + hh);
    path.lineTo(cx + hw, cy + hh);
    path.lineTo(cx + hw, cy - hh);
    return path;
}

// ---------------------------------------------------------------------------
// Configuración de cada hueco — TAMAÑOS AGRANDADOS
// ---------------------------------------------------------------------------

const HOLE_CONFIGS = [
    { label: 'Esfera',   shape: 'circle',   cx: -1.2, cy:  1.2, params: { r: 0.42 } },
    { label: 'Cubo',     shape: 'square',   cx:  0,   cy:  1.2, params: { side: 0.72 } },
    { label: 'Cono',     shape: 'triangle', cx:  1.2, cy:  1.2, params: { r: 0.48 } },
    { label: 'Cilindro', shape: 'circle',   cx: -1.2, cy: -1.2, params: { r: 0.36 } },
    { label: 'Pirámide', shape: 'diamond',  cx:  0,   cy: -1.2, params: { rx: 0.46, ry: 0.46 } },
    { label: 'Prisma',   shape: 'rect',     cx:  1.2, cy: -1.2, params: { w: 0.72, h: 0.38 } },
];

// ---------------------------------------------------------------------------
// Constantes del cubo
// ---------------------------------------------------------------------------

const OUTER       = 4;      // ancho y fondo exterior
const WALL_THICK  = 0.15;   // grosor de cada pared
const WALL_HEIGHT = 2.5;    // altura de las paredes (sin tapa)
const PANEL_DEPTH = 0.5;    // grosor del panel superior con huecos
const MID         = OUTER / 2;
const INNER       = OUTER - WALL_THICK * 2; // espacio interior

// ---------------------------------------------------------------------------
// Material compartido
// ---------------------------------------------------------------------------

const WALL_MAT = new THREE.MeshStandardMaterial({
    color: 0x2a4a55,
    roughness: 0.6,
    metalness: 0.15,
    side: THREE.DoubleSide,  // necesario para ver el interior
});

const PANEL_MAT = new THREE.MeshStandardMaterial({
    color: 0x2a4a55,
    roughness: 0.6,
    metalness: 0.15,
    side: THREE.DoubleSide,
});

// ---------------------------------------------------------------------------
// Función principal
// ---------------------------------------------------------------------------

/**
 * Crea el cubo clasificador HUECO con 6 huecos agrandados en la cara superior.
 *
 * Estructura:
 *   - Pared inferior (suelo)
 *   - 4 paredes laterales (frente, atrás, izquierda, derecha)
 *   - Panel superior con ExtrudeGeometry + 6 holes
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

    // --- 2. Pared frontal (z+) ---
    const front = new THREE.Mesh(
        new THREE.BoxGeometry(OUTER, WALL_HEIGHT, WALL_THICK),
        WALL_MAT
    );
    front.position.set(0, WALL_HEIGHT / 2, MID - WALL_THICK / 2);
    front.castShadow = true;
    front.receiveShadow = true;
    group.add(front);
    walls.push(front);

    // --- 3. Pared trasera (z-) ---
    const back = new THREE.Mesh(
        new THREE.BoxGeometry(OUTER, WALL_HEIGHT, WALL_THICK),
        WALL_MAT
    );
    back.position.set(0, WALL_HEIGHT / 2, -(MID - WALL_THICK / 2));
    back.castShadow = true;
    back.receiveShadow = true;
    group.add(back);
    walls.push(back);

    // --- 4. Pared izquierda (x-) ---
    const left = new THREE.Mesh(
        new THREE.BoxGeometry(WALL_THICK, WALL_HEIGHT, OUTER),
        WALL_MAT
    );
    left.position.set(-(MID - WALL_THICK / 2), WALL_HEIGHT / 2, 0);
    left.castShadow = true;
    left.receiveShadow = true;
    group.add(left);
    walls.push(left);

    // --- 5. Pared derecha (x+) ---
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

// ---------------------------------------------------------------------------
// Construcción del panel superior con los 6 huecos
// ---------------------------------------------------------------------------

function buildTopPanel() {
    const shape = new THREE.Shape();
    shape.moveTo(-MID, -MID);
    shape.lineTo( MID, -MID);
    shape.lineTo( MID,  MID);
    shape.lineTo(-MID,  MID);
    shape.closePath();

    for (const cfg of HOLE_CONFIGS) {
        let hole;
        switch (cfg.shape) {
            case 'circle':
                hole = circleHole(cfg.cx, cfg.cy, cfg.params.r);
                break;
            case 'square':
                hole = squareHole(cfg.cx, cfg.cy, cfg.params.side);
                break;
            case 'triangle':
                hole = triangleHole(cfg.cx, cfg.cy, cfg.params.r);
                break;
            case 'diamond':
                hole = diamondHole(cfg.cx, cfg.cy, cfg.params.rx, cfg.params.ry);
                break;
            case 'rect':
                hole = rectHole(cfg.cx, cfg.cy, cfg.params.w, cfg.params.h);
                break;
        }
        shape.holes.push(hole);
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
