import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { createScene }          from './core/SceneManager.js';
import { createCameraManager }  from './core/CameraManager.js';
import { createRenderer }       from './core/RendererManager.js';
import { createBars }           from './objects/Bars.js';
import { createLights }         from './lights/Lights.js';
import { createMaterialManager} from './materials/MaterialManager.js';
import { createProceduralTexture } from './textures/ProceduralTexture.js';
import { createAudioManager }   from './audio/AudioManager.js';
import { createConceptPanel }   from './ui/ConceptPanel.js';
import { setupControls }        from './ui/Controls.js';
import { setupResize }          from './utils/ResizeHandler.js';
import { startAnimation }       from './animations/AnimationLoop.js';


// ═══════════════════════════════════════════
//  ORQUESTADOR PRINCIPAL
// ═══════════════════════════════════════════

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
    c.maxPolarAngle  = Math.PI / 2.15;
    c.minPolarAngle  = 0.25;
    c.minDistance    = 8;
    c.maxDistance    = 40;
    c.target.set(0, 1, 0);
    return c;
}

let controls = createOrbitControls(activeCamera);

// ── Luces ──
const lights = createLights(scene);

// ── Suelo con textura procedural ──
const texture = createProceduralTexture();
const groundGeo  = new THREE.PlaneGeometry(36, 28);
const groundMat  = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.9,
    metalness: 0.0,
    color: 0x888888,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.05;
ground.receiveShadow = true;
scene.add(ground);

// ── Grilla decorativa (sobre el suelo texturado) ──
const grid = new THREE.GridHelper(28, 56, 0x005544, 0x001a11);
grid.position.y = -0.02;
scene.add(grid);

// ── Barras del visualizador ──
const { group: barGroup, bars } = createBars();
scene.add(barGroup);

// ── Gestor de materiales intercambiables ──
const materialManager = createMaterialManager();

// ── Audio ──
const audioManager = createAudioManager();

// ── UI (barra de controles inferior) ──
setupControls(audioManager);

// ── Panel de Conceptos (HUD) ──
const conceptPanel = createConceptPanel();

// ── Estado de efectos ──
let shadowsEnabled    = true;
let transparencyOn   = false;
let textureVisible   = true;

// ═══════════════════════════════════════════
//  CONEXIÓN DEL PANEL DE CONCEPTOS
// ═══════════════════════════════════════════

// Cambio de material
conceptPanel.onMaterialChange = (type) => {
    materialManager.setType(type, bars);
    conceptPanel.updateMaterial(type);
};

// Cambio de cámara (perspectiva ↔ ortográfica)
conceptPanel.onCameraSwitch = () => {
    const oldCam = activeCamera;

    // Sincronizar posición antes de cambiar
    cameraManager.syncCameras();
    const newType = cameraManager.switchCamera();
    activeCamera = cameraManager.getActiveCamera();

    // Copiar posición/rotación si no se sincronizó
    activeCamera.position.copy(oldCam.position);
    activeCamera.quaternion.copy(oldCam.quaternion);

    // Recrear controles para la nueva cámara
    controls.dispose();
    controls = createOrbitControls(activeCamera);

    conceptPanel.updateCamera(newType);
};

// Toggle de luces individuales
conceptPanel.onLightToggle = (name) => {
    lights.toggle(name);
};

// Toggle de sombras
conceptPanel.onShadowsToggle = (enabled) => {
    shadowsEnabled = enabled;
    renderer.shadowMap.enabled = enabled;
    lights.directional.castShadow = enabled;
};

// Toggle de transparencia
conceptPanel.onTransparencyToggle = (enabled) => {
    transparencyOn = enabled;
    bars.forEach(bar => {
        bar.material.transparent = enabled;
        bar.material.opacity = enabled ? 0.72 : 1.0;
        bar.material.needsUpdate = true;
    });
};

// Toggle de textura
conceptPanel.onTextureToggle = (enabled) => {
    textureVisible = enabled;
    ground.visible = enabled;
};

// ═══════════════════════════════════════════
//  RESPONSIVE
// ═══════════════════════════════════════════

setupResize(() => cameraManager.onResize(), renderer);

// ═══════════════════════════════════════════
//  ACTUALIZADOR DEL HUD (llamado desde el loop)
// ═══════════════════════════════════════════

function updateConceptPanel() {
    // Solo actualiza indicadores que podrían cambiar (luces se actualizan
    // inmediatamente por eventos, no necesitan refresco en loop)
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
    barGroup, bars, lights, audioManager,
    updateConceptPanel
);
