import { Path } from 'three';

/**
 * Crea un hueco circular (para Esfera y Cilindro).
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 * @returns {Path}
 */
export function circleHole(cx, cy, r) {
    const path = new Path();
    path.absarc(cx, cy, r, 0, Math.PI * 2, true);
    return path;
}

/**
 * Crea un hueco cuadrado.
 */
export function squareHole(cx, cy, side) {
    const half = side / 2;
    const path = new Path();
    path.moveTo(cx - half, cy - half);
    path.lineTo(cx - half, cy + half);
    path.lineTo(cx + half, cy + half);
    path.lineTo(cx + half, cy - half);
    return path;
}

/**
 * Crea un hueco triangular equilátero (para Cono).
 */
export function triangleHole(cx, cy, r) {
    const path = new Path();
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
export function diamondHole(cx, cy, rx, ry) {
    const path = new Path();
    path.moveTo(cx,       cy + ry);
    path.lineTo(cx + rx,  cy);
    path.lineTo(cx,       cy - ry);
    path.lineTo(cx - rx,  cy);
    return path;
}

/**
 * Crea un hueco rectangular (para Prisma rectangular).
 */
export function rectHole(cx, cy, w, h) {
    const hw = w / 2, hh = h / 2;
    const path = new Path();
    path.moveTo(cx - hw, cy - hh);
    path.lineTo(cx - hw, cy + hh);
    path.lineTo(cx + hw, cy + hh);
    path.lineTo(cx + hw, cy - hh);
    return path;
}
