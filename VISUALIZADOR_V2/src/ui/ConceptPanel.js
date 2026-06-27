/**
 * PANEL DE CONCEPTOS (HUD)
 *
 * Proporciona una interfaz visual donde el profesor puede VER
 * qué concepto de la Unidad II está activo en cada momento:
 *
 *   - Modelo de sombreado activo (Lambert / Phong / Standard)
 *   - Tipo de cámara activa (Perspectiva / Ortográfica)
 *   - Estado individual de cada fuente de luz
 *   - Efectos: sombras, transparencia, textura
 *
 * También expone funciones para actualizar los indicadores
 * desde el bucle de animación o desde los controladores.
 *
 * Requisito: "Interfaz que nombre los conceptos" (punto 6).
 */
export function createConceptPanel() {
    // ── Referencias DOM ──
    const materialGroup   = document.getElementById('materialGroup');
    const materialStatus  = document.getElementById('materialStatus');
    const cameraToggle    = document.getElementById('cameraToggle');
    const cameraStatus    = document.getElementById('cameraStatus');
    const lightSwitches   = document.querySelectorAll('[data-light]');
    const shadowsToggle   = document.getElementById('shadowsToggle');
    const transparencyToggle = document.getElementById('transparencyToggle');
    const textureToggle   = document.getElementById('textureToggle');

    // ── Callbacks (se registran externamente) ──
    let onMaterialChange  = null;
    let onCameraSwitch    = null;
    let onLightToggle     = null;
    let onShadowsToggle   = null;
    let onTransparencyToggle = null;
    let onTextureToggle   = null;

    // ── Eventos: Material ──
    if (materialGroup) {
        materialGroup.addEventListener('click', e => {
            const btn = e.target.closest('.cp-btn');
            if (!btn || !btn.dataset.value) return;

            // Actualizar botón activo
            materialGroup.querySelectorAll('.cp-btn').forEach(b => {
                b.classList.remove('cp-btn-active');
            });
            btn.classList.add('cp-btn-active');

            const value = btn.dataset.value;
            if (onMaterialChange) onMaterialChange(value);
        });
    }

    // ── Eventos: Cámara ──
    if (cameraToggle) {
        cameraToggle.addEventListener('click', () => {
            if (onCameraSwitch) onCameraSwitch();
        });
    }

    // ── Eventos: Luces ──
    lightSwitches.forEach(input => {
        input.addEventListener('change', () => {
            const name = input.dataset.light;
            if (onLightToggle) onLightToggle(name);
        });
    });

    // ── Eventos: Sombras ──
    if (shadowsToggle) {
        shadowsToggle.addEventListener('change', () => {
            if (onShadowsToggle) onShadowsToggle(shadowsToggle.checked);
        });
    }

    // ── Eventos: Transparencia ──
    if (transparencyToggle) {
        transparencyToggle.addEventListener('change', () => {
            if (onTransparencyToggle) onTransparencyToggle(transparencyToggle.checked);
        });
    }

    // ── Eventos: Textura ──
    if (textureToggle) {
        textureToggle.addEventListener('change', () => {
            if (onTextureToggle) onTextureToggle(textureToggle.checked);
        });
    }

    // ── Actualización de indicadores ──

    /** Actualiza el indicador de material activo. */
    function updateMaterial(type) {
        if (!materialStatus) return;
        const names = { lambert: 'Lambert', phong: 'Phong', standard: 'Standard' };
        materialStatus.textContent = '→ ' + (names[type] || type);
    }

    /** Actualiza el indicador de tipo de cámara. */
    function updateCamera(type) {
        if (!cameraStatus || !cameraToggle) return;
        const isPersp = type === 'perspective';
        cameraStatus.textContent = '→ ' + (isPersp ? 'Perspectiva' : 'Ortográfica');
        cameraToggle.innerHTML = isPersp
            ? '<i class="fas fa-exchange-alt"></i> Cambiar a Ortográfica'
            : '<i class="fas fa-exchange-alt"></i> Cambiar a Perspectiva';
    }

    /** Actualiza el indicador de una luz específica. */
    function updateLight(name, state) {
        const input = document.querySelector(`[data-light="${name}"]`);
        if (input && input.checked !== state) {
            input.checked = state;
        }
    }

    /** Actualiza el indicador de sombras. */
    function updateShadows(state) {
        if (shadowsToggle && shadowsToggle.checked !== state) {
            shadowsToggle.checked = state;
        }
    }

    /** Actualiza el indicador de transparencia. */
    function updateTransparency(state) {
        if (transparencyToggle && transparencyToggle.checked !== state) {
            transparencyToggle.checked = state;
        }
    }

    /** Actualiza el indicador de textura. */
    function updateTexture(state) {
        if (textureToggle && textureToggle.checked !== state) {
            textureToggle.checked = state;
        }
    }

    // ── API pública ──
    return {
        // Setters de callbacks
        set onMaterialChange(fn)     { onMaterialChange = fn; },
        set onCameraSwitch(fn)       { onCameraSwitch = fn; },
        set onLightToggle(fn)        { onLightToggle = fn; },
        set onShadowsToggle(fn)      { onShadowsToggle = fn; },
        set onTransparencyToggle(fn) { onTransparencyToggle = fn; },
        set onTextureToggle(fn)      { onTextureToggle = fn; },

        // Actualizadores
        updateMaterial,
        updateCamera,
        updateLight,
        updateShadows,
        updateTransparency,
        updateTexture,
    };
}
