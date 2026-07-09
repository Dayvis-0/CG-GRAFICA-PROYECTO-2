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
            // Al soltar la pieza:
            // 1) Sincronizar body.position con el mesh ANTES de pasar a DYNAMIC.
            //    Sin esto, si Cannon tiene el body en posición distinta (penetrando
            //    geometría), el solver lo eyecta "por todos lados" al liberarlo.
            // 2) Velocidad y angular a CERO absoluto.
            //    La velocidad kinematic derivada (delta/dt) puede ser enorme;
            //    descartarla por completo es lo correcto: la gravedad se encarga
            //    de la caída — igual que en la vida real al soltar un objeto.
            body.type = CANNON.Body.DYNAMIC;
            body.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
            body.quaternion.set(
                mesh.quaternion.x, mesh.quaternion.y,
                mesh.quaternion.z, mesh.quaternion.w,
            );
            // CRÍTICO: resetear velocidad DESPUÉS de setear posición.
            // Cannon puede acumular velocidad residual del modo kinematic;
            // si no se limpia aquí, la pieza sale disparada al soltar.
            body.velocity.setZero();
            body.angularVelocity.setZero();
            body.force.setZero();
            body.torque.setZero();
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

        // Derivar velocidad para que la pieza empuje a las vecinas durante el drag.
        // Se capea a MAX_KINEMATIC_SPEED para evitar velocidades bestiales si el
        // mouse apenas se mueve y el dt es microscópico (1/240 ≈ 0.004 s).
        const dt = 1 / 240;
        const MAX_KINEMATIC_SPEED = 15; // unidades/s — suficiente para empujar sin salir disparado

        const clamp = (v) => Math.max(-MAX_KINEMATIC_SPEED, Math.min(MAX_KINEMATIC_SPEED, v));
        body.velocity.set(
            clamp((pos.x - oldX) / dt),
            clamp((pos.y - oldY) / dt),
            clamp((pos.z - oldZ) / dt),
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