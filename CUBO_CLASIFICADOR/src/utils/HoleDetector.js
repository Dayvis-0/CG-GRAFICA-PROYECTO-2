/**
 * Utilidades de detección geométrica para los huecos del clasificador.
 * Completamente puras — no dependen del estado de la escena.
 */

// Tolerancia para que el usuario no necesite precisión milimétrica desde cámara FPS
export const HOLE_TOLERANCE = 0.1;

// ─── Helpers geométricos ───
export function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
    const d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
    const a = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / d;
    const b = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / d;
    const c = 1 - a - b;
    return a >= -0.01 && b >= -0.01 && c >= -0.01;
}

// Ray casting point-in-polygon (sirve para cualquier polígono, cóncavo o convexo)
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
 * Determina si un punto (sx, sy) en coordenadas del Shape cae dentro de un hueco configurado.
 * @param {number} sx
 * @param {number} sy
 * @param {object} cfg — entrada de HOLE_CONFIGS
 * @returns {boolean}
 */
export function isInsideHole(sx, sy, cfg) {
    const T = HOLE_TOLERANCE;
    switch (cfg.shape) {
        case 'circle': {
            const dx = sx - cfg.cx, dy = sy - cfg.cy;
            const r = cfg.hole.r + T;
            return (dx * dx + dy * dy) < r * r;
        }
        case 'square': {
            const h = cfg.hole.side / 2 + T;
            return Math.abs(sx - cfg.cx) < h && Math.abs(sy - cfg.cy) < h;
        }
        case 'triangle': {
            const r = cfg.hole.r + T, s32 = 0.86602540378;
            const ax = cfg.cx, ay = cfg.cy + r;
            const bx = cfg.cx + r * s32, by = cfg.cy - r / 2;
            const cx2 = cfg.cx - r * s32, cy2 = cfg.cy - r / 2;
            return pointInTriangle(sx, sy, ax, ay, bx, by, cx2, cy2);
        }
        case 'diamond':
            return Math.abs(sx - cfg.cx) / (cfg.hole.rx + T)
                 + Math.abs(sy - cfg.cy) / (cfg.hole.ry + T) < 1;
        case 'hexagon': {
            const r = cfg.hole.r + T;
            for (let i = 0; i < 6; i++) {
                const a1 = (i / 6) * Math.PI * 2 - Math.PI / 2;
                const a2 = ((i + 1) / 6) * Math.PI * 2 - Math.PI / 2;
                const ax = cfg.cx + r * Math.cos(a1), ay = cfg.cy + r * Math.sin(a1);
                const bx = cfg.cx + r * Math.cos(a2), by = cfg.cy + r * Math.sin(a2);
                if (pointInTriangle(sx, sy, cfg.cx, cfg.cy, ax, ay, bx, by)) return true;
            }
            return false;
        }
        case 'star': {
            const pts = cfg.hole.points || 4;
            const outerR = cfg.hole.outerR + T;
            const innerR = cfg.hole.innerR + T;
            const verts = [];
            for (let i = 0; i < pts * 2; i++) {
                const r = i % 2 === 0 ? outerR : innerR;
                const angle = (i / (pts * 2)) * Math.PI * 2 - Math.PI / 2;
                verts.push({ x: cfg.cx + r * Math.cos(angle), y: cfg.cy + r * Math.sin(angle) });
            }
            return pointInPolygon(sx, sy, verts);
        }
        case 'rect': {
            return Math.abs(sx - cfg.cx) < cfg.hole.w / 2 + T
                && Math.abs(sy - cfg.cy) < cfg.hole.h / 2 + T;
        }
    }
    return false;
}