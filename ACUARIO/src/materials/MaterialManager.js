import * as THREE from 'three';

/**
 * GESTOR DE MATERIALES INTERCAMBIABLES PARA PECES
 *
 * Permite cambiar el modelo de sombreado de TODOS los peces en tiempo real:
 *   - Lambert  → MeshLambertMaterial  (sombreado difuso, sin brillos — escamas mates)
 *   - Phong    → MeshPhongMaterial    (sombreado con brillos especulares — escamas brillan)
 *   - Standard → MeshStandardMaterial (PBR: metalness + roughness — realista)
 *
 * Demuestra los modelos de iluminación de la Semana 11.
 */
export function createMaterialManager() {
    let currentType = 'standard';

    /**
     * Crea un material del tipo especificado, conservando color y
     * propiedades de transparencia del material original.
     */
    function createMaterial(type, color, sourceMat = null) {
        const isTransparent = sourceMat?.transparent || false;
        const opacity      = sourceMat?.opacity ?? 1.0;

        switch (type) {
            case 'lambert':
                return new THREE.MeshLambertMaterial({
                    color: color.clone(),
                    transparent: isTransparent,
                    opacity,
                });

            case 'phong':
                return new THREE.MeshPhongMaterial({
                    color: color.clone(),
                    transparent: isTransparent,
                    opacity,
                    shininess: 80,
                    specular: new THREE.Color(0x88ccff),
                });

            case 'standard':
            default:
                return new THREE.MeshStandardMaterial({
                    color: color.clone(),
                    transparent: isTransparent,
                    opacity,
                    metalness: 0.2,
                    roughness: 0.3,
                });
        }
    }

    /**
     * Aplica el tipo de material actual a todos los peces.
     * @param {Array} fishData - Arreglo con { coloredParts, color }
     */
    function setType(type, fishData) {
        if (type === currentType || !fishData) return;
        currentType = type;

        for (const f of fishData) {
            if (!f.coloredParts) continue;
            for (const part of f.coloredParts) {
                const newMat = createMaterial(type, f.color, part.material);
                part.material.dispose();
                part.material = newMat;
            }
        }
    }

    function getDisplayName() {
        const names = { lambert: 'Lambert', phong: 'Phong', standard: 'Standard' };
        return names[currentType] || 'Standard';
    }

    return {
        setType,
        getDisplayName,
        get currentType() { return currentType; },
    };
}
