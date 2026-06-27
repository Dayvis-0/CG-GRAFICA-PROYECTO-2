import * as THREE from 'three';
import { updateBars } from '../objects/Bars.js';
import { formatTime } from '../utils/FormatTime.js';

export function startAnimation(renderer, scene, camera, controls, barGroup, bars, lights, audioManager) {
    const clock = new THREE.Clock();
    const progressFill   = document.getElementById('progressFill');
    const currentTimeEl  = document.getElementById('currentTime');
    const totalTimeEl    = document.getElementById('totalTime');

    function animate() {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime();

        // --- Leer frecuencia del audio y actualizar barras ---
        const bufferLength = audioManager.bufferLength;
        const freqData     = audioManager.getFrequencyData();
        const avgEnergy    = updateBars(bars, freqData, audioManager.isPlaying, time, bufferLength);

        // --- Rotación sutil del grupo de barras ---
        barGroup.rotation.y = Math.sin(time * 0.15) * 0.08;

        // --- Luces pulsando con la música ---
        lights.accentLight1.intensity = 3 + avgEnergy * 6;
        lights.accentLight2.intensity = 2 + avgEnergy * 5;

        // --- Niebla que respira ---
        scene.fog.density = 0.018 + avgEnergy * 0.025;

        // --- Fondo que se ilumina sutilmente ---
        scene.background.setRGB(
            0.02 + avgEnergy * 0.04,
            0.015 + avgEnergy * 0.01,
            0.06 + avgEnergy * 0.03
        );

        // --- Controles y render ---
        controls.update();
        renderer.render(scene, camera);

        // --- Barra de progreso y tiempo ---
        const audio = audioManager.audioElement;
        if (audioManager.hasAudio && audio.duration && !isNaN(audio.duration)) {
            const pct = (audio.currentTime / audio.duration) * 100;
            progressFill.style.width = pct + '%';
            currentTimeEl.textContent = formatTime(audio.currentTime);
            totalTimeEl.textContent   = formatTime(audio.duration);
        }
    }

    animate();
}
