import { Path } from 'three';
import { computeStarPoints } from './geometry.js';

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
    // Winding CW (horario): opuesto al shape exterior CCW → Three.js lo reconoce como hueco
    path.moveTo(cx - half, cy - half);
    path.lineTo(cx + half, cy - half);
    path.lineTo(cx + half, cy + half);
    path.lineTo(cx - half, cy + half);
    path.closePath();
    return path;
}

/**
 * Crea un hueco triangular equilátero (para Cono).
 *
 * Usamos 4 vértices (no 3) porque el algoritmo earcut de Three.js r160
 * no calcula correctamente el puente del hueco cuando el polígono tiene
 * exactamente 3 vértices (incluso tras el filtro de colineales).
 *
 * Subdividimos la base con un tiny bump (+0.001 en Y) que evita el bug
 * sin alterar visualmente la forma del triángulo.
 *
 * Winding CW (horario): top → bottom-right → mid-base ↑ → bottom-left
 */
export function triangleHole(cx, cy, r) {
    const path = new Path();
    const s32 = 0.86602540378;
    const EPS = 0.001; // imperceptible, evita el bug de 3 vértices en earcut r160

    // 4 vértices CW
    path.moveTo(cx, cy + r);                     // top
    path.lineTo(cx + r * s32, cy - r / 2);        // bottom-right
    path.lineTo(cx, cy - r / 2 + EPS);            // mid-base (subdivide el borde inferior)
    path.lineTo(cx - r * s32, cy - r / 2);        // bottom-left
    path.closePath();
    return path;
}

/**
 * Crea un hueco en forma de estrella de N puntas.
 */
export function starHole(cx, cy, outerR, innerR, points = 4) {
    const verts = computeStarPoints(outerR, innerR, points);
    const path = new Path();
    verts.forEach((v, i) => {
        const x = cx + v.x, y = cy + v.y;
        if (i === 0) path.moveTo(x, y);
        else path.lineTo(x, y);
    });
    path.closePath();
    return path;
}

