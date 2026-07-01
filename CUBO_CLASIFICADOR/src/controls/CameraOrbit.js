import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Configura controles de órbita para navegar la escena con el mouse:
 *   - Arrastrar → orbitar alrededor del objetivo
 *   - Rueda → zoom
 *   - Click derecho + arrastrar → panear
 *
 * @param {THREE.PerspectiveCamera} camera
 * @param {THREE.WebGLRenderer}     renderer
 * @returns {OrbitControls}
 */
export function setupCameraOrbit(camera, renderer) {
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.5, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 3;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.update();
    return controls;
}
