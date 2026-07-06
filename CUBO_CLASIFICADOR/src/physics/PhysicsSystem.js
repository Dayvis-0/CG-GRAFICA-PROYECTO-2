import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * Sistema de físicas basado en cannon-es.
 * Responsabilidad ÚNICA: por frame, step el mundo y sincronizar los meshes
 * de Three con sus cuerpos de cannon. Maneja el modo kinematic (drag) y el
 * modo dinámico (decaen por gravedad, chocan y vuelcan).
 *
 * Ya no implementa lógica de "estabilidad ni empuje" a mano — eso lo hace
 * cannon-es internamente con su solver de contactos.
 *
 * @param {THREE.Group} piecesGroup      — grupo con los meshes de las piezas
 * @param {object}       bodyFactory      — { getBody(mesh) }
 * @param {object}       physicsWorld     — { step(dt) }
 * @param {object}       classifierRules  — { isOverOwnHole(mesh) } (lector de succion del hueco)
 */
export function createPhysicsSystem(piecesGroup, bodyFactory, physicsWorld, classifierRules) {
    /** @type {Set<THREE.Mesh>} */
    const kinematicPieces = new Set();

    // ─── Modo kinematic (drag) ──────────────────────────────────

    /**
     * Pone una pieza en modo kinematic: cannon no aplica gravedad sobre ella
     * pero otras piezas dinámicas chocan contra ella. La posición es
     * controlada por el DragManager vía setKinematicPosition.
     *
     * @param {THREE.Mesh} mesh
     * @param {boolean}    kinematic
     */
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
            // Al soltar: vuelve a dinámico, con velocidad cero para que
            // la gravedad tome el control gradualmente
            body.type = CANNON.Body.DYNAMIC;
            body.velocity.setZero();
            body.angularVelocity.setZero();
            body.wakeUp();
            kinematicPieces.delete(mesh);
        }
    }

    /**
     * Usado por DragManager: mueve la pieza kinematic a una posición.
     * Cannon calcula velocity/angularVelocity internamente para que
     * las piezas que estaban apoyadas no peguen un salto.
     *
     * @param {THREE.Mesh} mesh
     * @param {THREE.Vector3} pos
     */
    function setKinematicPosition(mesh, pos) {
        const body = bodyFactory.getBody(mesh);
        if (!body) return;
        body.position.set(pos.x, pos.y, pos.z);
        // No tocamos quaternion en drag (la pieza queda en su orientación actual)
    }

    // ─── Succion del hueco ──────────────────────────────────────
    // Cuando una pieza dinámica está justo sobre el hueco correcto a la altura
    // del panel, le damos un pequeño empuje hacia abajo para "enganchearla".
    // (Cannon no tiene forma nativa de saber qué pieza "debería" caer por un
    // hueco — esa es la regla del juego, no física pura).

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

    // ─── Update por frame ───────────────────────────────────────

    /**
     * Avanza la simulación copiando mesh ≈ body para todas las piezas dinámicas.
     * @param {number} dt
     * @param {THREE.Mesh|null} draggedMesh — pieza kinematic; no se sincroniza desde acá
     */
    function update(dt, draggedMesh) {
        // 1. Aplicar succion del hueco a piezas dinámicas
        for (const child of piecesGroup.children) {
            if (!child.isMesh || child === draggedMesh) continue;
            applyHoleSuction(child);
        }

        // 2. Avanzar el mundo cannon
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
