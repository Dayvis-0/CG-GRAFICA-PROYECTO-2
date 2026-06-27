import * as THREE from 'three';
import { colorLUT, emissiveLUT, MAX_HEIGHT } from '../objects/Bars.js';

/**
 * GESTOR DE MATERIALES INTERCAMBIABLES
 *
 * Permite cambiar el modelo de sombreado de TODAS las barras en tiempo real:
 *   - Lambert  → MeshLambertMaterial  (sombreado difuso, sin brillos)
 *   - Phong    → MeshPhongMaterial    (sombreado con brillos especulares)
 *   - Standard → MeshStandardMaterial (PBR: metalness + roughness)
 *
 * Demuestra los modelos de iluminación de la Semana 11.
 * Al cambiar, las barras mantienen su color actual gracias a que
 * los tres materiales comparten las propiedades .color y .emissive.
 */
export function createMaterialManager() {
    let currentType = 'standard';

    /**
     * Crea un material del tipo especificado con el color y emisivo dados.
     */
    function createMaterial(type, color, emissive) {
        switch (type) {
            case 'lambert':
                return new THREE.MeshLambertMaterial({
                    color: color.clone(),
                    emissive: emissive.clone(),
                    emissiveIntensity: 1.0,
                });

            case 'phong':
                return new THREE.MeshPhongMaterial({
                    color: color.clone(),
                    emissive: emissive.clone(),
                    emissiveIntensity: 1.0,
                    shininess: 50,
                    specular: new THREE.Color(0x222244),
                });

            case 'standard':
            default:
                return new THREE.MeshStandardMaterial({
                    color: color.clone(),
                    emissive: emissive.clone(),
                    emissiveIntensity: 1.0,
                    metalness: 0.4,
                    roughness: 0.5,
                });
        }
    }

    /**
     * Aplica el material actual a todas las barras.
     * Lee la altura actual de cada barra para determinar el color correcto
     * de la LUT y preserva la apariencia visual al cambiar de material.
     */
    function applyToBars(bars) {
        for (let i = 0; i < bars.length; i++) {
            const bar = bars[i];
            const h   = Math.max(0.05, bar.userData.currentHeight || 0.05);
            const t   = Math.min(1, h / MAX_HEIGHT);
            const idx = Math.min(255, Math.floor(t * 255));

            const newMat = createMaterial(currentType, colorLUT[idx], emissiveLUT[idx]);

            // Preservar estado de transparencia si estaba activa
            if (bar.material) {
                newMat.transparent = bar.material.transparent;
                newMat.opacity     = bar.material.opacity;
                bar.material.dispose();
            }

            bar.material = newMat;
        }
    }

    /**
     * Cambia el tipo de material y lo aplica a todas las barras.
     * @param {string} type  'lambert' | 'phong' | 'standard'
     */
    function setType(type, bars) {
        if (type === currentType || !bars) return;
        currentType = type;
        applyToBars(bars);
    }

    /**
     * Retorna el nombre legible del material activo.
     */
    function getDisplayName() {
        const names = { lambert: 'Lambert', phong: 'Phong', standard: 'Standard' };
        return names[currentType] || 'Standard';
    }

    return {
        setType,
        applyToBars,
        getDisplayName,
        get currentType() { return currentType; },
    };
}
