import * as THREE from 'three';

/**
 * Control de órbita manual para ambas cámaras (perspectiva y ortográfica).
 *
 * @param {{ perspCam: THREE.PerspectiveCamera, orthoCam: THREE.OrthographicCamera }} cameras
 * @param {THREE.WebGLRenderer} renderer
 */
export function setupCameraOrbit(cameras, renderer) {
    const target = new THREE.Vector3(0, 1.5, 0);

    // Calcular ángulos desde la posición inicial (6, 5, 8)
    const dx = 6, dy = 5 - target.y, dz = 8;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    let theta = Math.atan2(dz, dx);
    let phi   = Math.acos(dy / dist);
    let camDist = dist;

    let isDragging = false;
    let prevX = 0, prevY = 0;

    function update() {
        const x = target.x + camDist * Math.sin(phi) * Math.sin(theta);
        const y = target.y + camDist * Math.cos(phi);
        const z = target.z + camDist * Math.sin(phi) * Math.cos(theta);

        cameras.perspCam.position.set(x, y, z);
        cameras.perspCam.lookAt(target);

        cameras.orthoCam.position.set(x, y, z);
        cameras.orthoCam.lookAt(target);
    }

    const el = renderer.domElement;

    el.addEventListener('mousedown', (e) => {
        if (window.__draggingPiece) return; // no rotar si se arrastra pieza
        isDragging = true;
        prevX = e.clientX;
        prevY = e.clientY;
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        theta -= dx * 0.005;
        phi   -= dy * 0.005;
        phi    = Math.max(0.2, Math.min(Math.PI - 0.2, phi));
        prevX = e.clientX;
        prevY = e.clientY;
        update();
    });

    el.addEventListener('wheel', (e) => {
        camDist += e.deltaY * 0.01;
        camDist  = Math.max(4, Math.min(22, camDist));
        update();
    });

    update();

    return {
        update, // por si se necesita forzar actualización
    };
}
