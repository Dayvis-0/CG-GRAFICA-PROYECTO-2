import { createScene }          from './core/SceneManager.js';
import { createCamera }         from './core/CameraManager.js';
import { createRenderer }       from './core/RendererManager.js';
import { createRoom }           from './objects/Room.js';
import { createClassifier }     from './objects/Classifier.js';
import { createPieces }         from './objects/Pieces.js';
import { createLights }         from './lights/Lights.js';
import { createTextures }       from './textures/TextureFactory.js';
import { createMaterialFactory } from './materials/MaterialFactory.js';
import { setupCameraFPS }       from './controls/CameraFPS.js';
import { setupDragManager }     from './controls/DragManager.js';
import { setupInterface }       from './ui/Interface.js';
import { setupResize }          from './utils/ResizeHandler.js';

// 1. Escena
const scene = createScene();

// 2. Renderer
const renderer = createRenderer(document.body);

// 3. Cámara FPS (primera persona)
const { cam } = createCamera();

// 4. Cuarto (piso, techo, 4 paredes)
const room = createRoom({ size: 14, height: 8 });
scene.add(room);

// 5. Cubo clasificador con 6 huecos
//    (se ubica sobre el piso del cuarto, en el centro)
const { group: classifier, walls, panel } = createClassifier();
scene.add(classifier);

// 6. Piezas geométricas (alrededor del cubo)
const pieces = createPieces();
scene.add(pieces);

// 7. Luces
const lights = createLights(scene);

// 8. Texturas procedurales + fábrica de materiales
const textures = createTextures();
const buildMaterial = createMaterialFactory(textures);

// 9. Controles FPS (WASD + mouse look + confinado al cuarto)
const fpsControl = setupCameraFPS(cam, renderer, room.userData.bounds);

// 10. Drag de piezas con colisiones
const activeCameraRef = { current: cam };

let interfaceCtrl;
const dragManager = setupDragManager(activeCameraRef, renderer, {
    piecesGroup: pieces,
    classifierMeshes: [...walls, panel],
    panelMesh: panel,
    onSelect: (mesh) => {
        if (interfaceCtrl) interfaceCtrl.onPieceSelected(mesh);
    },
});

// 11. Interfaz de usuario (HUD + panel)
interfaceCtrl = setupInterface({
    piecesGroup: pieces,
    buildMaterial,
    lights,
    dragManager,
});

// 12. Responsive
setupResize(cam, renderer);

// 13. Bucle de renderizado con físicas + FPS
function animate() {
    requestAnimationFrame(animate);

    // Actualizar movimiento FPS
    fpsControl.update();

    const draggedMesh = window.__draggingPiece ? dragManager.getSelected() : null;

    for (const child of pieces.children) {
        if (!child.isMesh) continue;

        // La pieza que se arrastra no recibe físicas
        if (child === draggedMesh) {
            child.userData.velY = 0;
            child.userData.unstable = false;
            continue;
        }

        // Física: gravedad + estabilidad + empuje
        dragManager.applyPhysics(child);

        // Rotación de la esfera (rodar)
        if (child.userData.label === 'Esfera') {
            const prevX = child.userData.prevX ?? child.position.x;
            const prevZ = child.userData.prevZ ?? child.position.z;
            const dx = child.position.x - prevX;
            const dz = child.position.z - prevZ;
            child.rotation.x -= dz * 3;
            child.rotation.z += dx * 3;
            child.userData.prevX = child.position.x;
            child.userData.prevZ = child.position.z;
        }
    }

    renderer.render(scene, activeCameraRef.current);
}
animate();