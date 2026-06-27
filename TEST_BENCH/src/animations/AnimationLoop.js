import * as THREE from 'three';

/**
 * Inicia el bucle de renderizado.
 * @param {THREE.WebGLRenderer}   renderer
 * @param {THREE.Scene}           scene
 * @param {{ current: THREE.Camera }}  activeCameraRef
 * @param {object}                objects  — key → { mesh, ... }
 */
export function startAnimation(renderer, scene, activeCameraRef, objects) {
    function animate() {
        requestAnimationFrame(animate);

        // Rotación ambiental leve de todos los objetos
        Object.values(objects).forEach(o => {
            o.mesh.rotation.y += 0.0035;
        });

        renderer.render(scene, activeCameraRef.current);
    }

    animate();
}
