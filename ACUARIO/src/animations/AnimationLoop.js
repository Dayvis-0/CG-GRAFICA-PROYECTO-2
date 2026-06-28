import * as THREE from 'three';
import { updateFish }   from '../objects/Fish.js';
import { updateBubbles } from '../objects/Bubbles.js';
import { updatePlants }  from '../objects/Plants.js';

/**
 * BUCLE DE ANIMACIÓN PRINCIPAL
 *
 * Cada frame:
 *   - Mueve los peces en sus trayectorias orbitales
 *   - Anima las burbujas subiendo y oscilando
 *   - Mece las plantas con la corriente simulada
 *   - Pulsa las luces submarinas suavemente
 *   - Actualiza el HUD de conceptos
 */
export function startAnimation(
    renderer, scene, controls,
    fishData, bubbles, plantData, lights,
    waterRef, conceptPanelUpdater
) {
    const clock = new THREE.Clock();
    let frameCount = 0;

    function animate() {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime();
        frameCount++;

        // ── Actualizar peces ──
        updateFish(fishData, time);

        // ── Actualizar burbujas ──
        updateBubbles(bubbles, time);

        // ── Actualizar plantas ──
        updatePlants(plantData, time);

        // ── Luz submarina pulsante ──
        lights.submarine1.intensity = 3 + Math.sin(time * 0.5) * 1.2;
        lights.submarine2.intensity = 3 + Math.cos(time * 0.7) * 1.2;

        // ── Luz direccional con leve oscilación ──
        lights.directional.position.x = 3 + Math.sin(time * 0.15) * 2;
        lights.directional.position.z = 5 + Math.cos(time * 0.2) * 2;

        // ── Agua con leve pulso de opacidad (solo si visible) ──
        if (waterRef && waterRef.material && waterRef.visible) {
            const baseOpacity = waterRef.userData?.baseOpacity ?? 0.4;
            waterRef.material.opacity = baseOpacity + Math.sin(time * 0.3) * 0.03;
        }

        // ── Controles orbitales y render ──
        controls.update();
        renderer.render(scene, controls.object);

        // ── Actualizar HUD cada 15 frames ──
        if (frameCount % 15 === 0 && conceptPanelUpdater) {
            conceptPanelUpdater();
        }
    }

    animate();
}
