import * as THREE from 'three';

/**
 * PEZ 3D — VERSIÓN REALISTA
 *
 * Diseño orgánico con cuerpo de elipsoide, aleta caudal grande
 * en forma de V, aleta dorsal superior, aletas pectorales laterales
 * y ojos visibles. Cada pez tiene color, velocidad y trayectoria únicos.
 */

const NUM_FISH = 6;

const FISH_COLORS = [
    0xff6b4a, // naranja
    0x4affd0, // turquesa
    0xff4a8a, // rosa
    0x4a8aff, // azul
    0xffdd4a, // amarillo
    0xaa4aff, // púrpura
];

function randomPath() {
    return {
        centerX: (Math.random() - 0.5) * 5,
        centerZ: (Math.random() - 0.5) * 3,
        radius: 1.5 + Math.random() * 2.5,
        speed: 0.3 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        yBase: 0.5 + Math.random() * 3,
        yRange: 0.3 + Math.random() * 0.8,
        ySpeed: 0.2 + Math.random() * 0.4,
        tiltAmount: 0.15 + Math.random() * 0.25,
    };
}

/**
 * Crea un pez con forma orgánica reconocible.
 */
function createFishMesh(color) {
    const group = new THREE.Group();
    const col = new THREE.Color(color);

    // ── CUERPO: elipsoide (esfera escalada) ──
    // La forma de elipsoide alargado es la más parecida a un pez real
    const bodyMat = new THREE.MeshStandardMaterial({
        color: col,
        roughness: 0.25,
        metalness: 0.15,
    });
    const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 14, 12),
        bodyMat
    );
    // Escala: alargado en Z (largo del pez), aplanado en Y (altura),
    // angosto en X (ancho) — perfil clásico de pez
    body.scale.set(0.55, 0.35, 1.4);
    body.castShadow = true;
    group.add(body);

    // ── CABEZA: pequeña esfera adelante para suavizar la forma ──
    const headMat = new THREE.MeshStandardMaterial({
        color: col,
        roughness: 0.3,
        metalness: 0.1,
    });
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 10, 8),
        headMat
    );
    head.position.z = 0.52;
    head.scale.set(0.8, 0.7, 0.7);
    head.castShadow = true;
    group.add(head);

    // ── VIENTRE (parte inferior más clara, NO cambia con el material) ──
    const bellyMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.35),
        roughness: 0.3,
        metalness: 0.05,
    });
    const belly = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 10, 8),
        bellyMat
    );
    belly.position.set(0, -0.12, 0.05);
    belly.scale.set(0.5, 0.15, 0.9);
    belly.userData.noRecolor = true; // no cambiar material
    group.add(belly);

    // ── ALETA CAUDAL (cola en forma de V) ──
    const tailMat = new THREE.MeshStandardMaterial({
        color: col,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
        roughness: 0.4,
    });
    const tailShape = new THREE.Shape();
    const tw = 0.35;  // ancho de la cola
    const tl = 0.45;  // largo de la cola
    // Forma de V invertida (horquilla)
    tailShape.moveTo(0, 0);
    tailShape.quadraticCurveTo(-tw * 0.3, tl * 0.3, -tw, tl);
    tailShape.quadraticCurveTo(-tw * 0.3, tl * 0.15, 0, 0.05);
    tailShape.quadraticCurveTo(tw * 0.3, tl * 0.15, tw, tl);
    tailShape.quadraticCurveTo(tw * 0.3, tl * 0.3, 0, 0);

    const tail = new THREE.Mesh(
        new THREE.ShapeGeometry(tailShape),
        tailMat
    );
    tail.position.z = -0.55;
    tail.name = 'tail';
    group.add(tail);

    // ── ALETA DORSAL (superior) ──
    const dorsalMat = new THREE.MeshStandardMaterial({
        color: col,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
        roughness: 0.4,
    });
    const dorsalShape = new THREE.Shape();
    dorsalShape.moveTo(0, 0);
    dorsalShape.quadraticCurveTo(0.12, 0.2, 0, 0.3);
    dorsalShape.quadraticCurveTo(-0.08, 0.25, -0.1, 0);
    dorsalShape.closePath();
    const dorsal = new THREE.Mesh(
        new THREE.ShapeGeometry(dorsalShape),
        dorsalMat
    );
    dorsal.position.set(0, 0.22, -0.1);
    dorsal.rotation.x = 0.15;
    group.add(dorsal);

    // ── ALETAS PECTORALES (costados) ──
    const finMat = new THREE.MeshStandardMaterial({
        color: col,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65,
        roughness: 0.4,
    });
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.quadraticCurveTo(0.15, 0.12, 0.05, 0.22);
    finShape.quadraticCurveTo(-0.05, 0.15, -0.03, 0);
    finShape.closePath();

    // Aleta pectoral izquierda
    const finLeft = new THREE.Mesh(new THREE.ShapeGeometry(finShape), finMat);
    finLeft.position.set(-0.25, -0.02, -0.15);
    finLeft.rotation.z = -0.3;
    finLeft.rotation.x = 0.3;
    group.add(finLeft);

    // Aleta pectoral derecha (espejada)
    const finRight = new THREE.Mesh(new THREE.ShapeGeometry(finShape), finMat);
    finRight.position.set(0.25, -0.02, -0.15);
    finRight.scale.x = -1;
    finRight.rotation.z = 0.3;
    finRight.rotation.x = 0.3;
    group.add(finRight);

    // ── OJOS ──
    const eyeWhiteMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.0,
        metalness: 0.0,
    });
    const eyePupilMat = new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 0.0,
        metalness: 0.0,
    });

    // Ojo izquierdo
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyeWhiteMat);
    eyeL.position.set(-0.18, 0.05, 0.45);
    group.add(eyeL);
    const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyePupilMat);
    pupilL.position.set(-0.20, 0.055, 0.48);
    group.add(pupilL);

    // Ojo derecho
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyeWhiteMat);
    eyeR.position.set(0.18, 0.05, 0.45);
    group.add(eyeR);
    const pupilR = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyePupilMat);
    pupilR.position.set(0.20, 0.055, 0.48);
    group.add(pupilR);

    // ── RAYA/BRILLO lateral (efecto visual) ──
    const stripeMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.5),
        transparent: true,
        opacity: 0.3,
        roughness: 0.0,
        metalness: 0.3,
    });
    const stripe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6),
        stripeMat
    );
    stripe.position.set(0, 0.03, 0.05);
    stripe.rotation.x = Math.PI / 2;
    group.add(stripe);

    return group;
}

/**
 * Crea todos los peces del acuario.
 * Cada entry en fishData incluye:
 *   mesh        — el grupo del pez
 *   path        — datos de trayectoria
 *   color       — color del pez (THREE.Color)
 *   tail        — referencia a la aleta caudal
 *   coloredParts — array de meshes que deben cambiar de material
 */
export function createFish(buildMaterial) {
    const group = new THREE.Group();
    const fishData = [];

    for (let i = 0; i < NUM_FISH; i++) {
        const color = FISH_COLORS[i % FISH_COLORS.length];
        const path = randomPath();

        const mesh = createFishMesh(color);

        const initAngle = path.phase;
        mesh.position.set(
            path.centerX + Math.cos(initAngle) * path.radius,
            path.yBase,
            path.centerZ + Math.sin(initAngle) * path.radius,
        );

        mesh.castShadow = true;
        group.add(mesh);

        // Recolectar partes que cambian de material (excluye ojos, pupilas, vientre)
        const coloredParts = [];
        mesh.children.forEach(child => {
            if (!child.isMesh) return;
            if (child.userData.noRecolor) return;
            // Omitir ojos (blancos) y pupilas (negras)
            const hex = child.material.color.getHex();
            if (hex === 0xffffff || hex === 0x111111) return;
            coloredParts.push(child);
        });

        fishData.push({
            mesh,
            path,
            color: new THREE.Color(color),
            tail: mesh.getObjectByName('tail'),
            coloredParts,
        });
    }

    return { group, fishData };
}

/**
 * Actualiza la animación de todos los peces.
 */
export function updateFish(fishData, time) {
    for (const f of fishData) {
        const { mesh, path, tail } = f;

        const angle = time * path.speed + path.phase;
        const x = path.centerX + Math.cos(angle) * path.radius;
        const z = path.centerZ + Math.sin(angle) * path.radius;
        const y = path.yBase + Math.sin(time * path.ySpeed + path.phase) * path.yRange;

        // Mirar hacia adelante en la trayectoria
        const lookX = path.centerX + Math.cos(angle + 0.1) * path.radius;
        const lookZ = path.centerZ + Math.sin(angle + 0.1) * path.radius;

        mesh.position.set(x, y, z);
        mesh.lookAt(lookX, y, lookZ);

        // Inclinación al nadar
        mesh.rotation.z = Math.sin(time * path.speed * 2 + path.phase) * path.tiltAmount;

        // Cola batiendo
        if (tail) {
            tail.rotation.y = Math.sin(time * path.speed * 5 + path.phase) * 0.5;
        }
    }
}
