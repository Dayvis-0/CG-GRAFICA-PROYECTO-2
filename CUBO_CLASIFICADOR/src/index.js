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
import { HOLE_CONFIGS } from './data/holeConfigs.js';
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

// ─── Control de clasificación (evita doble conteo) ─────────────────
const classifiedLabels = new Set();
function tryClassify(mesh) {
    if (!mesh || classifiedLabels.has(mesh.userData.label)) return;
    if (rules && rules.isOverOwnHole(mesh)) {
        classifiedLabels.add(mesh.userData.label);
        if (interfaceCtrl) interfaceCtrl.onPieceClassified(mesh.userData.label);
        console.log(`✅ ¡${mesh.userData.label} clasificado!`);
    }
}

// ─── Cronómetro ────────────────────────────────────────────────────
const timerEl = document.getElementById('timer');
const timerDisplay = document.getElementById('timer-display');
let timerMinutes = 1;
let timerSeconds = 0;
let timerRunning = false;
let timerInterval = null;
let timerStarted = false; // para que arranque UNA sola vez

function timerUpdateDisplay() {
    const mm = String(timerMinutes).padStart(2, '0');
    const ss = String(timerSeconds).padStart(2, '0');
    timerDisplay.textContent = `${mm}:${ss}`;
}

function timerStart() {
    if (timerRunning || timerStarted) return;
    timerStarted = true;
    timerRunning = true;
    timerEl.classList.add('running');
    timerInterval = setInterval(() => {
        if (timerSeconds === 0) {
            if (timerMinutes === 0) {
                // Se acabó el tiempo
                clearInterval(timerInterval);
                timerRunning = false;
                timerDisplay.textContent = '00:00';
                timerDisplay.style.color = '#ff5566';
                console.log('⏰ ¡Tiempo agotado!');
                return;
            }
            timerMinutes--;
            timerSeconds = 59;
        } else {
            timerSeconds--;
        }
        timerUpdateDisplay();
    }, 1000);
}

function timerReset() {
    if (timerInterval) clearInterval(timerInterval);
    timerRunning = false;
    timerStarted = false;
    timerMinutes = 1;
    timerSeconds = 0;
    timerEl.classList.remove('running');
    timerDisplay.style.color = '';
    timerUpdateDisplay();
}

// Botones +/-
document.getElementById('timer-minus').onclick = () => {
    if (timerRunning || timerStarted) return;
    if (timerMinutes > 1) timerMinutes--;
    timerUpdateDisplay();
};
document.getElementById('timer-plus').onclick = () => {
    if (timerRunning || timerStarted) return;
    if (timerMinutes < 5) timerMinutes++;
    timerUpdateDisplay();
};

// ─── Reset de piezas ──────────────────────────────────────────────
function resetPieces() {
    for (const child of pieces.children) {
        if (!child.isMesh) continue;
        const orig = child.userData.originalPos;
        if (!orig) continue;

        // Posición visual
        child.position.copy(orig);
        child.quaternion.identity();

        // Posición física
        const body = child.userData.body;
        if (body) {
            body.position.set(orig.x, orig.y, orig.z);
            body.quaternion.set(0, 0, 0, 1);
            body.velocity.setZero();
            body.angularVelocity.setZero();
            body.wakeUp();
        }
    }

    // Resetear clasificación + cronómetro
    classifiedLabels.clear();
    if (interfaceCtrl) interfaceCtrl.resetScores();
    timerReset();
    console.log('🔄 Piezas reiniciadas');
}

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
bodyFactory.registerStatic(panel, 'panel', { holeConfigs: HOLE_CONFIGS });

// Piezas dinámicas con masa
for (const piece of pieces.children) {
    if (!piece.isMesh) continue;
    bodyFactory.registerPiece(piece, 1.0);
}

const physicsSystem = createPhysicsSystem(pieces, bodyFactory, physicsWorld);

// ─── Reglas del juego ──────────────────────────────────────────────
const rules = createClassifierRules(panel);

// ─── Controles ─────────────────────────────────────────────────────
const obstacles = [...walls, panel];
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
    onDragStart: () => {
        draggingRef.current = true;
        timerStart();
    },
    onDragEnd:   (mesh) => {
        // Delay de 120ms para evitar que el click post-suelte active el pointer lock
        setTimeout(() => { draggingRef.current = false; }, 120);
        // No clasificar acá — esperamos a que caiga por el hueco (onPostPhysics)
    },
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
    onPostPhysics: () => {
        for (const child of pieces.children) {
            if (!child.isMesh) continue;
            const label = child.userData.label;
            if (classifiedLabels.has(label)) continue;
            // Solo si YA atravesó el hueco (Y debajo del panel, dentro del cubo)
            if (child.position.y < WALL_HEIGHT) {
                tryClassify(child);
            }
        }
    },
});

// ─── Mostrar formulario de nombre ────────────────────────────────────
document.getElementById('loading-phase').classList.add('hidden');
document.getElementById('username-phase').classList.remove('hidden');
document.getElementById('username-input').focus();

document.getElementById('username-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('username-input').value.trim() || 'Jugador';
    document.getElementById('hud-title').textContent = name.toUpperCase();
    document.getElementById('loading-overlay').classList.add('hidden');
    console.log(`👤 Bienvenido, ${name}`);
});

// ─── Botón + tecla 'R' para reiniciar ─────────────────────────────
document.getElementById('reset-btn').onclick = resetPieces;
window.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        // No reiniciar si está escribiendo en un input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        resetPieces();
    }
});
