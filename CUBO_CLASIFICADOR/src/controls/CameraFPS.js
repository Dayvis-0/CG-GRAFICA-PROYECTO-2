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
export function setupCameraFPS(camera, renderer, roomBounds, obstacles = []) {
    const { half, height, margin } = roomBounds;
    const limit = half - margin;
    const yMin = margin;
    const yMax = height - margin;

    // Estado de rotación
    let yaw = 0;      // rotación horizontal (eje Y)
    let pitch = 0;    // rotación vertical (eje X)

    // Estado de movimiento (solo WASD — flechas son para mover piezas)
    const keys = { w: false, a: false, s: false, d: false };
    // Mapa de código físico por si e.key falla en algunos navegadores
    const CODE_MAP = { KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd' };

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
        pitch += dy * 0.003;

        // Clamp pitch para no voltear la cámara
        const maxPitch = Math.PI / 2 - 0.05;
        pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));

        updateCameraRotation();
    });

    // ── Teclado: solo WASD (flechas reservadas para mover piezas) ───
    window.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        if (k in keys) {
            keys[k] = true;
            e.preventDefault();
        } else if (CODE_MAP[e.code]) {
            keys[CODE_MAP[e.code]] = true;
            e.preventDefault();
        }
    });

    window.addEventListener('keyup', (e) => {
        const k = e.key.toLowerCase();
        if (k in keys) {
            keys[k] = false;
            e.preventDefault();
        } else if (CODE_MAP[e.code]) {
            keys[CODE_MAP[e.code]] = false;
            e.preventDefault();
        }
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
    const target = new THREE.Vector3();
    const _box = new THREE.Box3();
    const COLLIDE_MARGIN = 0.35;

    function isBlocked(pos) {
        for (const mesh of obstacles) {
            if (!mesh.visible) continue;
            _box.setFromObject(mesh);
            if (
                pos.x >= _box.min.x - COLLIDE_MARGIN &&
                pos.x <= _box.max.x + COLLIDE_MARGIN &&
                pos.y >= _box.min.y - COLLIDE_MARGIN &&
                pos.y <= _box.max.y + COLLIDE_MARGIN &&
                pos.z >= _box.min.z - COLLIDE_MARGIN &&
                pos.z <= _box.max.z + COLLIDE_MARGIN
            ) {
                return true;
            }
        }
        return false;
    }

    function updateMovement() {
        // Dirección hacia adelante basada en yaw Y pitch (vuelo libre)
        forward.set(
            Math.sin(yaw) * Math.cos(pitch),
            -Math.sin(pitch),
            Math.cos(yaw) * Math.cos(pitch)
        );
        // Derecha solo horizontal (yaw), como strafe de FPS
        right.set(
            Math.sin(yaw + Math.PI / 2),
            0,
            Math.cos(yaw + Math.PI / 2)
        );

        move.set(0, 0, 0);

        if (keys.w) move.sub(forward);
        if (keys.s) move.add(forward);
        if (keys.a) move.sub(right);
        if (keys.d) move.add(right);

        if (move.lengthSq() > 0) {
            move.normalize().multiplyScalar(speed);

            // Calcular posición deseada
            target.copy(camera.position).add(move);

            // Confinar dentro del cuarto
            target.x = Math.max(-limit, Math.min(limit, target.x));
            target.y = Math.max(yMin, Math.min(yMax, target.y));
            target.z = Math.max(-limit, Math.min(limit, target.z));

            // Chequear colisión con obstáculos
            if (!isBlocked(target)) {
                camera.position.copy(target);
            }
        }

        updateCameraRotation();
    }

    // ── Loop de actualización (llamado desde index.js animate) ───
    function update() {
        updateMovement();
    }

    // Inicializar
    updateCameraRotation();
    camera.position.set(5, 1.6, 5);

    return { update };
}