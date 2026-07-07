import * as CANNON from 'cannon-es';
import * as THREE from 'three';

/**
 * Fábrica de cuerpos rígidos cannon-es a partir de meshes Three.
 * Mantiene el mapeo mesh ↔ body en un Map, accesible vía getBody(mesh).
 *
 * Cada pieza usa la forma más exacta posible (primitiva o Trimesh).
 * Las paredes y el panel son estáticos (mass = 0). El panel usa Trimesh
 * para respetar los huecos. El piso usa CANNON.Plane (más estable que un
 * Box de grosor cero).
 *
 * @param {CANNON.World} world
 * @param {object}        materials — { piece, wall, panel, ground }
 * @returns {{
 *   registerPiece:   (mesh: THREE.Mesh, mass: number) => CANNON.Body,
 *   registerStatic:   (mesh: THREE.Mesh, kind: 'wall'|'panel'|'ground') => CANNON.Body,
 *   getBody:          (mesh: THREE.Mesh) => CANNON.Body | undefined,
 *   getMeshFromBody:  (body: CANNON.Body) => THREE.Mesh | undefined,
 * }}
 */
export function createBodyFactory(world, materials) {
    /** @type {Map<THREE.Mesh, CANNON.Body>} */
    const meshToBody = new Map();
    /** @type {Map<number, THREE.Mesh>} */
    const bodyIdToMesh = new Map();

    // ─── Helpers ─────────────────────────────────────────────────
    /**
     * Construye la forma cannon correspondiente a cada pieza según su label.
     * Cada forma se elige para que el comportamiento físico sea lo más realista posible:
     *  - Esfera → Sphere (rodadura exacta)
     *  - Cubo   → Box (cara plana exacta)
     *  - Cono   → Cylinder(radiusTop=0) → pico + base → las piezas se caen del pico
     *  - Pirámide → Cylinder(radiusTop=0, segs=4) → pirámide de 4 caras
     *  - Hexágono → Cylinder(radio igual, segs=6) → prisma hexagonal exacto
     *  - Estrella → Trimesh (es cóncava, Trimesh la representa fielmente)
     */
    function buildPieceShape(mesh) {
        const label = mesh.userData.label;
        const bbox = new THREE.Box3().setFromObject(mesh);
        const size = new THREE.Vector3();
        bbox.getSize(size);

        switch (label) {
            case 'Esfera': {
                const r = size.x / 2;
                return new CANNON.Sphere(r);
            }
            case 'Cubo': {
                return new CANNON.Box(new CANNON.Vec3(
                    size.x / 2, size.y / 2, size.z / 2,
                ));
            }
            case 'Cono': {
                // THREE.ConeGeometry(r, h, s): tip en +y, base en -y
                // CANNON.Cylinder(radiusTop, radiusBottom, h, s): top en +y, bottom en -y
                // Cono: tip arriba (radiusTop=0), base abajo (radiusBottom=r)
                const r = size.x / 2;
                const h = size.y;
                return new CANNON.Cylinder(0, r, h, 12);
            }
            case 'Hexágono': {
                // Prisma hexagonal: Cylinder con mismo radius top y bottom, 6 lados
                const r = size.x / 2;
                const h = size.y;
                return new CANNON.Cylinder(r, r, h, 6);
            }
            case 'Pirámide': {
                // THREE.ConeGeometry(r, h, 4): pirámide de 4 caras, tip en +y
                const r = size.x / 2;
                const h = size.y;
                return new CANNON.Cylinder(0, r, h, 4);
            }
            case 'Estrella': {
                // La estrella es cóncava → Trimesh para representar indentaciones
                return buildTrimeshFromGeometry(mesh.geometry);
            }
            default: {
                console.warn(`Unknown piece label "${label}", usando Box fallback`);
                return new CANNON.Box(new CANNON.Vec3(
                    size.x / 2, size.y / 2, size.z / 2,
                ));
            }
        }
    }

    /**
     * Construye un Trimesh a partir de una geometría Three (indexada o no).
     */
    function buildTrimeshFromGeometry(geometry) {
        let vertices;
        let indices;

        const pos = geometry.attributes.position.array;
        vertices = Array.from(pos);

        if (geometry.index) {
            indices = Array.from(geometry.index.array);
        } else {
            // Geometría no-indexada: generar índices secuenciales
            const count = pos.length / 3;
            indices = [];
            for (let i = 0; i < count; i++) indices.push(i);
        }

        return new CANNON.Trimesh(vertices, indices);
    }

    /**
     * Material cannon según tipo de cuerpo (para ContactMaterial correcto).
     */
    function materialForKind(kind) {
        if (kind === 'room-wall') return materials.wall;
        return materials[kind] || materials.piece;
    }

    // ─── API pública ────────────────────────────────────────────
    /**
     * Registra una pieza como body dinámico. Sincroniza posición/rotación inicial.
     * @param {THREE.Mesh} mesh
     * @param {number} mass
     * @returns {CANNON.Body}
     */
    function registerPiece(mesh, mass = 1) {
        const shape = buildPieceShape(mesh);

        const body = new CANNON.Body({
            mass,
            shape,
            material: materials.piece,
            position: new CANNON.Vec3(mesh.position.x, mesh.position.y, mesh.position.z),
            quaternion: new CANNON.Quaternion(
                mesh.quaternion.x, mesh.quaternion.y, mesh.quaternion.z, mesh.quaternion.w,
            ),
        });

        // Amortiguación suave → eventualmente las piezas se aquietan
        body.linearDamping = 0.05;
        body.angularDamping = 0.1;

        // Sleep: cuerpos quietos no consumen CPU
        body.allowSleep = true;
        body.sleepSpeedLimit = 0.12;
        body.sleepTimeLimit = 1.0;

        world.addBody(body);

        meshToBody.set(mesh, body);
        bodyIdToMesh.set(body.id, mesh);
        mesh.userData.body = body; // referencia cruzada para acceso rápido

        return body;
    }

    /**
     * Registra un mesh estático (mass = 0).
     *  - 'panel': Trimesh → respeta los huecos del clasificador
     *  - 'ground': Plane → colisión de piso estable (no un Box de altura cero)
     *  - 'wall':   Box → colisión rápida y exacta
     *
     * @param {THREE.Mesh} mesh
     * @param {'wall'|'panel'|'ground'} kind
     * @param {object}                  [opts]
     * @param {number}                  [opts.minThick] — espesor mínimo para
     *   todas las dimensiones. Sirve para evitar tunneling en paredes delgadas
     *   (ej: 0.5 para paredes del cuarto, que son PlaneGeometry de espesor 0).
     * @returns {CANNON.Body}
     */
    function registerStatic(mesh, kind, opts = {}) {
        let shape;

        if (kind === 'panel') {
            // Trimesh del panel con huecos: las piezas caerán por los agujeros
            shape = buildTrimeshFromGeometry(mesh.geometry);
        } else if (kind === 'ground') {
            // CANNON.Plane es un piso infinito horizontal → más estable que un Box de altura 0
            shape = new CANNON.Plane();
        } else if (kind === 'room-wall') {
            // Las paredes del cuarto son PlaneGeometry (espesor = 0).
            // CANNON.Plane (plano infinito) es la primitiva correcta: no tiene
            // tunneling sin importar la velocidad. El quaternion sincronizado
            // del mesh Three orienta el plano para que el normal apunte hacia
            // el interior del cuarto.
            shape = new CANNON.Plane();
        } else {
            // Paredes del clasificador (BoxGeometry real): Box exacto desde el bounding box del mesh
            const bbox = new THREE.Box3().setFromObject(mesh);
            const size = new THREE.Vector3();
            bbox.getSize(size);
            // Evitar dimensiones cero (seguridad) + espesor mínimo anti-tunneling
            const minDim = opts.minThick ?? 0.1;
            const sx = Math.max(size.x, minDim);
            const sy = Math.max(size.y, minDim);
            const sz = Math.max(size.z, minDim);
            shape = new CANNON.Box(new CANNON.Vec3(sx / 2, sy / 2, sz / 2));
        }

        const body = new CANNON.Body({
            mass: 0,
            shape,
            material: materialForKind(kind),
            type: CANNON.Body.STATIC,
        });

        // Sincronizar posición + rotación del mesh → body (world space)
        mesh.updateMatrixWorld(true);
        const wp = new THREE.Vector3();
        mesh.getWorldPosition(wp);
        body.position.set(wp.x, wp.y, wp.z);

        const wq = new THREE.Quaternion();
        mesh.getWorldQuaternion(wq);
        body.quaternion.set(wq.x, wq.y, wq.z, wq.w);

        world.addBody(body);

        meshToBody.set(mesh, body);
        mesh.userData.body = body;

        return body;
    }

    function getBody(mesh) {
        return meshToBody.get(mesh);
    }

    function getMeshFromBody(body) {
        return bodyIdToMesh.get(body.id);
    }

    return { registerPiece, registerStatic, getBody, getMeshFromBody };
}
