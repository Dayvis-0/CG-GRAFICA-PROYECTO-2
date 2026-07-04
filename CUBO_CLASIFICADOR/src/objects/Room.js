import * as THREE from 'three';

/**
 * Crea el cuarto completo: piso, techo y 4 paredes.
 * Basado en escena.html pero con sombras habilitadas y materiales PBR.
 *
 * @param {object} options
 * @param {number} options.size       - Ancho/profundidad del cuarto (default 10)
 * @param {number} options.height     - Altura del cuarto (default 5)
 * @returns {THREE.Group}
 */
export function createRoom({ size = 14, height = 8 } = {}) {
    const group = new THREE.Group();
    const half = size / 2;

    // ── Materiales PBR con sombras ──

    // Piso: gris cemento
    const floorMat = new THREE.MeshStandardMaterial({
        color: 0x7a8084,
        roughness: 0.7,
        metalness: 0.1,
    });

    // Paredes: azul grisáceo nórdico (DoubleSide para ver desde dentro)
    const wallMat = new THREE.MeshStandardMaterial({
        color: 0x4a5a64,
        roughness: 0.9,
        metalness: 0.0,
        side: THREE.DoubleSide,
    });

    // Techo: blanco tiza
    const ceilMat = new THREE.MeshStandardMaterial({
        color: 0xf5f5f5,
        roughness: 0.9,
        metalness: 0.0,
        side: THREE.DoubleSide,
    });

    // ── Piso ──
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        floorMat
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    group.add(floor);

    // ── Techo ──
    const ceiling = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        ceilMat
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = height;
    ceiling.receiveShadow = true;
    group.add(ceiling);

    // ── Paredes (4) ──
    const wallGeo = new THREE.PlaneGeometry(size, height);

    // Norte (z = -half)
    const wallNorth = new THREE.Mesh(wallGeo, wallMat);
    wallNorth.position.set(0, height / 2, -half);
    wallNorth.castShadow = true;
    wallNorth.receiveShadow = true;
    group.add(wallNorth);

    // Sur (z = +half) - rotada 180°
    const wallSouth = new THREE.Mesh(wallGeo, wallMat);
    wallSouth.position.set(0, height / 2, half);
    wallSouth.rotation.y = Math.PI;
    wallSouth.castShadow = true;
    wallSouth.receiveShadow = true;
    group.add(wallSouth);

    // Este (x = +half) - rotada -90°
    const wallEast = new THREE.Mesh(wallGeo, wallMat);
    wallEast.position.set(half, height / 2, 0);
    wallEast.rotation.y = -Math.PI / 2;
    wallEast.castShadow = true;
    wallEast.receiveShadow = true;
    group.add(wallEast);

    // Oeste (x = -half) - rotada +90°
    const wallWest = new THREE.Mesh(wallGeo, wallMat);
    wallWest.position.set(-half, height / 2, 0);
    wallWest.rotation.y = Math.PI / 2;
    wallWest.castShadow = true;
    wallWest.receiveShadow = true;
    group.add(wallWest);

    // Guardar límites para colisión de cámara
    group.userData = {
        bounds: { half, height, margin: 0.5 },
    };

    return group;
}