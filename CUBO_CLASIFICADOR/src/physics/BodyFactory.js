import * as CANNON from 'cannon-es';
import * as THREE from 'three';

/**
 * Verifica si un punto (sx, sy) en el espacio del Shape cae dentro de algún hueco.
 * Usa halfCell como margen POSITIVO: el hueco físico se agranda ligeramente
 * para compensar la intrusión de las celdas vecinas. Así el hueco efectivo
 * coincide con el visual. Las celdas en el borde del hueco se eliminan.
 */
function isInsideAnyHole(sx, sy, holeConfigs, halfCell) {
    for (const cfg of holeConfigs) {
        const m = halfCell; // margen + → agranda el hueco para compensar intrusión de celdas vecinas
        switch (cfg.shape) {
            case 'circle': {
                const dx = sx - cfg.cx, dy = sy - cfg.cy;
                const r = cfg.hole.r + m;
                if (dx * dx + dy * dy < r * r) return true;
                break;
            }
            case 'square': {
                const h = cfg.hole.side / 2 + m;
                if (Math.abs(sx - cfg.cx) < h && Math.abs(sy - cfg.cy) < h) return true;
                break;
            }
            case 'triangle': {
                const r = cfg.hole.r + m;
                const s32 = 0.86602540378;
                const ax = cfg.cx, ay = cfg.cy + r;
                const bx = cfg.cx + r * s32, by = cfg.cy - r / 2;
                const cx2 = cfg.cx - r * s32, cy2 = cfg.cy - r / 2;
                if (pointInTriangle(sx, sy, ax, ay, bx, by, cx2, cy2)) return true;
                break;
            }
            case 'diamond': {
                const rx = cfg.hole.rx + m, ry = cfg.hole.ry + m;
                if (Math.abs(sx - cfg.cx) / rx + Math.abs(sy - cfg.cy) / ry < 1) return true;
                break;
            }
            case 'hexagon': {
                const r = cfg.hole.r + m;
                for (let i = 0; i < 6; i++) {
                    const a1 = Math.PI / 2 - (i / 6) * Math.PI * 2;
                    const a2 = Math.PI / 2 - ((i + 1) / 6) * Math.PI * 2;
                    const ax = cfg.cx + r * Math.cos(a1), ay = cfg.cy + r * Math.sin(a1);
                    const bx = cfg.cx + r * Math.cos(a2), by = cfg.cy + r * Math.sin(a2);
                    if (pointInTriangle(sx, sy, cfg.cx, cfg.cy, ax, ay, bx, by)) return true;
                }
                break;
            }
            case 'star': {
                const pts = cfg.hole.points || 4;
                const outerR = cfg.hole.outerR + m;
                const innerR = cfg.hole.innerR + m;
                // Pre-filter por bounding box (outerR ya incluye m)
                if (Math.abs(sx - cfg.cx) < outerR && Math.abs(sy - cfg.cy) < outerR) {
                    // Punto está dentro del bounding box — refinamos con point-in-polygon
                    const verts = computeStarPoints(outerR, innerR, pts)
                        .map(v => ({ x: v.x + cfg.cx, y: v.y + cfg.cy }));
                    if (pointInPolygon(sx, sy, verts)) return true;
                }
                break;
            }
            case 'rect': {
                if (Math.abs(sx - cfg.cx) < cfg.hole.w / 2 + m
                    && Math.abs(sy - cfg.cy) < cfg.hole.h / 2 + m) return true;
                break;
            }
        }
    }
    return false;
}

// ─── Helpers geométricos locales (evitan depender de HoleDetector) ───
function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
    const d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
    const a = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / d;
    const b = ((cy - ay) * (px - cx) + (cx - bx) * (py - cy)) / d;
    const c = 1 - a - b;
    return a >= 0 && b >= 0 && c >= 0;
}

function pointInPolygon(px, py, verts) {
    let inside = false;
    for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
        const xi = verts[i].x, yi = verts[i].y;
        const xj = verts[j].x, yj = verts[j].y;
        if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}

/** Genera puntos de estrella para detección de hueco (copia local de geometry.js) */
function computeStarPoints(outerR, innerR, points) {
    const verts = [];
    for (let i = 0; i < points * 2; i++) {
        const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        verts.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
    }
    return verts;
}

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
                // La estrella es cóncava, pero Trimesh no colisiona contra Box
                // (que es lo que usa el panel ahora). Usamos el bounding box
                // como aproximación convexa para que al menos se apoye sobre
                // la superficie del panel.
                return new CANNON.Box(new CANNON.Vec3(
                    size.x / 2, size.y / 2, size.z / 2,
                ));
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
     *  - 'panel':     Grilla de Box → respeta los huecos del clasificador (compatible con todas las formas)
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
            // ─── Panel con huecos: grilla de Box bodies ────────────────
            // CANNON.Trimesh solo soporta colisiones Sphere vs Trimesh y
            // Plane vs Trimesh en el narrowphase. Las demás formas (Box,
            // Cylinder/Convex) NO colisionan contra Trimesh, así que las
            // piezas se traspasan. En vez de Trimesh, construimos una
            // grilla de CANNON.Box que cubre las partes sólidas del panel,
            // dejando huecos vacíos. Box es compatible con TODAS las formas.
            const bbox = new THREE.Box3().setFromObject(mesh);
            const center = new THREE.Vector3();
            bbox.getCenter(center);
            const bsize = new THREE.Vector3();
            bbox.getSize(bsize);

            // Creamos UN solo body estático compuesto (varios shapes)
            const compoundBody = new CANNON.Body({
                mass: 0,
                material: materialForKind(kind),
                type: CANNON.Body.STATIC,
                position: new CANNON.Vec3(center.x, center.y, center.z),
            });

            const halfExtent = bsize.x / 2; // mitad del panel en X/Z (en shape space ≈ world X/Z)
            const cellSize = opts.gridCellSize || 0.25;
            const halfCell = cellSize / 2;
            const halfDepth = bsize.y / 2; // grosor del panel (Y en world space)
            const holeConfigs = opts.holeConfigs || [];

            // Iteramos en shape space (XY del Shape original)
            // shape (sx, sy) → world offset (sx, 0, -sy) relativo al body center
            for (let sx = -halfExtent + halfCell; sx < halfExtent; sx += cellSize) {
                for (let sy = -halfExtent + halfCell; sy < halfExtent; sy += cellSize) {
                    if (isInsideAnyHole(sx, sy, holeConfigs, halfCell)) continue;
                    const halfW = cellSize / 2;
                    const halfH = cellSize / 2;
                    compoundBody.addShape(
                        new CANNON.Box(new CANNON.Vec3(halfW, halfDepth, halfH)),
                        new CANNON.Vec3(sx, 0, -sy),
                    );
                }
            }

            world.addBody(compoundBody);
            // Guardamos referencia en el map para consistencia (aunque nadie consulta el panel)
            meshToBody.set(mesh, compoundBody);
            mesh.userData.body = compoundBody;
            return compoundBody;
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