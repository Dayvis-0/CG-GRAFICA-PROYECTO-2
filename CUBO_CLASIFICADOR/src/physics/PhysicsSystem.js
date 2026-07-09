import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * Avanza el mundo cannon-es por frame y sincroniza meshes con sus bodies.
 * Gestiona modo kinematic (drag) y succión de huecos.
 */
export function createPhysicsSystem(piecesGroup, bodyFactory, physicsWorld, classifierRules) {
    /** @type {Set<THREE.Mesh>} */
    const kinematicPieces = new Set();

    // ─── Modo kinematic (drag) ─────────────────────────────────
    /** Activa/desactiva modo kinematic. En kinematic, cannon no aplica gravedad a la pieza. */
    function setKinematic(mesh, kinematic) {
        const body = bodyFactory.getBody(mesh);
        if (!body) return;

        if (kinematic) {
            body.type = CANNON.Body.KINEMATIC;
            body.velocity.setZero();
            body.angularVelocity.setZero();
            body.wakeUp();
            kinematicPieces.add(mesh);
        } else {
            // Al soltar: resincronizar body a la posición actual del mesh
            // (el dragManager mueve el mesh + body en simultáneo, pero el
            // solver de cannon puede acumular penetración contra el Trimesh
            // del panel. Si no resincronizamos, cannon eyecta la pieza).
            body.type = CANNON.Body.DYNAMIC;
            body.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
            body.quaternion.set(
                mesh.quaternion.x, mesh.quaternion.y,
                mesh.quaternion.z, mesh.quaternion.w,
            );
            // SÓLO velocidad hacia abajo — velocidad XY residual causa rebotes
            body.velocity.set(0, -2.5, 0);
            body.angularVelocity.setZero();
            body.wakeUp();
            kinematicPieces.delete(mesh);
        }
    }

    /** Mueve la pieza kinematic y deriva su velocidad para que empuje piezas vecinas. */
    function setKinematicPosition(mesh, pos) {
        const body = bodyFactory.getBody(mesh);
        if (!body) return;

        const oldX = body.position.x;
        const oldY = body.position.y;
        const oldZ = body.position.z;

        body.position.set(pos.x, pos.y, pos.z);

        // dt del substep: debe coincidir con el primer arg de world.fixedStep()
        const dt = 1 / 240;

        body.velocity.set(
            (pos.x - oldX) / dt,
            (pos.y - oldY) / dt,
            (pos.z - oldZ) / dt,
        );
        body.angularVelocity.setZero();

        body.wakeUp();

        // Despertar piezas dinámicas vecinas que estén dormidas, para que
        // reaccionen al empujón (cannon las deja dormir si están quietas).
        for (const child of piecesGroup.children) {
            if (!child.isMesh || child === mesh) continue;
            const other = bodyFactory.getBody(child);
            if (!other) continue;
            other.wakeUp();
        }
    }

    // ─── Succión del hueco ─────────────────────────────────────
    // Empuja la pieza hacia abajo cuando está sobre su hueco correcto.

    function applyHoleSuction(mesh) {
        if (!classifierRules || !classifierRules.isOverOwnHole) return;
        if (kinematicPieces.has(mesh)) return;

        // Si la pieza está cayendo y pasa cerca del hueco correcto, succionar
        if (classifierRules.isOverOwnHole(mesh)) {
            const body = bodyFactory.getBody(mesh);
            if (!body) return;
            // Sólo succionar si está descendiendo y cerca de la altura del panel
            if (body.position.y < 3.2 && body.velocity.y < 0.5) {
                body.velocity.y = -3.5; // empuje hacia abajo para que caiga por el hueco
            }
        }
    }

    /**
     * Avanza físicas y sincroniza meshes con sus bodies.
     * @param {number} dt
     * @param {THREE.Mesh|null} draggedMesh — pieza en drag; no se sincroniza desde acá
     */
    function update(dt, draggedMesh) {
        // 1. Aplicar succion del hueco a piezas dinámicas
        for (const child of piecesGroup.children) {
            if (!child.isMesh || child === draggedMesh) continue;
            applyHoleSuction(child);
        }

        // 2. Avanzar el mundo cannon (un único step por frame)
        physicsWorld.step(dt);

        // 3. Sincronizar body → mesh para piezas dinámicas (no kinematic)
        for (const child of piecesGroup.children) {
            if (!child.isMesh) continue;
            if (child === draggedMesh) continue; // kinematic: ya lo movió DragManager

            const body = bodyFactory.getBody(child);
            if (!body) continue;

            child.position.set(body.position.x, body.position.y, body.position.z);
            child.quaternion.set(
                body.quaternion.x,
                body.quaternion.y,
                body.quaternion.z,
                body.quaternion.w
            );
        }
    }

    return {
        update,
        setKinematic,
        setKinematicPosition,
    };
}