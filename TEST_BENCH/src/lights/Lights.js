import * as THREE from 'three';

/**
 * Crea las 4 luces (ambiental, direccional, 2 puntuales)
 * y los marcadores visuales para las puntuales.
 * @param {THREE.Scene} scene
 * @returns {{ lights: object, markers: THREE.Mesh[] }}
 *
 * lights: { ambient, dir, point1, point2 }
 */
export function createLights(scene) {
    const lights = {};
    const markers = [];

    // --- Ambiental ---
    lights.ambient = new THREE.AmbientLight(0x404560, 0.55);
    scene.add(lights.ambient);

    // --- Direccional (con sombras) ---
    lights.dir = new THREE.DirectionalLight(0xffffff, 0.9);
    lights.dir.position.set(6, 9, 6);
    lights.dir.castShadow = true;
    lights.dir.shadow.mapSize.set(1024, 1024);
    lights.dir.shadow.camera.left   = -10;
    lights.dir.shadow.camera.right  =  10;
    lights.dir.shadow.camera.top    =  10;
    lights.dir.shadow.camera.bottom = -10;
    scene.add(lights.dir);

    // --- Puntual roja ---
    lights.point1 = new THREE.PointLight(0xff3355, 1.3, 18);
    lights.point1.position.set(-6, 3.5, 4);
    lights.point1.castShadow = true;
    scene.add(lights.point1);

    // --- Puntual azul ---
    lights.point2 = new THREE.PointLight(0x3399ff, 1.3, 18);
    lights.point2.position.set(6, 3.5, -4);
    lights.point2.castShadow = true;
    scene.add(lights.point2);

    // --- Marcadores visuales (esferitas) ---
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xff3355 });
    const marker1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), markerMat);
    marker1.position.copy(lights.point1.position);
    scene.add(marker1);
    markers.push(marker1);

    const markerMat2 = new THREE.MeshBasicMaterial({ color: 0x3399ff });
    const marker2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), markerMat2);
    marker2.position.copy(lights.point2.position);
    scene.add(marker2);
    markers.push(marker2);

    return { lights, markers };
}
