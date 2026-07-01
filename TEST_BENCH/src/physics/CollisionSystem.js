/**
 * Sistema de colisiones, empuje (push) y apilamiento (stack).
 *
 * Empujar: cuando dos objetos al mismo nivel Y se superponen en XZ,
 *          se separan horizontalmente. El que se mueve empuja al otro.
 *
 * tryMove()  → para teclado (sin auto‑stack).
 * dragMove() → para arrastre con mouse (auto‑stack continuo: sube/baja Y
 *              según si está sobre otro objeto, SIN snap de XZ).
 */

const STACK_HEIGHT = 1.6;
const GROUND_Y     = 1.1;

/**
 * @param {object} objects — key → { mesh, ring, def, state }
 * @returns {{ tryMove, dragMove, stackSelected, isStacked }}
 */
export function createCollisionSystem(objects) {
    const stackedOn = {}; // keyDelStacker → keyDelQueEstaAbajo

    // ──────────────────────────────────────────────
    //  MOVER un objeto + todo lo que tenga encima
    // ──────────────────────────────────────────────
    function moveWithStack(key, dx, dz) {
        const o = objects[key];
        o.mesh.position.x += dx;
        o.mesh.position.z += dz;
        o.ring.position.x = o.mesh.position.x;
        o.ring.position.z = o.mesh.position.z;

        for (const [stacker, target] of Object.entries(stackedOn)) {
            if (target === key) moveWithStack(stacker, dx, dz);
        }
    }

    // ──────────────────────────────────────────────
    //  RESOLVER COLISIONES
    // ──────────────────────────────────────────────
    function resolveCollisions(movedKey) {
        let iter = 0;
        const MAX_ITER = 8;
        let dirty = true;

        while (dirty && iter < MAX_ITER) {
            dirty = false;
            iter++;
            const keys = Object.keys(objects);

            for (let i = 0; i < keys.length; i++) {
                for (let j = i + 1; j < keys.length; j++) {
                    const ka = keys[i], kb = keys[j];
                    const a  = objects[ka], b  = objects[kb];

                    if (Math.abs(a.mesh.position.y - b.mesh.position.y) > 0.5) continue;

                    const dx = b.mesh.position.x - a.mesh.position.x;
                    const dz = b.mesh.position.z - a.mesh.position.z;
                    const distSq = dx * dx + dz * dz;
                    const minDist = a.def.boundingRadius + b.def.boundingRadius;

                    if (distSq < minDist * minDist && distSq > 0.0001) {
                        dirty = true;
                        const dist   = Math.sqrt(distSq);
                        const overlap = minDist - dist;
                        const nx = dx / dist;
                        const nz = dz / dist;

                        const isA = ka === movedKey;
                        const isB = kb === movedKey;
                        let fa, fb;
                        if      (isA) { fa = 0.2; fb = 0.8; }
                        else if (isB) { fa = 0.8; fb = 0.2; }
                        else          { fa = 0.5; fb = 0.5; }

                        moveWithStack(ka, -nx * overlap * fa, -nz * overlap * fa);
                        moveWithStack(kb,  nx * overlap * fb,  nz * overlap * fb);
                    }
                }
            }
        }
    }

    // ──────────────────────────────────────────────
    //  tryMove  —  para teclado (sin auto‑stack)
    // ──────────────────────────────────────────────
    function tryMove(key, dx, dz) {
        const o = objects[key];

        if (stackedOn[key]) {
            const base = objects[stackedOn[key]];
            const newX = o.mesh.position.x + dx;
            const newZ = o.mesh.position.z + dz;
            const distToBase = Math.sqrt(
                (newX - base.mesh.position.x) ** 2 +
                (newZ - base.mesh.position.z) ** 2
            );
            if (distToBase > o.def.boundingRadius + base.def.boundingRadius + 0.3) {
                unstack(key);
            }
        }

        moveWithStack(key, dx, dz);
        resolveCollisions(key);
        return true;
    }

    // ──────────────────────────────────────────────
    //  dragMove  —  para mouse (auto‑stack continuo)
    // ──────────────────────────────────────────────
    function dragMove(key, dx, dz) {
        // Mover
        moveWithStack(key, dx, dz);

        // Auto‑stack ANTES de resolver colisiones: si el objeto ya fue
        // elevado (stack), no choca con los objetos del suelo.
        updateDragStack(key);

        resolveCollisions(key);
    }

    function updateDragStack(key) {
        const o = objects[key];

        // Si ya está apilado, ver si sigue sobre la base
        if (stackedOn[key]) {
            const base = objects[stackedOn[key]];
            const dist = Math.sqrt(
                (o.mesh.position.x - base.mesh.position.x) ** 2 +
                (o.mesh.position.z - base.mesh.position.z) ** 2
            );
            const minDist = o.def.boundingRadius + base.def.boundingRadius;

            if (dist >= minDist) {
                // Ya no alcanza la base → desapilar
                unstack(key);
            }
            // Si todavía la alcanza, se queda apilado — no hacemos nada
            return;
        }

        // No está apilado → buscar un objeto de suelo para apilarse
        let targetKey = null;

        for (const otherKey of Object.keys(objects)) {
            if (otherKey === key) continue;

            const other = objects[otherKey];
            // Solo apilar sobre objetos que están a nivel del suelo
            if (Math.abs(other.mesh.position.y - GROUND_Y) > 0.1) continue;

            const dx = o.mesh.position.x - other.mesh.position.x;
            const dz = o.mesh.position.z - other.mesh.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            const minDist = o.def.boundingRadius + other.def.boundingRadius;

            if (dist < minDist) {
                targetKey = otherKey;
                break;
            }
        }

        if (targetKey) {
            doStackSoft(key, targetKey);
        }
    }

    /**
     * Apila SIN mover XZ — solo eleva Y.
     * Busca el tope de la pila existente (si alguien ya está arriba)
     * y coloca el objeto sobre ESE tope. Apilamiento ilimitado.
     */
    function doStackSoft(key, targetKey) {
        const o      = objects[key];
        const topKey = findTopOfStack(targetKey);
        const top    = objects[topKey];
        o.mesh.position.y = top.mesh.position.y + STACK_HEIGHT;
        stackedOn[key] = topKey;
    }

    /**
     * Recorre la cadena de stackedOn desde `key` hacia arriba
     * hasta encontrar el objeto que está en el tope (sin nadie encima).
     */
    function findTopOfStack(key) {
        let current = key;
        let found = true;
        while (found) {
            found = false;
            for (const [stacker, target] of Object.entries(stackedOn)) {
                if (target === current) {
                    current = stacker;
                    found = true;
                    break;
                }
            }
        }
        return current;
    }

    // ──────────────────────────────────────────────
    //  stackSelected  —  apilado manual (con snap XZ)
    // ──────────────────────────────────────────────
    function stackSelected(key) {
        if (stackedOn[key]) return false;

        const o = objects[key];
        let closestKey = null;
        let closestDist = Infinity;

        for (const otherKey of Object.keys(objects)) {
            if (otherKey === key) continue;
            const other = objects[otherKey];

            const hasStack = Object.values(stackedOn).includes(otherKey);
            if (hasStack) continue;

            const dx = o.mesh.position.x - other.mesh.position.x;
            const dz = o.mesh.position.z - other.mesh.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            const range = o.def.boundingRadius + other.def.boundingRadius;

            if (dist < range + 0.5 && dist < closestDist) {
                closestDist = dist;
                closestKey  = otherKey;
            }
        }

        if (closestKey) {
            doStack(key, closestKey);
            return true;
        }
        return false;
    }

    function doStack(key, targetKey) {
        const o      = objects[key];
        const target = objects[targetKey];
        o.mesh.position.x = target.mesh.position.x;
        o.mesh.position.z = target.mesh.position.z;
        o.ring.position.x = target.mesh.position.x;
        o.ring.position.z = target.mesh.position.z;
        o.mesh.position.y = target.mesh.position.y + STACK_HEIGHT;
        stackedOn[key] = targetKey;
    }

    // ──────────────────────────────────────────────
    //  unstack
    // ──────────────────────────────────────────────
    function unstack(key) {
        if (!stackedOn[key]) return;
        const o = objects[key];
        o.mesh.position.y = GROUND_Y;
        delete stackedOn[key];
        for (const [k, v] of Object.entries(stackedOn)) {
            if (v === key) unstack(k);
        }
    }

    function isStacked(key) {
        return !!stackedOn[key];
    }

    return { tryMove, dragMove, stackSelected, isStacked };
}
