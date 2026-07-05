/**
 * Funciones geométricas compartidas entre múltiples módulos.
 */

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
