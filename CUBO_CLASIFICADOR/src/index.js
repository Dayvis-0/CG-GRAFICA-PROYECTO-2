import { createScene }          from './core/SceneManager.js';
import { createCameras }        from './core/CameraManager.js';
import { createRenderer }       from './core/RendererManager.js';
import { createFloor }          from './objects/Floor.js';
import { createClassifier }     from './objects/Classifier.js';
import { createPieces }         from './objects/Pieces.js';
import { createLights }         from './lights/Lights.js';
import { createTextures }       from './textures/TextureFactory.js';
import { createMaterialFactory } from './materials/MaterialFactory.js';
import { setupCameraOrbit }     from './controls/CameraOrbit.js';
import { setupDragManager }     from './controls/DragManager.js';
import { setupInterface }       from './ui/Interface.js';
import { setupResize }          from './utils/ResizeHandler.js';

// ──────────────────────────────────────────────
// 1. Escena
// ──────────────────────────────────────────────
const scene = createScene();

// ──────────────────────────────────────────────
// 2. Renderer
// ──────────────────────────────────────────────
const renderer = createRenderer(document.body);

// ──────────────────────────────────────────────
// 3. Cámaras (perspectiva + ortográfica)
// ──────────────────────────────────────────────
const cameras = createCameras();
const activeCameraRef = { current: cameras.perspCam };

// ──────────────────────────────────────────────
// 4. Suelo
// ──────────────────────────────────────────────
const { group: floor, edges: floorEdges } = createFloor();
scene.add(floor);

// ──────────────────────────────────────────────
// 5. Cubo clasificador con 6 huecos
// ──────────────────────────────────────────────
const { group: classifier, walls, panel } = createClassifier();
scene.add(classifier);

// ──────────────────────────────────────────────
// 6. Piezas geométricas (alrededor del cubo)
// ──────────────────────────────────────────────
const pieces = createPieces();
scene.add(pieces);

// ──────────────────────────────────────────────
// 7. Luces
// ──────────────────────────────────────────────
const lights = createLights(scene);

// ──────────────────────────────────────────────
// 8. Texturas procedurales + fábrica de materiales
// ──────────────────────────────────────────────
const textures = createTextures();
const buildMaterial = createMaterialFactory(textures);

// ──────────────────────────────────────────────
// 9. Controles de órbita (mouse) — ambos cámaras
// ──────────────────────────────────────────────
setupCameraOrbit(cameras, renderer);

// ──────────────────────────────────────────────
// 10. Drag de piezas con colisiones
// ──────────────────────────────────────────────
let interfaceCtrl;
const dragManager = setupDragManager(activeCameraRef, renderer, {
    piecesGroup: pieces,
    classifierMeshes: [...walls, panel, ...floorEdges],
    onSelect: (mesh) => {
        if (interfaceCtrl) interfaceCtrl.onPieceSelected(mesh);
    },
});

// ──────────────────────────────────────────────
// 11. Interfaz de usuario (HUD + panel)
// ──────────────────────────────────────────────
interfaceCtrl = setupInterface({
    piecesGroup: pieces,
    buildMaterial,
    activeCameraRef,
    cameras,
    lights,
    dragManager,
});

// ──────────────────────────────────────────────
// 12. Responsive
// ──────────────────────────────────────────────
setupResize(cameras, renderer, activeCameraRef);

// ──────────────────────────────────────────────
// 13. Bucle de renderizado con gravedad
// ──────────────────────────────────────────────
const GRAVITY = 0.008;

function animate() {
    requestAnimationFrame(animate);

    // Gravedad: las piezas elevadas caen hasta su minY
    // Solo si se está arrastrando activamente, saltamos esa pieza
    const draggedMesh = window.__draggingPiece ? dragManager.getSelected() : null;
    for (const child of pieces.children) {
        if (!child.isMesh) continue;
        if (child === draggedMesh) {
            child.userData.velY = 0; // se está arrastrando → sin gravedad
            continue;
        }
        const minY = child.userData.minY;
        if (child.position.y > minY) {
            child.userData.velY += GRAVITY;
            child.position.y -= child.userData.velY;
            if (child.position.y <= minY) {
                child.position.y = minY;
                child.userData.velY = 0;
            }
        }
    }

    renderer.render(scene, activeCameraRef.current);
}
animate();
