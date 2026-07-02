import * as THREE from 'three';

const STEP_SIZE = 0.04; // unidades por sub-paso (menor = más preciso contra tunneling)

/**
 * Configura arrastre con mouse para las piezas, con detección de colisiones
 * contra otras piezas y el cubo clasificador.
 *
 * @param {THREE.PerspectiveCamera}  camera
 * @param {THREE.WebGLRenderer}      renderer
 * @param {object}                   opts
 * @param {THREE.Group}              opts.piecesGroup       — grupo que contiene los 6 mesh de piezas
 * @param {THREE.Mesh[]}             opts.classifierMeshes  — todas las paredes + panel del clasificador
 * @param {OrbitControls}            opts.controls          — controles de órbita (se deshabilitan al arrastrar)
 */
export function setupDragManager(camera, renderer, { piecesGroup, classifierMeshes, controls }) {
    const raycaster = new THREE.Raycaster();
    const pointer   = new THREE.Vector2();
    const dragPlane = new THREE.Plane();
    const camDir    = new THREE.Vector3();
    const target    = new THREE.Vector3();
    const offset    = new THREE.Vector3();
    const boxA      = new THREE.Box3();
    const boxB      = new THREE.Box3();
    const delta     = new THREE.Vector3();

    /** @type {THREE.Mesh | null} */
    let selected = null;
    let dragging = false;

    // ── Obtener los mesh hijos del grupo de piezas ──
    function getPieceMeshes() {
        return piecesGroup.children.filter(c => c.isMesh);
    }

    // ── Obtener todos los obstáculos (otras piezas + clasificador) ──
    function getObstacles(exclude) {
        const pieces = getPieceMeshes().filter(p => p !== exclude);
        return [...pieces, ...classifierMeshes];
    }

    // ── Mover con sweep (sub-stepping) para evitar tunneling ──
    function sweepMove(mesh, targetPos) {
        const start = mesh.position.clone();
        delta.copy(targetPos).sub(start);
        const dist = delta.length();

        if (dist < 0.001) return; // apenas se mueve, saltear

        const steps = Math.max(1, Math.ceil(dist / STEP_SIZE));
        const stepDelta = delta.clone().divideScalar(steps);

        const obstacles = getObstacles(mesh);

        for (let i = 1; i <= steps; i++) {
            const testPos = start.clone().addScaledVector(stepDelta, i);
            mesh.position.copy(testPos);
            mesh.updateMatrixWorld(true);
            boxA.setFromObject(mesh);

            let hit = false;
            for (const ob of obstacles) {
                if (!ob.visible) continue;
                boxB.setFromObject(ob);
                if (boxA.intersectsBox(boxB)) {
                    hit = true;
                    break;
                }
            }

            if (hit) {
                // Restaurar a la última posición válida
                const validPos = i > 1
                    ? start.clone().addScaledVector(stepDelta, i - 1)
                    : start;
                mesh.position.copy(validPos);
                mesh.updateMatrixWorld(true);
                return;
            }
        }

        // Sin colisión — mover completo
        mesh.position.copy(targetPos);
        mesh.updateMatrixWorld(true);
    }

    // ── Pointer down: seleccionar pieza ──
    function onPointerDown(e) {
        pointer.x =  (e.clientX / window.innerWidth)  * 2 - 1;
        pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(getPieceMeshes(), false);

        if (hits.length === 0) return;

        selected = hits[0].object;
        dragging = true;

        // Deshabilitar orbit mientras se arrastra
        if (controls) controls.enabled = false;

        // Plano perpendicular a la cámara → arrastre libre en 3D
        camera.getWorldDirection(camDir);
        dragPlane.setFromNormalAndCoplanarPoint(camDir, selected.position);
        raycaster.ray.intersectPlane(dragPlane, target);
        offset.copy(target).sub(selected.position);

        renderer.domElement.style.cursor = 'grabbing';
    }

    // ── Pointer move: arrastrar con sweep ──
    function onPointerMove(e) {
        pointer.x =  (e.clientX / window.innerWidth)  * 2 - 1;
        pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

        if (!dragging || !selected) return;

        raycaster.setFromCamera(pointer, camera);
        raycaster.ray.intersectPlane(dragPlane, target);

        const newPos = target.clone().sub(offset);

        // No atravesar el suelo (cada pieza tiene su altura mínima)
        if (selected.userData.minY !== undefined) {
            newPos.y = Math.max(selected.userData.minY, newPos.y);
        }

        sweepMove(selected, newPos);
    }

    // ── Pointer up: soltar ──
    function onPointerUp() {
        if (selected) selected = null;
        dragging = false;
        if (controls) controls.enabled = true;
        renderer.domElement.style.cursor = 'default';
    }

    // ── Registrar eventos ──
    const el = renderer.domElement;
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);

    return {
        dispose() {
            el.removeEventListener('pointerdown', onPointerDown);
            el.removeEventListener('pointermove', onPointerMove);
            el.removeEventListener('pointerup', onPointerUp);
        },
    };
}
