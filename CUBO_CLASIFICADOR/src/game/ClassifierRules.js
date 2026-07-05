import { isInsideHole } from '../utils/HoleDetector.js';
import { HOLE_CONFIGS } from '../data/holeConfigs.js';
import { WALL_HEIGHT } from '../objects/Classifier.js';

/**
 * Reglas del juego: determina si una pieza está sobre su hueco correspondiente.
 * Separado del DragManager y de la física — pura lógica de negocio.
 *
 * @param {THREE.Mesh} panelMesh — mesh del panel superior del clasificador
 */
export function createClassifierRules(panelMesh) {

    /**
     * ¿La pieza está justo sobre el hueco que le corresponde?
     * @param {THREE.Mesh} mesh
     * @returns {boolean}
     */
    function isOverOwnHole(mesh) {
        if (!panelMesh || !mesh || mesh.position.y < WALL_HEIGHT - 1.0) return false;

        const cfg = HOLE_CONFIGS.find(c => c.label === mesh.userData.label);
        if (!cfg) return false;

        // Convertir posición mundial a coordenadas del Shape (shape_Y → -world_Z)
        const sx = mesh.position.x;
        const sy = -mesh.position.z;

        return isInsideHole(sx, sy, cfg);
    }

    /**
     * Callback para collision.js: ¿debemos ignorar esta colisión?
     * Una pieza no colisiona con el panel si está sobre su propio hueco.
     *
     * @param {THREE.Mesh} mesh     — pieza que se mueve
     * @param {THREE.Mesh} obstacle — obstáculo con el que choca
     * @returns {boolean}
     */
    function shouldIgnoreCollision(mesh, obstacle) {
        return obstacle === panelMesh && isOverOwnHole(mesh);
    }

    return { isOverOwnHole, shouldIgnoreCollision };
}
