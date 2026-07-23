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
 */
export function triangleHole(cx, cy, r) {
    const path = new Path();
    const top = Math.PI / 2;
    // Generamos el triángulo en sentido CW (horario: top → bottom-right → bottom-left)
    // para que Three.js lo normalice correctamente a CCW como hueco.
    // Con el orden original (top → bottom-left → bottom-right), el algoritmo earcut
    // de Three.js r160 no calcula bien el puente del hueco cuando el polígono tiene
    // exactamente 3 vértices después de filtrar puntos colineales.
    for (let i = 0; i < 3; i++) {
        const angle = top - (i / 3) * Math.PI * 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) path.moveTo(x, y);
        else path.lineTo(x, y);
    }
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

