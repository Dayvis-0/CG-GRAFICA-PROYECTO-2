/**
 * Utilidades de detección geométrica para los huecos del clasificador.
 * Completamente puras — no dependen del estado de la escena.
 */

import { computeStarPoints, pointInTriangle, pointInPolygon } from './geometry.js';

// Tolerancia para que el usuario no necesite precisión milimétrica desde cámara FPS
export const HOLE_TOLERANCE = 0.1;

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
        case 'star': {
            const pts = cfg.hole.points || 4;
            const outerR = cfg.hole.outerR + T;
            const innerR = cfg.hole.innerR + T;
            const verts = computeStarPoints(outerR, innerR, pts)
                .map(v => ({ x: v.x + cfg.cx, y: v.y + cfg.cy }));
            return pointInPolygon(sx, sy, verts);
        }
        case 'rect': {
            return Math.abs(sx - cfg.cx) < cfg.hole.w / 2 + T
                && Math.abs(sy - cfg.cy) < cfg.hole.h / 2 + T;
        }
        default:
            console.warn(`isInsideHole: forma desconocida "${cfg.shape}"`);
            return false;
    }
}