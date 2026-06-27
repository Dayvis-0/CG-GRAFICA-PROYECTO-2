import * as THREE from 'three';

/**
 * GENERADOR DE TEXTURA PROCEDURAL
 *
 * Crea una textura mediante Canvas 2D API — sin imágenes externas.
 * La textura es un patrón abstracto estilo "cyberpunk grid" con
 * gradientes, celdas y líneas de acento, claramente identificable
 * como una textura (no un color sólido).
 *
 * Tema: Semana 12 — Texturas procedurales.
 */
export function createProceduralTexture() {
    const size   = 512;
    const half   = size / 2;
    const canvas = document.createElement('canvas');
    canvas.width  = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // ── Fondo: gradiente radial oscuro ──
    const bgGrad = ctx.createRadialGradient(half, half, 0, half, half, half);
    bgGrad.addColorStop(0.0, '#0a1a1a');
    bgGrad.addColorStop(0.4, '#051010');
    bgGrad.addColorStop(0.8, '#030808');
    bgGrad.addColorStop(1.0, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, size, size);

    // ── Grilla de celdas ──
    const cellSize = 32;
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < size; x += cellSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, size);
        ctx.stroke();
    }
    for (let y = 0; y < size; y += cellSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y);
        ctx.stroke();
    }

    // ── Círculos concéntricos estilizados ──
    for (let r = 4; r > 0; r--) {
        const radius = r * 48;
        const grad = ctx.createRadialGradient(half, half, 0, half, half, radius);
        grad.addColorStop(0.0, `rgba(0, 255, 170, ${0.015 * (4 - r + 1)})`);
        grad.addColorStop(0.7, `rgba(255, 51, 102, ${0.005 * (4 - r + 1)})`);
        grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(half, half, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // ── Líneas diagonales de acento ──
    ctx.strokeStyle = 'rgba(255, 51, 102, 0.06)';
    ctx.lineWidth = 2;
    for (let i = -size; i < size * 2; i += 48) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + size, size);
        ctx.stroke();
    }

    // ── Puntos de intersección (acentos) ──
    for (let x = 0; x < size; x += cellSize * 2) {
        for (let y = 0; y < size; y += cellSize * 2) {
            const alpha = 0.05 + 0.08 * Math.sin(x * 0.1) * Math.sin(y * 0.1);
            ctx.fillStyle = `rgba(0, 255, 170, ${alpha})`;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ── Crear textura Three.js ──
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    texture.anisotropy = 4;
    texture.needsUpdate = true;

    return texture;
}
