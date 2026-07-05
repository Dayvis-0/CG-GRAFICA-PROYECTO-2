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
import { setupAnimationLoop }   from './animations/AnimationLoop.js';

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

// 9. Estado compartido: ref para saber si se está arrastrando una pieza
const draggingRef = { current: false };

// 10. Controles FPS (WASD + mouse look + confinado al cuarto + obstáculos)
const obstacles = [...walls, panel, ...pieces.children.filter(c => c.isMesh)];
const fpsControl = setupCameraFPS(cam, renderer, room.userData.bounds, obstacles, draggingRef);

// 11. Drag de piezas con colisiones
//     (el estado draggingRef se comparte con CameraFPS para evitar loops)
const activeCameraRef = { current: cam };

let interfaceCtrl;
const dragManager = setupDragManager(activeCameraRef, renderer, {
    piecesGroup: pieces,
    classifierMeshes: [...walls, panel],
    panelMesh: panel,
    onSelect: (mesh) => {
        if (interfaceCtrl) interfaceCtrl.onPieceSelected(mesh);
    },
    onDragStart: () => { draggingRef.current = true; },
    onDragEnd:   () => { draggingRef.current = false; },
});

// 12. Interfaz de usuario (HUD + panel)
interfaceCtrl = setupInterface({
    piecesGroup: pieces,
    buildMaterial,
    lights,
    dragManager,
});

// 13. Responsive
setupResize(cam, renderer);

// 14. Bucle de renderizado con físicas + FPS
setupAnimationLoop({
    scene,
    renderer,
    activeCameraRef,
    fpsControl,
    pieces,
    dragManager,
});