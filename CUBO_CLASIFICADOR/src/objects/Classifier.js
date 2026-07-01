import * as THREE from 'three';

// Herramientas de creación de huecos (Path en sentido horario para holes)

/**
 * Crea un hueco circular (para Esfera y Cilindro).
 */
function circleHole(cx, cy, r) {
    const path = new THREE.Path();
    // absarc con clockwise=true dibuja en sentido horario (requerido para holes)
    path.absarc(cx, cy, r, 0, Math.PI * 2, true);
    return path;
}

/**
 * Crea un hueco cuadrado.
 */
function squareHole(cx, cy, side) {
    const half = side / 2;
    const path = new THREE.Path();
    path.moveTo(cx - half, cy - half); // BL
    path.lineTo(cx - half, cy + half); // TL
    path.lineTo(cx + half, cy + half); // TR
    path.lineTo(cx + half, cy - half); // BR
    return path;
}

/**
 * Crea un hueco triangular equilátero (para Cono).
 */
function triangleHole(cx, cy, r) {
    const path = new THREE.Path();
    // Triángulo equilátero inscrito en círculo de radio r, pointing up.
    // Se itera en sentido horario para que funcione como hole de Shape.
    const top = Math.PI / 2; // 90° = arriba
    for (let i = 0; i < 3; i++) {
        // Ángulo decreciente → sentido horario
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
    path.moveTo(cx,       cy + ry);  // top
    path.lineTo(cx + rx,  cy);       // right
    path.lineTo(cx,       cy - ry);  // bottom
    path.lineTo(cx - rx,  cy);       // left
    return path;
}

/**
 * Crea un hueco rectangular (para Prisma rectangular).
 */
function rectHole(cx, cy, w, h) {
    const hw = w / 2, hh = h / 2;
    const path = new THREE.Path();
    path.moveTo(cx - hw, cy - hh); // BL
    path.lineTo(cx - hw, cy + hh); // TL
    path.lineTo(cx + hw, cy + hh); // TR
    path.lineTo(cx + hw, cy - hh); // BR
    return path;
}

// Configuración de cada hueco: figura, forma, posición, tamaño

const HOLE_CONFIGS = [
    { label: 'Esfera',   shape: 'circle',   cx: -1.2, cy:  1.2, params: { r: 0.30 } },
    { label: 'Cubo',     shape: 'square',   cx:  0,   cy:  1.2, params: { side: 0.50 } },
    { label: 'Cono',     shape: 'triangle', cx:  1.2, cy:  1.2, params: { r: 0.35 } },
    { label: 'Cilindro', shape: 'circle',   cx: -1.2, cy: -1.2, params: { r: 0.24 } },
    { label: 'Pirámide', shape: 'diamond',  cx:  0,   cy: -1.2, params: { rx: 0.32, ry: 0.32 } },
    { label: 'Prisma',   shape: 'rect',     cx:  1.2, cy: -1.2, params: { w: 0.55, h: 0.32 } },
];

// Función principal — exportada

const CUBE_SIZE   = 4;    // ancho y fondo del cubo
const BASE_HEIGHT = 2.5;  // altura de la parte sólida inferior
const PANEL_DEPTH = 0.5;  // grosor del panel superior con huecos
const MID         = CUBE_SIZE / 2;

/**
 * Crea el cubo clasificador con 6 huecos en la cara superior.
 *
 * Estructura:
 *   - Base sólida: BoxGeometry (CUBE_SIZE × BASE_HEIGHT × CUBE_SIZE)
 *   - Panel superior: ExtrudeGeometry con Shape + 6 holes
 *
 * @returns {{ group: THREE.Group, base: THREE.Mesh, panel: THREE.Mesh }}
 */
export function createClassifier() {
    const group = new THREE.Group();

    // --- 1. Base sólida ---
    const baseGeo = new THREE.BoxGeometry(CUBE_SIZE, BASE_HEIGHT, CUBE_SIZE);
    const baseMat = new THREE.MeshStandardMaterial({
        color: 0x2a4a55,
        roughness: 0.6,
        metalness: 0.15,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = BASE_HEIGHT / 2;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // --- 2. Panel superior con huecos ---
    const panelShape = new THREE.Shape();
    panelShape.moveTo(-MID, -MID);
    panelShape.lineTo( MID, -MID);
    panelShape.lineTo( MID,  MID);
    panelShape.lineTo(-MID,  MID);
    panelShape.closePath();

    // Agregar cada hueco
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
        panelShape.holes.push(hole);
    }

    const extrudeSettings = {
        depth: PANEL_DEPTH,
        bevelEnabled: false,
    };

    const panelGeo = new THREE.ExtrudeGeometry(panelShape, extrudeSettings);
    const panelMat = new THREE.MeshStandardMaterial({
        color: 0x2a4a55,
        roughness: 0.6,
        metalness: 0.15,
        side: THREE.DoubleSide,
    });

    const panel = new THREE.Mesh(panelGeo, panelMat);
    // Rotar: Shape está en XY → queremos que quede en XZ (horizontal)
    panel.rotation.x = -Math.PI / 2;
    panel.position.y = BASE_HEIGHT;
    panel.castShadow = true;
    panel.receiveShadow = true;
    group.add(panel);

    return { group, base, panel };
}
