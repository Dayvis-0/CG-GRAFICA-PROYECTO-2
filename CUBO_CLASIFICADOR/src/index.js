import { createScene }          from './core/SceneManager.js';
import { createCamera }         from './core/CameraManager.js';
import { createRenderer }       from './core/RendererManager.js';
import { createRoom }           from './objects/Room.js';
import { createClassifier }     from './objects/Classifier.js';
import { createPieces }         from './objects/Pieces.js';
import { createLights }         from './lights/Lights.js';
import { createTextures }       from './textures/TextureFactory.js';
import { createMaterialFactory } from './materials/MaterialFactory.js';
import { createInputManager }   from './controls/InputManager.js';
import { setupCameraFPS }       from './controls/CameraFPS.js';
import { setupDragManager }     from './controls/DragManager.js';
import { setupInterface }       from './ui/Interface.js';
import { setupResize }          from './utils/ResizeHandler.js';
import { setupAnimationLoop }   from './animations/AnimationLoop.js';
import { createPhysicsSystem }  from './physics/PhysicsSystem.js';
import { createClassifierRules } from './game/ClassifierRules.js';

// 1. Input centralizado (teclado + pointer lock)
const inputManager = createInputManager();

// 2. Escena
const scene = createScene();

// 3. Renderer
const renderer = createRenderer(document.body);

// 4. Cámara FPS (primera persona)
const { cam } = createCamera();

// 5. Cuarto (piso, techo, 4 paredes)
const room = createRoom({ size: 14, height: 8 });
scene.add(room);

// 6. Cubo clasificador con 6 huecos
const { group: classifier, walls, panel } = createClassifier();
scene.add(classifier);

// 7. Piezas geométricas (alrededor del cubo)
const pieces = createPieces();
scene.add(pieces);

// 8. Luces
const lights = createLights(scene);

// 9. Texturas procedurales + fábrica de materiales
const textures = createTextures();
const buildMaterial = createMaterialFactory(textures);

// 10. Estado compartido: ref para saber si se está arrastrando una pieza
const draggingRef = { current: false };

// 11. Reglas del juego (qué pieza va en qué hueco)
const classifierRules = createClassifierRules(panel);

// 12. Obstáculos para colisiones (cámara + piezas)
const obstacles = [...walls, panel, ...pieces.children.filter(c => c.isMesh)];

// 13. Control FPS (WASD + mouse look + confinado al cuarto + obstáculos)
const fpsControl = setupCameraFPS(cam, renderer, room.userData.bounds, obstacles, draggingRef, inputManager);

// 14. Físicas (gravedad, estabilidad, empuje)
const physicsSystem = createPhysicsSystem(pieces, [...walls, panel], classifierRules);

// 15. Drag de piezas con colisiones
const activeCameraRef = { current: cam };

let interfaceCtrl;
const dragManager = setupDragManager(activeCameraRef, renderer, {
    piecesGroup: pieces,
    classifierMeshes: [...walls, panel],
    classifierRules,
    onSelect: (mesh) => {
        if (interfaceCtrl) interfaceCtrl.onPieceSelected(mesh);
    },
    onDragStart: () => { draggingRef.current = true; },
    onDragEnd:   () => { draggingRef.current = false; },
});

// 16. Interfaz de usuario (HUD + panel)
interfaceCtrl = setupInterface({
    piecesGroup: pieces,
    buildMaterial,
    lights,
});

// 17. Responsive
setupResize(cam, renderer);

// 18. Bucle de renderizado con físicas + input + comportamiento polimórfico
setupAnimationLoop({
    scene,
    renderer,
    activeCameraRef,
    fpsControl,
    pieces,
    physicsSystem,
    inputManager,
    dragManager,
});
