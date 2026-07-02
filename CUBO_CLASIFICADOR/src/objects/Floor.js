import * as THREE from 'three';

/**
 * Crea el suelo de la escena: plano base + marco elevado tipo caja.
 * @returns {THREE.Group}
 */
export function createFloor() {
    const SIZE = 18;
    const HALF = SIZE / 2;
    const LIFT = 0.4;   // altura del marco
    const THK  = 0.15;  // grosor de las paredes del marco

    const group = new THREE.Group();

    const matFloor = new THREE.MeshStandardMaterial({
        color: 0x1a2a30,
        roughness: 0.85,
        metalness: 0.05,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
    });

    const matEdge = new THREE.MeshStandardMaterial({
        color: 0x1a2a30,
        roughness: 0.85,
        metalness: 0.05,
    });

    // ── Plano base ──
    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(SIZE, SIZE),
        matFloor
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = 0;
    plane.receiveShadow = true;
    group.add(plane);

    // ── 4 paredes del marco ──
    const edgeH = LIFT;        // alto del marco
    const edgeW = THK;         // grosor

    // Frente  (z+)
    const f = new THREE.Mesh(new THREE.BoxGeometry(SIZE, edgeH, edgeW), matEdge);
    f.position.set(0, LIFT / 2, HALF - edgeW / 2);
    f.castShadow = true;
    f.receiveShadow = true;
    group.add(f);

    // Atrás   (z-)
    const b = new THREE.Mesh(new THREE.BoxGeometry(SIZE, edgeH, edgeW), matEdge);
    b.position.set(0, LIFT / 2, -(HALF - edgeW / 2));
    b.castShadow = true;
    b.receiveShadow = true;
    group.add(b);

    // Izquierda (x-)
    const l = new THREE.Mesh(new THREE.BoxGeometry(edgeW, edgeH, SIZE), matEdge);
    l.position.set(-(HALF - edgeW / 2), LIFT / 2, 0);
    l.castShadow = true;
    l.receiveShadow = true;
    group.add(l);

    // Derecha  (x+)
    const r = new THREE.Mesh(new THREE.BoxGeometry(edgeW, edgeH, SIZE), matEdge);
    r.position.set(HALF - edgeW / 2, LIFT / 2, 0);
    r.castShadow = true;
    r.receiveShadow = true;
    group.add(r);

    return group;
}
