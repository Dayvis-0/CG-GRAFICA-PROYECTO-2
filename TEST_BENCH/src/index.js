import * as THREE from 'three';

import { createScene }        from './core/SceneManager.js';
import { createCameras }      from './core/CameraManager.js';
import { createRenderer }     from './core/RendererManager.js';
import { createSceneObjects } from './objects/SceneObjects.js';
import { createLights }       from './lights/Lights.js';
import { createTextures }     from './textures/TextureFactory.js';
import { createMaterialFactory } from './materials/MaterialFactory.js';
import { setupCameraOrbit }   from './controls/CameraOrbit.js';
import { setupInterface }     from './ui/Interface.js';
import { setupResize }        from './utils/ResizeHandler.js';
import { startAnimation }     from './animations/AnimationLoop.js';


// =============================================
//  ORQUESTADOR PRINCIPAL
// =============================================

// --- Escena ---
const scene = createScene();

// --- Renderer ---
const renderer = createRenderer(document.body);

// --- Cámaras ---
const cameras         = createCameras();
const activeCameraRef = { current: cameras.perspCam };

// --- Texturas procedurales ---
const textures = createTextures();

// --- Fábrica de materiales (cierra sobre textures) ---
const buildMaterial = createMaterialFactory(textures);

// --- Objetos de la escena (pedestal + grid + 4 primitivas) ---
const { objects, pedestal, grid } = createSceneObjects(buildMaterial);

// --- Agregar objetos a la escena ---
scene.add(pedestal);
scene.add(grid);
Object.values(objects).forEach(o => {
    scene.add(o.mesh);
    scene.add(o.ring);
});

// --- Luces (4) ---
const { lights, markers } = createLights(scene);
// Los marcadores ya se agregan dentro de createLights()

// --- Órbita de cámara manual ---
setupCameraOrbit(cameras, renderer);

// --- Interfaz de usuario (HUD + panel + selección) ---
setupInterface({
    renderer,
    objects,
    cameras,
    activeCameraRef,
    lights,
    buildMaterial,
});

// --- Responsive ---
setupResize(cameras, renderer);

// --- Bucle de animación ---
startAnimation(renderer, scene, activeCameraRef, objects);
