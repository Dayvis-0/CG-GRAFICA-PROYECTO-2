import * as THREE from 'three';

/**
 * Control de cámara en primera persona (FPS).
 * - El estado del teclado (WASD) y pointer lock se lee de InputManager.
 * - El mouse look (yaw/pitch) se maneja acá por ser propio de la cámara.
 *
 * @param {THREE.PerspectiveCamera} camera
 * @param {THREE.WebGLRenderer} renderer
 * @param {object} roomBounds        — { half: number, height: number, margin: number }
 * @param {THREE.Mesh[]} obstacles   — meshes con los que colisionar
 * @param {{ current: boolean }} draggingRef — ref compartida con DragManager
 * @param {object} inputManager      — { isDown(key), isPointerLocked() }
 */
export function setupCameraFPS(camera, renderer, roomBounds, obstacles = [], draggingRef = { current: false }, inputManager) {
    const { half, height, margin } = roomBounds;
    const limit = half - margin;
    const yMin = margin;
    const yMax = height - margin;

    // Estado de rotación (exclusivo de la cámara)
    let yaw = 0;
    let pitch = 0;
    let isLocked = false;

    // ─── Pointer Lock ─────────────────────────────────────────────

    document.addEventListener('pointerlockchange', () => {
        isLocked = inputManager.isPointerLocked();
        renderer.domElement.style.cursor = isLocked ? 'none' : 'default';
    });

    // Click en canvas → bloquear mouse para control de cámara
    const el = renderer.domElement;
    el.addEventListener('click', () => {
        if (!isLocked && !draggingRef.current) {
            el.requestPointerLock();
        }
    });

    // ─── Mouse look ──────────────────────────────────────────────

    document.addEventListener('mousemove', (e) => {
        if (!isLocked || draggingRef.current) return;

        yaw -= e.movementX * 0.003;
        pitch -= e.movementY * 0.003;

        const maxPitch = Math.PI / 2 - 0.05;
        pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));

        updateCameraRotation();
    });

    // ─── Rotación ────────────────────────────────────────────────

    function updateCameraRotation() {
        camera.rotation.order = 'YXZ';
        camera.rotation.y = yaw;
        camera.rotation.x = pitch;
    }

    // ─── Movimiento (WASD desde InputManager) ────────────────────

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
        forward.set(
            Math.sin(yaw) * Math.cos(pitch),
            -Math.sin(pitch),
            Math.cos(yaw) * Math.cos(pitch)
        );
        right.set(
            Math.sin(yaw + Math.PI / 2),
            0,
            Math.cos(yaw + Math.PI / 2)
        );

        move.set(0, 0, 0);

        if (inputManager.isDown('w')) move.sub(forward);
        if (inputManager.isDown('s')) move.add(forward);
        if (inputManager.isDown('a')) move.sub(right);
        if (inputManager.isDown('d')) move.add(right);

        if (move.lengthSq() > 0) {
            move.normalize().multiplyScalar(speed);

            target.copy(camera.position).add(move);

            target.x = Math.max(-limit, Math.min(limit, target.x));
            target.y = Math.max(yMin, Math.min(yMax, target.y));
            target.z = Math.max(-limit, Math.min(limit, target.z));

            if (!isBlocked(target)) {
                camera.position.copy(target);
            }
        }

        updateCameraRotation();
    }

    // ─── Update (llamado desde AnimationLoop) ────────────────────

    function update() {
        updateMovement();
    }

    updateCameraRotation();
    camera.position.set(5, 1.6, 5);

    return { update };
}
