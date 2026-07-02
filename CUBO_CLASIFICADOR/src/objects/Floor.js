import * as THREE from 'three';

/**
 * Crea el suelo de la escena: plano base + marco elevado tipo caja.
 * @returns {{ group: THREE.Group, edges: THREE.Mesh[] }}
 */
export function createFloor() {
    const SIZE = 18;
    const HALF = SIZE / 2;
    const LIFT = 0.4;   // altura del marco
    const THK  = 0.15;  // grosor de las paredes del marco

    const group = new THREE.Group();
    const edges = [];

    const matFloor = new THREE.MeshStandardMaterial({
        color: 0x1a2a30,
        roughness: 0.85,
        metalness: 0.05,
    });
    // matEdge eliminado — usa el mismo material que el plano

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
    const f = new THREE.Mesh(new THREE.BoxGeometry(SIZE, edgeH, edgeW), matFloor);
    f.position.set(0, LIFT / 2, HALF - edgeW / 2);
    f.castShadow = true;
    f.receiveShadow = true;
    group.add(f);
    edges.push(f);

    // Atrás   (z-)
    const b = new THREE.Mesh(new THREE.BoxGeometry(SIZE, edgeH, edgeW), matFloor);
    b.position.set(0, LIFT / 2, -(HALF - edgeW / 2));
    b.castShadow = true;
    b.receiveShadow = true;
    group.add(b);
    edges.push(b);

    // Izquierda (x-)
    const l = new THREE.Mesh(new THREE.BoxGeometry(edgeW, edgeH, SIZE), matFloor);
    l.position.set(-(HALF - edgeW / 2), LIFT / 2, 0);
    l.castShadow = true;
    l.receiveShadow = true;
    group.add(l);
    edges.push(l);

    // Derecha  (x+)
    const r = new THREE.Mesh(new THREE.BoxGeometry(edgeW, edgeH, SIZE), matFloor);
    r.position.set(HALF - edgeW / 2, LIFT / 2, 0);
    r.castShadow = true;
    r.receiveShadow = true;
    group.add(r);
    edges.push(r);

    return { group, edges };
}
