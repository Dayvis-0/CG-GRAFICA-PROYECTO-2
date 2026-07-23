import * as THREE from 'three';

/**
 * Control de cámara en primera persona (FPS).
 * - El estado del teclado y pointer lock se lee de InputManager.
 * - El mouse look (yaw/pitch) se maneja acá por ser propio de la cámara.
 * - El pointerlockchange NO se duplica: InputManager ya lo trackea.
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

    // Click en canvas → bloquear mouse para control de cámara
    const el = renderer.domElement;
    const onCanvasClick = () => {
        if (!inputManager.isPointerLocked() && !draggingRef.current) {
            el.requestPointerLock();
        }
    };
    el.addEventListener('click', onCanvasClick);

    // ─── Mouse look ──────────────────────────────────────────────
    const _onMouseMove = (e) => {
        if (!inputManager.isPointerLocked() || draggingRef.current) return;

        yaw -= e.movementX * 0.003;
        pitch -= e.movementY * 0.003;

        const maxPitch = Math.PI / 2 - 0.05;
        pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));

        updateCameraRotation();
    };
    document.addEventListener('mousemove', _onMouseMove);

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
    const COLLIDE_MARGIN = 0.35;

    // PERF-003: Precalcular AABBs de obstáculos estáticos (paredes, panel) una sola vez
    const obstacleBoxes = obstacles.map(mesh => new THREE.Box3().setFromObject(mesh));

    function isBlocked(pos) {
        for (let i = 0; i < obstacles.length; i++) {
            if (!obstacles[i].visible) continue;
            const box = obstacleBoxes[i];
            if (
                pos.x >= box.min.x - COLLIDE_MARGIN &&
                pos.x <= box.max.x + COLLIDE_MARGIN &&
                pos.y >= box.min.y - COLLIDE_MARGIN &&
                pos.y <= box.max.y + COLLIDE_MARGIN &&
                pos.z >= box.min.z - COLLIDE_MARGIN &&
                pos.z <= box.max.z + COLLIDE_MARGIN
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

    // ─── Dispose ─────────────────────────────────────────────────
    function dispose() {
        el.removeEventListener('click', onCanvasClick);
        document.removeEventListener('mousemove', _onMouseMove);
    }

    // ─── Inicializar ─────────────────────────────────────────────
    updateCameraRotation();

    return { update, dispose };
}