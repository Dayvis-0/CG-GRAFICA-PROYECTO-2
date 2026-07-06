import * as CANNON from 'cannon-es';

/**
 * Mundo de físicas cannon-es.
 * Responsabilidad ÚNICA: mantener el world, los materiales y los contact materials.
 * No sabe de meshes de Three ni de reglas del juego.
 *
 * @returns {{
 *   world: CANNON.World,
 *   materials: { piece: CANNON.Material, wall: CANNON.Material, panel: CANNON.Material, ground: CANNON.Material },
 *   step: (dt: number) => void,
 * }}
 */
export function createPhysicsWorld() {
    const world = new CANNON.World({
        gravity: new CANNON.Vec3(0, -20, 0), // g más fuerte que 9.8 → se siente más real en escala de cuarto
    });

    // Broadphase: las piezas son pocas, NaiveBroadphase suficiente y exacto
    world.broadphase = new CANNON.NaiveBroadphase();

    // Solver: más iteraciones = contactos más estables
    // Aumentado de 12 a 20 para resolver mejor colisiones contra paredes
    // delgadas (minThick=0.5) y evitar que piezas rápidas atraviesen.
    world.solver.iterations = 30;

    // Sleep: cuerpos quietos no consumen CPU
    world.allowSleep = true;

    // ─── Materiales de colisión ────────────────────────────────────
    const materials = {
        piece:  new CANNON.Material('piece'),
        wall:   new CANNON.Material('wall'),
        panel:  new CANNON.Material('panel'),
        ground: new CANNON.Material('ground'),
    };

    // Pieza vs pieza: fricción media, rebote bajo
    world.addContactMaterial(new CANNON.ContactMaterial(materials.piece, materials.piece, {
        friction: 0.45,
        restitution: 0.05,
    }));

    // Pieza vs pared: fricción alta (que no resbale)
    world.addContactMaterial(new CANNON.ContactMaterial(materials.piece, materials.wall, {
        friction: 0.6,
        restitution: 0.02,
    }));

    // Pieza vs panel perforado: fricción media
    world.addContactMaterial(new CANNON.ContactMaterial(materials.piece, materials.panel, {
        friction: 0.45,
        restitution: 0.02,
    }));

    // Pieza vs piso del cuarto: media/alta
    world.addContactMaterial(new CANNON.ContactMaterial(materials.piece, materials.ground, {
        friction: 0.7,
        restitution: 0.02,
    }));

    /**
     * Avanza la simulación usando fixedStep con substeps de 1/240.
     * Cuádruple de substeps vs el estándar 1/60: mínimo tunneling incluso
     * con gravedad fuerte (-20) y piezas rebotando contra bordes delgados.
     * El dt real se capa a 1/30 en AnimationLoop para evitar espiral de muerte.
     * @param {number} dt — tiempo real desde el último frame (capped arriba)
     */
    function step(dt) {
        // fixedStep(timestep, deltaTime): toma tantos substeps de timestep
        // como sea necesario para cubrir deltaTime.
        // 1/240 en vez de 1/120: el doble de substeps → aún menos tunneling
        world.fixedStep(1 / 240, dt);
    }

    return { world, materials, step };
}
