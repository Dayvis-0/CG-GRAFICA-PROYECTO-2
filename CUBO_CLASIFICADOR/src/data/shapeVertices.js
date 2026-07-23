/**
 * Definición central de vértices y parámetros base de formas geométricas.
 * Single Source of Truth para construcciones 2D/3D (piezas y huecos).
 */

export const SHAPE_VERTICES = {
    triangle: {
        pointsCount: 3,
        /**
         * Calcula los vértices 2D de un triángulo equilátero.
         * @param {number} r - Radio circunscrito
         * @returns {{ x: number, y: number }[]}
         */
        getVertices(r) {
            const verts = [];
            for (let i = 0; i < 3; i++) {
                const angle = Math.PI / 2 - (i / 3) * Math.PI * 2;
                verts.push({
                    x: r * Math.cos(angle),
                    y: r * Math.sin(angle),
                });
            }
            return verts;
        },
    },
    star: {
        defaultPoints: 4,
        /**
         * Calcula los vértices 2D de una estrella de N puntas.
         * @param {number} outerR - Radio exterior
         * @param {number} innerR - Radio interior
         * @param {number} [points=4] - Cantidad de puntas
         * @returns {{ x: number, y: number }[]}
         */
        getVertices(outerR, innerR, points = 4) {
            const verts = [];
            for (let i = 0; i < points * 2; i++) {
                const r = i % 2 === 0 ? outerR : innerR;
                const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
                verts.push({
                    x: r * Math.cos(angle),
                    y: r * Math.sin(angle),
                });
            }
            return verts;
        },
    },
};
