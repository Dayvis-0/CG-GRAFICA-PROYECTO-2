import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { createScene }          from './core/SceneManager.js';
import { createCameraManager }  from './core/CameraManager.js';
import { createRenderer }       from './core/RendererManager.js';
import { createTank }           from './objects/Tank.js';
import { createFish }           from './objects/Fish.js';
import { createBubbles }        from './objects/Bubbles.js';
import { createPlants }         from './objects/Plants.js';
import { createLights }         from './lights/Lights.js';
import { createMaterialManager } from './materials/MaterialManager.js';
import { createProceduralTexture } from './textures/ProceduralTexture.js';
import { createConceptPanel }   from './ui/ConceptPanel.js';
import { setupResize }          from './utils/ResizeHandler.js';
import { startAnimation }       from './animations/AnimationLoop.js';


// ═══════════════════════════════════════════
//  ORQUESTADOR PRINCIPAL — ACUARIO 3D
// ═══════════════════════════════════════════

// ── Overlay de inicio ──
const overlay  = document.getElementById('overlay');
const startBtn = document.getElementById('startBtn');

// ── Escena ──
const scene = createScene();

// ── Cámaras (perspectiva + ortográfica) ──
const cameraManager = createCameraManager();
let activeCamera = cameraManager.getActiveCamera();

// ── Renderer (con sombras) ──
const renderer = createRenderer(document.getElementById('canvas-container'));

// ── Controles orbitales ──
function createOrbitControls(camera) {
    const c = new OrbitControls(camera, renderer.domElement);
    c.enableDamping  = true;
    c.dampingFactor  = 0.06;
    c.maxPolarAngle  = Math.PI / 2.1;
    c.minPolarAngle  = 0.15;
    c.minDistance    = 4;
    c.maxDistance    = 25;
    c.target.set(0, 2, 0);
    return c;
}

let controls = createOrbitControls(activeCamera);

// ── Luces ──
const lights = createLights(scene);

// ── Fondo marino con textura procedural ──
const texture = createProceduralTexture();
const floorGeo  = new THREE.PlaneGeometry(20, 20);
const floorMat  = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.95,
    metalness: 0.0,
    color: 0x2a3a3a,
});
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.05;
floor.receiveShadow = true;
scene.add(floor);

// ── Tanque de vidrio ──
const { tank, water, walls, floor: tankFloor, glassMat, waterMat } = createTank();
tank.position.y = 1.0; // Elevar ligeramente sobre el fondo
scene.add(tank);

// Guardar referencia al agua para animación
water.userData = { baseOpacity: waterMat.opacity };
const waterRef = water;

// ── Peces ──
// Fábrica de materiales (usamos una función simple)
const materialManager = createMaterialManager();
const { group: fishGroup, fishData } = createFish(() => {});
scene.add(fishGroup);

// ── Burbujas ──
const { group: bubbleGroup, bubbles } = createBubbles();
scene.add(bubbleGroup);

// ── Plantas ──
const { group: plantGroup, plantData } = createPlants();
scene.add(plantGroup);

// ── Grilla decorativa sutil ──
const grid = new THREE.GridHelper(14, 28, 0x006688, 0x002a44);
grid.position.y = 0.02;
scene.add(grid);

// ── UI — Panel de Conceptos (HUD) ──
const conceptPanel = createConceptPanel();

// Ocultar panel hasta que se ingrese
document.getElementById('concept-panel').classList.add('hidden-panel');

// ── Estado de efectos ──
let waterEnabled    = true;
let shadowsEnabled  = true;
let textureVisible  = true;

// ═══════════════════════════════════════════
//  CONEXIÓN DEL PANEL DE CONCEPTOS
// ═══════════════════════════════════════════

// Cambio de material en peces
conceptPanel.onMaterialChange = (type) => {
    materialManager.setType(type, fishData);
    conceptPanel.updateMaterial(type);
};

// Cambio de cámara (perspectiva ↔ ortográfica)
conceptPanel.onCameraSwitch = () => {
    const oldCam = activeCamera;

    cameraManager.syncCameras();
    const newType = cameraManager.switchCamera();
    activeCamera = cameraManager.getActiveCamera();

    activeCamera.position.copy(oldCam.position);
    activeCamera.quaternion.copy(oldCam.quaternion);

    controls.dispose();
    controls = createOrbitControls(activeCamera);

    conceptPanel.updateCamera(newType);
};

// Toggle de luces individuales
conceptPanel.onLightToggle = (name) => {
    lights.toggle(name);
};

// Toggle de agua transparente
conceptPanel.onWaterToggle = (enabled) => {
    waterEnabled = enabled;
    water.material.transparent = enabled;
    water.visible = enabled;
};

// Toggle de sombras
conceptPanel.onShadowsToggle = (enabled) => {
    shadowsEnabled = enabled;
    renderer.shadowMap.enabled = enabled;
    lights.directional.castShadow = enabled;
};

// Toggle de textura de fondo
conceptPanel.onTextureToggle = (enabled) => {
    textureVisible = enabled;
    floor.visible = enabled;
};

// ═══════════════════════════════════════════
//  INICIO: OVERLAY → ACUARIO
// ═══════════════════════════════════════════

startBtn.addEventListener('click', () => {
    overlay.classList.add('hidden-overlay');
    document.getElementById('concept-panel').classList.remove('hidden-panel');
});

// ═══════════════════════════════════════════
//  RESPONSIVE
// ═══════════════════════════════════════════

setupResize(() => cameraManager.onResize(), renderer);

// ═══════════════════════════════════════════
//  ACTUALIZADOR DEL HUD
// ═══════════════════════════════════════════

function updateConceptPanel() {
    const state = lights.getAllStates();
    Object.keys(state).forEach(name => {
        conceptPanel.updateLight(name, state[name]);
    });
}

// ═══════════════════════════════════════════
//  INICIAR BUCLE DE ANIMACIÓN
// ═══════════════════════════════════════════

startAnimation(
    renderer, scene, controls,
    fishData, bubbles, plantData, lights,
    waterRef, updateConceptPanel
);
