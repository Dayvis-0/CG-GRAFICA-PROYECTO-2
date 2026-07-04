import * as THREE from 'three';

/**
 * Control de cámara en primera persona (FPS) para navegar dentro del cuarto.
 * - Mouse drag / movement: mirar alrededor (yaw/pitch)
 * - WASD / Flechas: moverse hacia adelante/atrás/izquierda/derecha
 * - Cámara confinada dentro de los límites del cuarto
 *
 * @param {THREE.PerspectiveCamera} camera
 * @param {THREE.WebGLRenderer} renderer
 * @param {object} roomBounds - { half: number, height: number, margin: number }
 */
export function setupCameraFPS(camera, renderer, roomBounds) {
    const { half, margin } = roomBounds;
    const limit = half - margin;

    // Estado de rotación
    let yaw = 0;      // rotación horizontal (eje Y)
    let pitch = 0;    // rotación vertical (eje X)

    // Estado de movimiento (solo WASD — flechas son para mover piezas)
    const keys = { w: false, a: false, s: false, d: false };

    // Mouse look
    let isDragging = false;
    let lastX = 0, lastY = 0;

    const el = renderer.domElement;

    // ── Mouse: click + drag para mirar ───
    el.addEventListener('mousedown', (e) => {
        // No interferir con drag de piezas
        if (window.__draggingPiece) return;
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        el.style.cursor = 'grabbing';
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
        el.style.cursor = 'default';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;

        // Sensibilidad
        yaw -= dx * 0.003;
        pitch -= dy * 0.003;

        // Clamp pitch para no voltear la cámara
        const maxPitch = Math.PI / 2 - 0.05;
        pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));

        updateCameraRotation();
    });

    // ── Teclado: solo WASD (flechas reservadas para mover piezas) ───
    window.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        if (k in keys) keys[k] = true;
    });

    window.addEventListener('keyup', (e) => {
        const k = e.key.toLowerCase();
        if (k in keys) keys[k] = false;
    });

    // ── Actualizar rotación de cámara ───
    function updateCameraRotation() {
        camera.rotation.order = 'YXZ';
        camera.rotation.y = yaw;
        camera.rotation.x = pitch;
    }

    // ── Actualizar posición con colisiones ───
    const speed = 0.08;
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    const move = new THREE.Vector3();

    function updateMovement() {
        // Vectores de dirección basados en yaw
        forward.set(Math.sin(yaw), 0, Math.cos(yaw));
        right.set(Math.sin(yaw + Math.PI / 2), 0, Math.cos(yaw + Math.PI / 2));

        move.set(0, 0, 0);

        if (keys.w) move.sub(forward);
        if (keys.s) move.add(forward);
        if (keys.a) move.sub(right);
        if (keys.d) move.add(right);

        if (move.lengthSq() > 0) {
            move.normalize().multiplyScalar(speed);
            camera.position.x += move.x;
            camera.position.z += move.z;

            // Confinar dentro del cuarto
            camera.position.x = Math.max(-limit, Math.min(limit, camera.position.x));
            camera.position.z = Math.max(-limit, Math.min(limit, camera.position.z));
        }

        // Altura fija de ojos
        camera.position.y = 1.6;

        updateCameraRotation();
    }

    // ── Loop de actualización (llamado desde index.js animate) ───
    function update() {
        updateMovement();
    }

    // Inicializar
    updateCameraRotation();
    camera.position.set(0, 1.6, 0);

    return { update };
}