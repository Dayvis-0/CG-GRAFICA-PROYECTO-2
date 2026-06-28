import * as THREE from 'three';

/**
 * Crea una fábrica de materiales que cierra sobre el mapa de texturas.
 * @param {object} textures  el objeto devuelto por createTextures()
 * @returns {function} buildMaterial(type, color, textureKey)
 */
export function createMaterialFactory(textures) {
    return function buildMaterial(type, color, textureKey, wireframe = false) {
        const tex = textures[textureKey] || null;
        const common = { color, map: tex, wireframe };

        switch (type) {
            case 'lambert':
                return new THREE.MeshLambertMaterial(common);
            case 'phong':
                return new THREE.MeshPhongMaterial({
                    ...common,
                    shininess: 90,
                    specular: 0x666666,
                });
            case 'standard':
                return new THREE.MeshStandardMaterial({
                    ...common,
                    roughness: 0.35,
                    metalness: 0.45,
                });
            default:
                return new THREE.MeshPhongMaterial(common);
        }
    };
}
