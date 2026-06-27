import * as THREE from 'three';

/**
 * Crea el renderizador WebGL con antialiasing y tone mapping.
 * Habilita el mapeo de sombras (PCF soft) para el efecto de realismo.
 */
export function createRenderer(container) {
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    // Tamaño y calidad
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Tone mapping (estilo cinematográfico)
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // --- Sombras (efecto de realismo) ---
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    return renderer;
}
