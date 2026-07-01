import * as THREE from 'three';

/**
 * Configura el control de órbita manual (drag + wheel)
 * sobre el domElement del renderer. Modifica ambas cámaras
 * (perspectiva y ortográfica) simultáneamente.
 *
 * @param {{ perspCam, orthoCam }} cameras
 * @param {THREE.WebGLRenderer}    renderer
 */
export function setupCameraOrbit(cameras, renderer) {
    const controlsTarget = new THREE.Vector3(0, 1, 0);

    let isDragging = false;
    let prevX = 0, prevY = 0;

    // Calcular ángulos iniciales desde la posición inicial de la cámara (0, 5, 11)
    let camTheta = Math.atan2(11, 0);                              // ~π/2
    let camPhi   = Math.acos(5 / Math.sqrt(5 * 5 + 11 * 11));     // ángulo polar
    let camDist  = Math.sqrt(5 * 5 + 11 * 11);

    function updateCameraOrbit() {
        const x = controlsTarget.x + camDist * Math.sin(camPhi) * Math.sin(camTheta);
        const y = controlsTarget.y + camDist * Math.cos(camPhi);
        const z = controlsTarget.z + camDist * Math.sin(camPhi) * Math.cos(camTheta);

        cameras.perspCam.position.set(x, y, z);
        cameras.perspCam.lookAt(controlsTarget);

        cameras.orthoCam.position.set(x, y, z);
        cameras.orthoCam.lookAt(controlsTarget);
    }

    // --- Mouse drag ---
    renderer.domElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        prevX = e.clientX;
        prevY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        if (window.__dragObject) return; // ← si se está arrastrando un objeto, no rotar cámara
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        camTheta -= dx * 0.005;
        camPhi   -= dy * 0.005;
        camPhi    = Math.max(0.2, Math.min(Math.PI - 0.2, camPhi));
        prevX = e.clientX;
        prevY = e.clientY;
        updateCameraOrbit();
    });

    // --- Scroll zoom ---
    renderer.domElement.addEventListener('wheel', (e) => {
        camDist += e.deltaY * 0.01;
        camDist  = Math.max(4, Math.min(22, camDist));
        updateCameraOrbit();
    });

    updateCameraOrbit();
}
