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
import { WALL_HEIGHT, PANEL_DEPTH, OUTER } from './data/classifierDimensions.js';

// ─── Input · Escena · Cámara · Renderer ────────────────────────────
const inputManager = createInputManager();
const scene = createScene();
const renderer = createRenderer(document.body);
const { cam } = createCamera();

// ─── Geometría del cuarto y clasificador ───────────────────────────
const room = createRoom({ size: 14, height: 8 });
scene.add(room);

const { group: classifier, walls, panel } = createClassifier();
scene.add(classifier);

const pieces = createPieces();
scene.add(pieces);

const lights = createLights(scene);

// ─── Texturas procedurales + fábrica de materiales ────────────────
const textures = createTextures();
const buildMaterial = createMaterialFactory(textures);

// ─── Refs compartidas entre módulos ────────────────────────────────
const draggingRef = { current: false };
const activeCameraRef = { current: cam };

// ─── Físicas (cannon-es) ───────────────────────────────────────────
const physicsWorld = createPhysicsWorld();
const bodyFactory = createBodyFactory(physicsWorld.world, physicsWorld.materials);

// Cuerpos estáticos: piso y paredes del cuarto + paredes del clasificador
// + panel con Trimesh (huecos físicos reales).
for (const child of room.children) {
    if (!child.isMesh) continue;
    const kind = (child.position.y < 0.5) ? 'ground' : 'room-wall';
    bodyFactory.registerStatic(child, kind);
}
for (const wall of walls) {
    bodyFactory.registerStatic(wall, 'wall');
}
bodyFactory.registerStatic(panel, 'panel');

// Piezas dinámicas con masa
for (const piece of pieces.children) {
    if (!piece.isMesh) continue;
    bodyFactory.registerPiece(piece, 1.0);
}

const physicsSystem = createPhysicsSystem(pieces, bodyFactory, physicsWorld);

// ─── Controles ─────────────────────────────────────────────────────
const obstacles = [...walls, panel, ...pieces.children.filter(c => c.isMesh)];
const fpsControl = setupCameraFPS(cam, renderer, room.userData.bounds, obstacles, draggingRef, inputManager);

// Obstáculos del arrastre: SOLO paredes del clasificador (el panel Trimesh
// ya detecta colisiones con huecos reales vía cannon).
const dragObstacles = [...walls];

let interfaceCtrl;
const dragManager = setupDragManager(activeCameraRef, renderer, {
    piecesGroup: pieces,
    physicsSystem,
    obstacles: dragObstacles,
    roomBounds: room.userData.bounds,
    classifierTop: WALL_HEIGHT + PANEL_DEPTH,
    classifierHalf: OUTER / 2,
    onSelect: (mesh) => {
        if (interfaceCtrl) interfaceCtrl.onPieceSelected(mesh);
    },
    onDragStart: () => { draggingRef.current = true; },
    onDragEnd:   () => { draggingRef.current = false; },
});

// ─── UI + Responsive + Bucle principal ─────────────────────────────
interfaceCtrl = setupInterface({
    piecesGroup: pieces,
    buildMaterial,
    lights,
});

setupResize(cam, renderer);

setupAnimationLoop({
    scene,
    renderer,
    activeCameraRef,
    fpsControl,
    pieces,
    physicsSystem,
    inputManager,
    dragManager,
    roomBounds: room.userData.bounds,
});
