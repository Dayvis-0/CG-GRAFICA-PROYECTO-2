import * as CANNON from 'cannon-es';
import * as THREE from 'three';

/**
 * Fábrica de cuerpos rígidos cannon-es a partir de meshes Three.
 * Mantiene el mapeo mesh ↔ body en un Map, accesible vía getBody(mesh).
 */
export function createBodyFactory(world, materials) {
    /** @type {Map<THREE.Mesh, CANNON.Body>} */
    const meshToBody = new Map();
    /** @type {Map<number, THREE.Mesh>} */
    const bodyIdToMesh = new Map();

    // ─── Helpers ─────────────────────────────────────────────────
    /** Crea la forma cannon correspondiente a cada pieza según pieceType. */
    function buildPieceShape(mesh) {
        const type = mesh.userData.pieceType;
        const bbox = new THREE.Box3().setFromObject(mesh);
        const size = new THREE.Vector3();
        bbox.getSize(size);

        switch (type) {
            case 'sphere': {
                const r = size.x / 2;
                return new CANNON.Sphere(r);
            }
            case 'box': {
                return new CANNON.Box(new CANNON.Vec3(
                    size.x / 2, size.y / 2, size.z / 2,
                ));
            }
            case 'cone': {
                // THREE.ConeGeometry(r, h, s): tip en +y, base en -y
                // CANNON.Cylinder(radiusTop, radiusBottom, h, s): top en +y, bottom en -y
                // Cono: tip arriba (radiusTop=0), base abajo (radiusBottom=r).
                // pieceArgs = [r, h, segments]; reutilizamos el segments de Three
                // para que la pirámide (4 lados) y el cono (32) coincidan.
                const r = size.x / 2;
                const h = size.y;
                const segments = mesh.userData.pieceArgs?.[2] ?? 12;
                return new CANNON.Cylinder(0, r, h, segments);
            }
            case 'cylinder': {
                // Prisma hexagonal: Cylinder con mismo radius top y bottom.
                // pieceArgs = [rTop, rBottom, h, radialSegments].
                const r = size.x / 2;
                const h = size.y;
                const segments = mesh.userData.pieceArgs?.[3] ?? 6;
                return new CANNON.Cylinder(r, r, h, segments);
            }
            case 'star': {
                // La estrella es cóncava → Trimesh para representar indentaciones
                return buildTrimeshFromGeometry(mesh.geometry);
            }
            default: {
                console.warn(`Unknown pieceType "${type}", usando Box fallback`);
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
     *  - 'panel':     Trimesh → respeta los huecos del clasificador
     *  - 'ground':    Plane  → colisión de piso estable
     *  - 'room-wall': Plane  → paredes del cuarto (PlaneGeometry, sin grosor)
     *  - 'wall':      Box    → paredes del clasificador (BoxGeometry con volumen real)
     *
     * @param {THREE.Mesh} mesh
     * @param {'wall'|'room-wall'|'panel'|'ground'} kind
     * @param {object}                  [opts]
     * @param {number}                  [opts.minThick] — espesor mínimo para
     *   paredes Box ('wall'). Evita dimensiones cero en BoxGeometry.
     * @returns {CANNON.Body}
     */
    function registerStatic(mesh, kind, opts = {}) {
        let shape;

        if (kind === 'panel') {
            // Box plano en lugar de Trimesh.
            // Cannon-es solo resuelve Sphere↔Trimesh de forma fiable; Box, Cylinder
            // y Cone atraviesan el Trimesh por el algoritmo GJK/SAT de Cannon.
            // Los huecos se manejan LÓGICAMENTE: onPointerUp teleporta la pieza
            // a Y=0.3 cuando está sobre su hueco → no necesita hueco físico real.
            const bbox = new THREE.Box3().setFromObject(mesh);
            const size = new THREE.Vector3();
            bbox.getSize(size);
            shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
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

        if (kind === 'panel') {
            // El panel usa ExtrudeGeometry con rotation.x=-PI/2, por lo que su
            // origen (mesh.position) NO coincide con el centro geométrico del AABB.
            // Usamos el centro del AABB world-space y quaternion identidad
            // (el Box ya está correctamente dimensionado en world-space axes).
            const bbox = new THREE.Box3().setFromObject(mesh);
            const center = new THREE.Vector3();
            bbox.getCenter(center);
            body.position.set(center.x, center.y, center.z);
            // quaternion identidad: el Box ya refleja la orientación world-space
        } else {
            const wp = new THREE.Vector3();
            mesh.getWorldPosition(wp);
            body.position.set(wp.x, wp.y, wp.z);

            const wq = new THREE.Quaternion();
            mesh.getWorldQuaternion(wq);
            body.quaternion.set(wq.x, wq.y, wq.z, wq.w);
        }

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