/**
 * Comportamientos de animación por tipo de pieza.
 * Separado del bucle principal para mantener SRP:
 * AnimationLoop orquesta, acá vive el "cómo animar cada pieza".
 *
 * Cada pieza expone `userData.update(mesh, isDragged)` que el bucle
 * invoca en cada frame. Esto es polimórfico: el bucle no sabe de
 * "Esfera" ni de ningún tipo concreto.
 *
 * @param {THREE.Group} pieces — grupo con los meshes de las piezas
 */
export function attachAnimations(pieces) {
    for (const child of pieces.children) {
        if (!child.isMesh) continue;

        switch (child.userData.label) {
            case 'Esfera':
                child.userData.update = sphereUpdate;
                break;
            // Futuras piezas con comportamiento propio se agregan acá
            // case 'Cubo': child.userData.update = ...
        }
    }
}

/**
 * La esfera rota visiblemente al rodar por el piso.
 * Es puramente cosmético: la rotación física real la calcula cannon-es.
 */
function sphereUpdate(mesh, isDragged) {
    if (isDragged) return;
    const prevX = mesh.userData.prevX ?? mesh.position.x;
    const prevZ = mesh.userData.prevZ ?? mesh.position.z;
    const dx = mesh.position.x - prevX;
    const dz = mesh.position.z - prevZ;
    if (Math.abs(dx) > 0.0001 || Math.abs(dz) > 0.0001) {
        mesh.rotation.x -= dz * 3;
        mesh.rotation.z += dx * 3;
    }
    mesh.userData.prevX = mesh.position.x;
    mesh.userData.prevZ = mesh.position.z;
}
