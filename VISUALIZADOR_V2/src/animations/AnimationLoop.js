import * as THREE from 'three';
import { updateBars } from '../objects/Bars.js';
import { formatTime } from '../utils/FormatTime.js';

/**
 * BUCLE DE ANIMACIÓN PRINCIPAL
 *
 * Cada frame:
 *   - Lee frecuencias del audio y actualiza barras
 *   - Rota el grupo de barras suavemente
 *   - Pulsa luces, niebla y fondo con la energía del audio
 *   - Actualiza barra de progreso y tiempos
 *   - Llama al callback del HUD para refrescar indicadores
 */
export function startAnimation(renderer, scene, controls, barGroup, bars, lights, audioManager, conceptPanelUpdater) {
    const clock = new THREE.Clock();
    const progressFill  = document.getElementById('progressFill');
    const currentTimeEl = document.getElementById('currentTime');
    const totalTimeEl   = document.getElementById('totalTime');

    let frameCount = 0;

    function animate() {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime();
        frameCount++;

        // ── Leer frecuencia del audio y actualizar barras ──
        const bufferLength = audioManager.bufferLength;
        const freqData     = audioManager.getFrequencyData();
        const avgEnergy    = updateBars(bars, freqData, audioManager.isPlaying, time, bufferLength);

        // ── Rotación sutil del grupo ──
        barGroup.rotation.y = Math.sin(time * 0.15) * 0.08;

        // ── Luces pulsando con la música ──
        lights.accent1.intensity = 4 + avgEnergy * 6;
        lights.accent2.intensity = 3 + avgEnergy * 5;

        // ── Niebla que respira ──
        scene.fog.density = 0.018 + avgEnergy * 0.025;

        // ── Fondo que se ilumina sutilmente ──
        scene.background.setRGB(
            0.02 + avgEnergy * 0.04,
            0.015 + avgEnergy * 0.01,
            0.06 + avgEnergy * 0.03
        );

        // ── Avance direccional de la luz con el ritmo ──
        lights.directional.position.x = 8 + Math.sin(time * 0.2) * 3;
        lights.directional.position.z = 10 + Math.cos(time * 0.25) * 4;

        // ── Controles orbitales y render ──
        controls.update();
        renderer.render(scene, controls.object);

        // ── Barra de progreso y tiempo ──
        const audio = audioManager.audioElement;
        if (audioManager.hasAudio && audio.duration && !isNaN(audio.duration)) {
            const pct = (audio.currentTime / audio.duration) * 100;
            progressFill.style.width = pct + '%';
            currentTimeEl.textContent = formatTime(audio.currentTime);
            totalTimeEl.textContent   = formatTime(audio.duration);
        }

        // ── Actualizar HUD de conceptos cada 15 frames (ahorro) ──
        if (frameCount % 15 === 0 && conceptPanelUpdater) {
            conceptPanelUpdater();
        }
    }

    animate();
}
