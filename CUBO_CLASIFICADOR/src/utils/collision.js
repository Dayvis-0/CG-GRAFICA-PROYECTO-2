import * as THREE from 'three';

const STEP_SIZE = 0.04;
const boxA = new THREE.Box3();
const boxB = new THREE.Box3();
const delta = new THREE.Vector3();

/**
 * Mueve un mesh hacia una posición deseada resolviendo colisiones por pasos.
 * Pura y desacoplada de la física o las reglas del juego específicas.
 *
 * @param {THREE.Mesh} mesh - El objeto a mover
 * @param {THREE.Vector3} targetPos - La posición de destino deseada
 * @param {THREE.Mesh[]} obstacles - Los obstáculos con los que puede colisionar
 * @param {function} [shouldIgnoreCollision] - (mesh, obstacle) => boolean (Callback opcional)
 */
export function sweepMove(mesh, targetPos, obstacles, shouldIgnoreCollision) {
    const start = mesh.position.clone();
    delta.copy(targetPos).sub(start);
    const dist = delta.length();

    if (dist < 0.001) return;

    const steps = Math.max(1, Math.ceil(dist / STEP_SIZE));
    const stepDelta = delta.clone().divideScalar(steps);

    for (let i = 1; i <= steps; i++) {
        const testPos = start.clone().addScaledVector(stepDelta, i);
        mesh.position.copy(testPos);
        mesh.updateMatrixWorld(true);
        boxA.setFromObject(mesh);

        let hit = false;
        for (const ob of obstacles) {
            if (!ob.visible || ob === mesh) continue;
            
            // Permitir delegar la lógica de ignorar colisiones (ej. reglas del juego)
            if (shouldIgnoreCollision && shouldIgnoreCollision(mesh, ob)) continue;
            
            boxB.setFromObject(ob);
            if (boxA.intersectsBox(boxB)) {
                hit = true;
                break;
            }
        }

        if (hit) {
            const validPos = i > 1
                ? start.clone().addScaledVector(stepDelta, i - 1)
                : start;
            mesh.position.copy(validPos);
            mesh.updateMatrixWorld(true);
            return;
        }
    }

    mesh.position.copy(targetPos);
    mesh.updateMatrixWorld(true);
}
