import * as THREE from 'three';

import { createScene }      from './core/SceneManager.js';
import { createCamera }     from './core/CameraManager.js';
import { createRenderer }   from './core/RendererManager.js';
import { createFloor }      from './objects/Floor.js';
import { createClassifier } from './objects/Classifier.js';
import { createPieces }     from './objects/Pieces.js';
import { createLights }     from './lights/Lights.js';
import { setupCameraOrbit } from './controls/CameraOrbit.js';
import { setupResize }      from './utils/ResizeHandler.js';

// ──────────────────────────────────────────────
// 1. Escena
// ──────────────────────────────────────────────
const scene = createScene();

// ──────────────────────────────────────────────
// 2. Renderer
// ──────────────────────────────────────────────
const renderer = createRenderer(document.body);

// ──────────────────────────────────────────────
// 3. Cámara
// ──────────────────────────────────────────────
const camera = createCamera();

// ──────────────────────────────────────────────
// 4. Suelo
// ──────────────────────────────────────────────
const floor = createFloor();
scene.add(floor);

// ──────────────────────────────────────────────
// 5. Cubo clasificador con 6 huecos
// ──────────────────────────────────────────────
const { group: classifier } = createClassifier();
scene.add(classifier);

// ──────────────────────────────────────────────
// 6. Piezas geométricas (alrededor del cubo)
// ──────────────────────────────────────────────
const pieces = createPieces();
scene.add(pieces);

// ──────────────────────────────────────────────
// 7. Luces
// ──────────────────────────────────────────────
createLights(scene);

// ──────────────────────────────────────────────
// 7. Controles de órbita (mouse)
// ──────────────────────────────────────────────
const controls = setupCameraOrbit(camera, renderer);

// ──────────────────────────────────────────────
// 8. Responsive
// ──────────────────────────────────────────────
setupResize(camera, renderer);

// ──────────────────────────────────────────────
// 9. Bucle de renderizado con damping
// ──────────────────────────────────────────────
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();
