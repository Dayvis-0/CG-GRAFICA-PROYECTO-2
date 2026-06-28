import * as THREE from 'three';

/**
 * TEXTURA PROCEDURAL DE FONDO MARINO (arena/ondas)
 *
 * Crea una textura mediante Canvas 2D API — sin imágenes externas.
 * Simula arena del fondo marino con ondas y motas de luz.
 * Tema: Semana 12 — Texturas procedurales.
 */
export function createProceduralTexture() {
    const size   = 512;
    const half   = size / 2;
    const canvas = document.createElement('canvas');
    canvas.width  = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // ── Fondo: gradiente de arena oscura ──
    const bgGrad = ctx.createRadialGradient(half, half, 0, half, half, half * 1.2);
    bgGrad.addColorStop(0.0, '#3a5a4a');
    bgGrad.addColorStop(0.3, '#2a4a3a');
    bgGrad.addColorStop(0.6, '#1a3a2a');
    bgGrad.addColorStop(1.0, '#0a1a14');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, size, size);

    // ── Ondas de arena (líneas curvas) ──
    ctx.strokeStyle = 'rgba(80, 160, 120, 0.08)';
    ctx.lineWidth = 2;
    for (let y = 0; y < size; y += 16) {
        ctx.beginPath();
        for (let x = 0; x < size; x += 2) {
            const waveY = y + Math.sin(x * 0.03 + y * 0.01) * 6 + Math.sin(x * 0.05) * 3;
            if (x === 0) ctx.moveTo(x, waveY);
            else ctx.lineTo(x, waveY);
        }
        ctx.stroke();
    }

    // ── Manchas de luz (causticas simuladas) ──
    for (let i = 0; i < 60; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = 10 + Math.random() * 40;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        const alpha = 0.03 + Math.random() * 0.06;
        grad.addColorStop(0.0, `rgba(100, 200, 180, ${alpha})`);
        grad.addColorStop(0.5, `rgba(60, 160, 140, ${alpha * 0.5})`);
        grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // ── Pequeñas piedras / conchas (puntos) ──
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = 1 + Math.random() * 2.5;
        ctx.fillStyle = `rgba(60, 90, 70, ${0.15 + Math.random() * 0.2})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // ── Rayas de luz verticales (simulando luz filtrándose) ──
    for (let i = 0; i < 8; i++) {
        const x = Math.random() * size;
        const grad = ctx.createLinearGradient(x, 0, x, size);
        grad.addColorStop(0.0, `rgba(100, 200, 255, 0.04)`);
        grad.addColorStop(0.5, `rgba(100, 200, 255, 0.02)`);
        grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(x - 15, 0, 30, size);
    }

    // ── Crear textura Three.js ──
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    texture.anisotropy = 4;
    texture.needsUpdate = true;

    return texture;
}
