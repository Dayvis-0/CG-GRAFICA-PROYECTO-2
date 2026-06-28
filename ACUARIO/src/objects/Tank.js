import * as THREE from 'three';

/**
 * TANQUE DE VIDRIO DEL ACUARIO
 *
 * Caja semitransparente sin tapa que contiene el agua.
 * El agua es un volumen semitransparente separado para poder
 * alternar su visibilidad (transparencia del agua).
 */

const TANK_W = 8;
const TANK_H = 4.5;
const TANK_D = 5;
const GLASS_THICKNESS = 0.08;

/**
 * Crea el tanque de vidrio (4 paredes + piso + volumen de agua).
 * @returns {{ tank: THREE.Group, water: THREE.Mesh, glassWalls: THREE.Mesh[] }}
 */
export function createTank() {
    const tank = new THREE.Group();

    // ── Material del vidrio ──
    const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.15,
        roughness: 0.05,
        metalness: 0.0,
        side: THREE.DoubleSide,
        envMapIntensity: 0.3,
    });

    const walls = [];

    // --- Pared trasera ---
    const wallBack = createWall(TANK_W, TANK_H, glassMat);
    wallBack.position.set(0, TANK_H / 2, -TANK_D / 2);
    tank.add(wallBack);
    walls.push(wallBack);

    // --- Pared delantera ---
    const wallFront = createWall(TANK_W, TANK_H, glassMat);
    wallFront.position.set(0, TANK_H / 2, TANK_D / 2);
    tank.add(wallFront);
    walls.push(wallFront);

    // --- Pared izquierda ---
    const wallLeft = createWall(TANK_D, TANK_H, glassMat);
    wallLeft.position.set(-TANK_W / 2, TANK_H / 2, 0);
    wallLeft.rotation.y = Math.PI / 2;
    tank.add(wallLeft);
    walls.push(wallLeft);

    // --- Pared derecha ---
    const wallRight = createWall(TANK_D, TANK_H, glassMat);
    wallRight.position.set(TANK_W / 2, TANK_H / 2, 0);
    wallRight.rotation.y = Math.PI / 2;
    tank.add(wallRight);
    walls.push(wallRight);

    // --- Piso del tanque ---
    const floorMat = new THREE.MeshStandardMaterial({
        color: 0x1a2a3a,
        roughness: 0.9,
        metalness: 0.0,
    });
    const floor = new THREE.Mesh(
        new THREE.BoxGeometry(TANK_W, GLASS_THICKNESS, TANK_D),
        floorMat
    );
    floor.position.y = 0.01;
    floor.receiveShadow = true;
    tank.add(floor);

    // ── Volumen de agua ──
    const waterMat = new THREE.MeshPhysicalMaterial({
        color: 0x0066aa,
        transparent: true,
        opacity: 0.4,
        roughness: 0.0,
        metalness: 0.0,
        side: THREE.DoubleSide,
    });
    const water = new THREE.Mesh(
        new THREE.BoxGeometry(TANK_W - 0.15, TANK_H - 0.15, TANK_D - 0.15),
        waterMat
    );
    water.position.y = TANK_H / 2;
    tank.add(water);

    // --- Borde decorativo superior (marco) ---
    const rimMat = new THREE.MeshStandardMaterial({
        color: 0x2a4a6a,
        roughness: 0.6,
        metalness: 0.3,
    });
    const rimGeo = new THREE.BoxGeometry(TANK_W + 0.2, 0.1, TANK_D + 0.2);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = TANK_H + 0.05;
    tank.add(rim);

    return { tank, water, walls, floor, glassMat, waterMat };
}

function createWall(w, h, mat) {
    const geo = new THREE.BoxGeometry(w, h, GLASS_THICKNESS);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

export { TANK_W, TANK_H, TANK_D };
