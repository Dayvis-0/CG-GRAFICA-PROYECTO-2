import { SHAPE_VERTICES } from '../data/shapeVertices.js';

/**
 * Funciones geométricas compartidas entre múltiples módulos.
 * Fuente única — los llamadores aplican su propia tolerancia expandiendo
 * las coordenadas antes de llamar a estas funciones.
 */

/**
 * Determina si un punto (px, py) está dentro de un triángulo dado.
 * Tolerancia estricta (>= 0) — el llamador expande el triángulo si necesita margen.
 */
export function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
    const d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
    const a = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / d;
    const b = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / d;
    const c = 1 - a - b;
    return a >= 0 && b >= 0 && c >= 0;
}

/**
 * Ray casting point-in-polygon (sirve para cualquier polígono, cóncavo o convexo).
 */
export function pointInPolygon(px, py, verts) {
    let inside = false;
    for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
        const xi = verts[i].x, yi = verts[i].y;
        const xj = verts[j].x, yj = verts[j].y;
        if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}

/**
 * Re-exporta computeStarPoints consumiendo la definición central SHAPE_VERTICES (DUP-003).
 */
export function computeStarPoints(outerR, innerR, points = 4) {
    return SHAPE_VERTICES.star.getVertices(outerR, innerR, points);
}