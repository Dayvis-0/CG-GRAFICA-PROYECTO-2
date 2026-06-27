import * as THREE from 'three';

// ────────────────────────────────────────────
//  CONFIGURACIÓN DEL VISUALIZADOR
// ────────────────────────────────────────────

const COLS       = 32;     // Barras en eje X (frecuencia)
const ROWS       = 16;     // Barras en eje Z (profundidad)
const BAR_SIZE   = 0.34;   // Ancho y profundidad de cada barra
const SPACING    = 0.5;    // Distancia entre centros de barras
const MAX_HEIGHT = 10;     // Altura máxima que puede alcanzar una barra
const LERP_SPEED = 0.14;   // Suavizado de movimiento (0–1)

// ────────────────────────────────────────────
//  LUT DE COLORES (pre-calculada)
//  teal oscuro → cian-verde → rosa caliente
// ────────────────────────────────────────────

const colorLUT    = [];
const emissiveLUT = [];

(function buildColorLUT() {
    const c1  = new THREE.Color(0x003844);
    const c2  = new THREE.Color(0x00ffaa);
    const c3  = new THREE.Color(0xff3366);
    const tmp = new THREE.Color();
    for (let i = 0; i <= 255; i++) {
        const t = i / 255;
        if (t < 0.5) {
            tmp.lerpColors(c1, c2, t * 2);
        } else {
            tmp.lerpColors(c2, c3, (t - 0.5) * 2);
        }
        colorLUT.push(tmp.clone());
        emissiveLUT.push(tmp.clone().multiplyScalar(0.35));
    }
})();

export { colorLUT, emissiveLUT, MAX_HEIGHT, COLS, ROWS, SPACING };

// ────────────────────────────────────────────
//  CREAR GRILLA DE BARRAS 3D
// ────────────────────────────────────────────

export function createBars() {
    const group = new THREE.Group();
    const bars  = [];

    // Geometría compartida: cubo de altura 1 con origen en la base
    const geo = new THREE.BoxGeometry(BAR_SIZE, 1, BAR_SIZE);
    geo.translate(0, 0.5, 0);

    const offX = (COLS - 1) * SPACING / 2;
    const offZ = (ROWS - 1) * SPACING / 2;

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const mat = new THREE.MeshStandardMaterial({
                color:    colorLUT[0],
                emissive: emissiveLUT[0],
                metalness: 0.4,
                roughness: 0.5,
            });

            const mesh = new THREE.Mesh(geo, mat);

            // Posición en la grilla
            mesh.position.set(
                col * SPACING - offX,
                0,
                row * SPACING - offZ
            );
            mesh.scale.y = 0.05;

            // Sombras
            mesh.castShadow = true;
            mesh.receiveShadow = false; // las barras no reciben sombras

            mesh.userData = {
                col, row,
                targetHeight:  0.05,
                currentHeight: 0.05,
            };

            group.add(mesh);
            bars.push(mesh);
        }
    }

    return { group, bars };
}

// ────────────────────────────────────────────
//  ACTUALIZAR BARRAS CON DATOS DE FRECUENCIA
//  Retorna la energía promedio (0–1)
// ────────────────────────────────────────────

export function updateBars(bars, freqData, isPlaying, time, bufferLength) {
    // Energía promedio
    let avgEnergy = 0;
    if (freqData) {
        for (let i = 0; i < bufferLength; i++) avgEnergy += freqData[i];
        avgEnergy /= (bufferLength * 255);
    }

    for (let i = 0; i < bars.length; i++) {
        const bar = bars[i];
        const { col, row } = bar.userData;
        let targetHeight;

        if (freqData && isPlaying) {
            // Mapear columna a índice de frecuencia
            const freqIdx = Math.min(
                Math.floor((col / COLS) * bufferLength * 0.7),
                bufferLength - 1
            );
            const freqVal   = freqData[freqIdx] / 255;
            const rowFactor = 1.0 - (row / ROWS) * 0.6;
            const wave      = 0.85 + 0.15 * Math.sin(time * 3 + row * 0.5);
            targetHeight = freqVal * MAX_HEIGHT * rowFactor * wave;
        } else {
            // Animación idle
            const w = Math.sin(time * 1.5 + col * 0.25 + row * 0.3);
            targetHeight = (w * 0.5 + 0.5) * 1.8 + 0.1;
        }

        // Interpolación lineal para suavizar
        bar.userData.targetHeight  = targetHeight;
        bar.userData.currentHeight += (targetHeight - bar.userData.currentHeight) * LERP_SPEED;
        const h = Math.max(0.05, bar.userData.currentHeight);
        bar.scale.y = h;

        // Color según altura normalizada
        const t   = Math.min(1, h / MAX_HEIGHT);
        const idx = Math.min(255, Math.floor(t * 255));
        bar.material.color.copy(colorLUT[idx]);
        bar.material.emissive.copy(emissiveLUT[idx]);
    }

    return avgEnergy;
}
