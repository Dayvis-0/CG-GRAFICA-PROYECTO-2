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
import { createPhysicsWorld }   from './physics/PhysicsWorld.js';
import { createBodyFactory }    from './physics/BodyFactory.js';
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

// ─── FÍSICAS (cannon-es) ──────────────────────────────────────────
// 12. Mundo de físicas con gravedad y materiales de colisión
const physicsWorld = createPhysicsWorld();

// 13. Fábrica de cuerpos rígidos (mapea meshes Three ↔ bodies Cannon)
const bodyFactory = createBodyFactory(physicsWorld.world, physicsWorld.materials);

// 14. Registrar cuerpos estáticos: piso del cuarto, paredes y panel perforado
//     El panel usa Trimesh para respetar los huecos (las piezas caen por ellos).
const roomFloorMesh = room.children.find(c => c.isMesh); // primer hijo = piso
bodyFactory.registerStatic(roomFloorMesh, 'ground');

for (const wall of walls) {
    bodyFactory.registerStatic(wall, 'wall');
}
bodyFactory.registerStatic(panel, 'panel');

// 15. Registrar piezas como cuerpos dinámicos con masa
for (const piece of pieces.children) {
    if (!piece.isMesh) continue;
    bodyFactory.registerPiece(piece, 1.0);
}

// 16. Sistema de físicas: step + sincronizar meshes
const physicsSystem = createPhysicsSystem(pieces, bodyFactory, physicsWorld, classifierRules);

// 17. Obstáculos para colisiones de cámara (sigue siendo AABB: la cámara es puntual)
const obstacles = [...walls, panel, ...pieces.children.filter(c => c.isMesh)];

// 18. Control FPS (WASD + mouse look + confinado al cuarto + obstáculos)
const fpsControl = setupCameraFPS(cam, renderer, room.userData.bounds, obstacles, draggingRef, inputManager);

// 19. Ref activa de cámara (para que DragManager use la cámara actual)
const activeCameraRef = { current: cam };

// 20. Drag de piezas (cinemático en cannon, dinámico al soltar)
let interfaceCtrl;
const dragManager = setupDragManager(activeCameraRef, renderer, {
    piecesGroup: pieces,
    classifierRules,
    physicsSystem,
    onSelect: (mesh) => {
        if (interfaceCtrl) interfaceCtrl.onPieceSelected(mesh);
    },
    onDragStart: () => { draggingRef.current = true; },
    onDragEnd:   () => { draggingRef.current = false; },
});

// 21. Interfaz de usuario (HUD + panel)
interfaceCtrl = setupInterface({
    piecesGroup: pieces,
    buildMaterial,
    lights,
});

// 22. Responsive
setupResize(cam, renderer);

// 23. Bucle de renderizado con físicas + input
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
