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
 * Calcula los vértices 2D de una estrella de N puntas.
 * Centro en (0, 0). Usado tanto para huecos (holeShapes) como para piezas (Pieces).
 *
 * @param {number} outerR — radio exterior
 * @param {number} innerR — radio interior
 * @param {number} points — cantidad de puntas (default 4)
 * @returns {{ x: number, y: number }[]}
 */
export function computeStarPoints(outerR, innerR, points = 4) {
    const verts = [];
    for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
        verts.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
    }
    return verts;
}