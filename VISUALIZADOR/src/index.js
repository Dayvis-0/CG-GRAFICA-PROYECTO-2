import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { createScene }     from './core/SceneManager.js';
import { createCamera }    from './core/CameraManager.js';
import { createRenderer }  from './core/RendererManager.js';
import { createBars }      from './objects/Bars.js';
import { createLights }    from './lights/Lights.js';
import { createAudioManager } from './audio/AudioManager.js';
import { setupControls }   from './ui/Controls.js';
import { setupResize }     from './utils/ResizeHandler.js';
import { startAnimation }  from './animations/AnimationLoop.js';


//  ORQUESTADOR PRINCIPAL

// --- Escena ---
const scene = createScene();

// --- Cámara ---
const camera = createCamera();

// --- Renderer ---
const renderer = createRenderer(document.getElementById('canvas-container'));

// --- Controles orbitales ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping  = true;
controls.dampingFactor  = 0.06;
controls.maxPolarAngle  = Math.PI / 2.15;
controls.minPolarAngle  = 0.25;
controls.minDistance    = 8;
controls.maxDistance    = 40;
controls.target.set(0, 1, 0);

// --- Luces ---
const lights = createLights(scene);

// --- Grilla decorativa en el suelo ---
const grid = new THREE.GridHelper(28, 56, 0x005544, 0x001a11);
grid.position.y = -0.02;
scene.add(grid);

// --- Barras del visualizador ---
const { group: barGroup, bars } = createBars();
scene.add(barGroup);

// --- Audio ---
const audioManager = createAudioManager();

// --- UI ---
setupControls(audioManager);

// --- Responsive ---
setupResize(camera, renderer);

// --- Bucle de animación ---
startAnimation(renderer, scene, camera, controls, barGroup, bars, lights, audioManager);
