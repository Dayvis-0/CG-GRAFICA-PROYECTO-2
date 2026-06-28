/**
 * PANEL DE CONCEPTOS (HUD) — Acuario 3D
 *
 * Interfaz visual donde el profesor puede VER qué concepto
 * de la Unidad II está activo en cada momento:
 *
 *   - Modelo de sombreado activo (Lambert / Phong / Standard)
 *   - Tipo de cámara activa (Perspectiva / Ortográfica)
 *   - Estado individual de cada fuente de luz
 *   - Efectos: transparencia del agua, sombras, textura de fondo
 */
export function createConceptPanel() {
    // ── Referencias DOM ──
    const materialGroup      = document.getElementById('materialGroup');
    const materialStatus     = document.getElementById('materialStatus');
    const cameraToggle       = document.getElementById('cameraToggle');
    const cameraStatus       = document.getElementById('cameraStatus');
    const lightSwitches      = document.querySelectorAll('[data-light]');
    const waterToggle        = document.getElementById('waterToggle');
    const shadowsToggle      = document.getElementById('shadowsToggle');
    const textureToggle      = document.getElementById('textureToggle');

    // ── Callbacks (se registran externamente) ──
    let onMaterialChange   = null;
    let onCameraSwitch     = null;
    let onLightToggle      = null;
    let onWaterToggle      = null;
    let onShadowsToggle    = null;
    let onTextureToggle    = null;

    // ── Eventos: Material ──
    if (materialGroup) {
        materialGroup.addEventListener('click', e => {
            const btn = e.target.closest('.cp-btn');
            if (!btn || !btn.dataset.value) return;

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

    // ── Eventos: Agua transparente ──
    if (waterToggle) {
        waterToggle.addEventListener('change', () => {
            if (onWaterToggle) onWaterToggle(waterToggle.checked);
        });
    }

    // ── Eventos: Sombras ──
    if (shadowsToggle) {
        shadowsToggle.addEventListener('change', () => {
            if (onShadowsToggle) onShadowsToggle(shadowsToggle.checked);
        });
    }

    // ── Eventos: Textura de fondo ──
    if (textureToggle) {
        textureToggle.addEventListener('change', () => {
            if (onTextureToggle) onTextureToggle(textureToggle.checked);
        });
    }

    // ── Actualización de indicadores ──

    function updateMaterial(type) {
        if (!materialStatus) return;
        const names = { lambert: 'Lambert', phong: 'Phong', standard: 'Standard' };
        materialStatus.textContent = '→ ' + (names[type] || type);
    }

    function updateCamera(type) {
        if (!cameraStatus || !cameraToggle) return;
        const isPersp = type === 'perspective';
        cameraStatus.textContent = '→ ' + (isPersp ? 'Perspectiva' : 'Ortográfica');
        cameraToggle.innerHTML = isPersp
            ? '<i class="fas fa-exchange-alt"></i> Cambiar a Ortográfica'
            : '<i class="fas fa-exchange-alt"></i> Cambiar a Perspectiva';
    }

    function updateLight(name, state) {
        const input = document.querySelector(`[data-light="${name}"]`);
        if (input && input.checked !== state) {
            input.checked = state;
        }
    }

    function updateWater(state) {
        if (waterToggle && waterToggle.checked !== state) {
            waterToggle.checked = state;
        }
    }

    function updateShadows(state) {
        if (shadowsToggle && shadowsToggle.checked !== state) {
            shadowsToggle.checked = state;
        }
    }

    function updateTexture(state) {
        if (textureToggle && textureToggle.checked !== state) {
            textureToggle.checked = state;
        }
    }

    // ── API pública ──
    return {
        set onMaterialChange(fn)    { onMaterialChange = fn; },
        set onCameraSwitch(fn)      { onCameraSwitch = fn; },
        set onLightToggle(fn)       { onLightToggle = fn; },
        set onWaterToggle(fn)       { onWaterToggle = fn; },
        set onShadowsToggle(fn)     { onShadowsToggle = fn; },
        set onTextureToggle(fn)     { onTextureToggle = fn; },

        updateMaterial,
        updateCamera,
        updateLight,
        updateWater,
        updateShadows,
        updateTexture,
    };
}
