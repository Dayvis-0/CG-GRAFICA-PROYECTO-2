/**
 * Configura el HUD y panel de control del Cubo Clasificador.
 * (Modo FPS: solo cámara perspectiva, proyección fija)
 *
 * Responsabilidad ÚNICA: manejar la interfaz DOM (HUD + panel).
 * No escucha teclado — eso vive en InputManager + AnimationLoop.
 */
export function setupInterface({
    piecesGroup,
    buildMaterial,
    lights,
}) {
    const labelToMesh = {};
    piecesGroup.children.forEach(c => {
        if (c.isMesh) labelToMesh[c.userData.label] = c;
    });

    let selectedKey = null;

    // ── Helpers ──
    function capitalize(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    function textureLabel(key) {
        return { none: 'Ninguna', stripes: 'Rayas', dots: 'Lunares', gradient: 'Degradado', wood: 'Madera' }[key] || key;
    }

    function getMeshState() {
        if (!selectedKey) return null;
        const mesh = labelToMesh[selectedKey];
        if (!mesh) return null;
        return {
            mesh,
            def: { label: selectedKey, color: mesh.material.color.getHex() },
            state: {
                material: mesh.userData._matType || 'standard',
                texture: mesh.userData._texKey || 'none',
                wireframe: mesh.material.wireframe || false,
            },
        };
    }

    // ── HUD ──
    function updateHUD() {
        const st = getMeshState();
        document.getElementById('hud-obj').textContent = st ? st.def.label : '—';
        document.getElementById('hud-mat').textContent = st ? capitalize(st.state.material) : '—';
        document.getElementById('hud-tex').textContent = st ? textureLabel(st.state.texture) : '—';
        document.getElementById('hud-wf').textContent = st ? (st.state.wireframe ? 'Sí' : 'No') : '—';
    }

    // ── Panel ──
    function updatePanelSelection() {
        const st = getMeshState();
        // Botones de objeto
        document.querySelectorAll('.objbtn').forEach(b => {
            b.classList.toggle('active', b.dataset.key === selectedKey);
        });
        if (!st) {
            document.querySelectorAll('.matbtn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.texbtn').forEach(b => b.classList.remove('active'));
            document.getElementById('wf-btn').classList.remove('active');
            document.getElementById('wf-btn').textContent = 'Wireframe: OFF';
            return;
        }
        // Botones de material
        document.querySelectorAll('.matbtn').forEach(b => {
            b.classList.toggle('active', b.dataset.mat === st.state.material);
        });
        // Botones de textura
        document.querySelectorAll('.texbtn').forEach(b => {
            b.classList.toggle('active', b.dataset.tex === st.state.texture);
        });
        // Wireframe
        document.getElementById('wf-btn').classList.toggle('active', st.state.wireframe);
        document.getElementById('wf-btn').textContent = st.state.wireframe ? 'Wireframe: ON' : 'Wireframe: OFF';
    }

    // ── Reconstruir material ──
    function rebuildMaterial() {
        const st = getMeshState();
        if (!st) return;
        st.mesh.material = buildMaterial(st.state.material, st.def.color, st.state.texture, st.state.wireframe);
        st.mesh.userData._matType = st.state.material;
        st.mesh.userData._texKey = st.state.texture;
        updateHUD();
        updatePanelSelection();
    }

    // ── Helper genérico para cambios de estado del material ─────
    // Reemplaza el patrón repetitivo de matbtn / texbtn / wfbtn.
    // Acepta un valor directo o una función (prev => next) para toggles.
    function onStateChange(propKey, valueOrFn) {
        if (!selectedKey) return;
        const st = getMeshState();
        st.state[propKey] = typeof valueOrFn === 'function'
            ? valueOrFn(st.state[propKey])
            : valueOrFn;
        rebuildMaterial();
    }

    // ─── SELECCIÓN ──────────────────────────────

    // 1) Callback desde DragManager (click en 3D)
    function onPieceSelected(mesh) {
        if (mesh && mesh.userData.label && labelToMesh[mesh.userData.label]) {
            selectedKey = mesh.userData.label;
        } else {
            selectedKey = null;
        }
        updateHUD();
        updatePanelSelection();
    }

    // 2) Botones del panel
    function selectByLabel(label) {
        selectedKey = label;
        updateHUD();
        updatePanelSelection();
    }

    // ─── PANEL: Botones de objeto ───────────────
    const btnContainer = document.getElementById('obj-buttons');
    piecesGroup.children.forEach(c => {
        if (!c.isMesh) return;
        const btn = document.createElement('span');
        btn.className = 'btn objbtn';
        btn.textContent = c.userData.label;
        btn.dataset.key = c.userData.label;
        btn.onclick = () => selectByLabel(c.userData.label);
        btnContainer.appendChild(btn);
    });

    // ─── PANEL: Material / Textura / Wireframe (DRY via onStateChange) ──
    document.querySelectorAll('.matbtn').forEach(btn => {
        btn.onclick = () => onStateChange('material', btn.dataset.mat);
    });

    document.querySelectorAll('.texbtn').forEach(btn => {
        btn.onclick = () => onStateChange('texture', btn.dataset.tex);
    });

    document.getElementById('wf-btn').onclick = () => {
        onStateChange('wireframe', prev => !prev);
    };

    // ─── PANEL: Proyección (FPS fijo) ───────────
    document.getElementById('hud-proj').textContent = 'Perspectiva (FPS)';
    document.getElementById('proj-ortho').style.display = 'none';

    // ─── PANEL: Luces ───────────────────────────
    document.querySelectorAll('.lighttoggle').forEach(tg => {
        tg.onclick = () => {
            const key = tg.dataset.light;
            const isOn = tg.classList.toggle('on');
            lights[key].visible = isOn;
        };
    });

    // ─── Inicializar HUD ────────────────────────
    updateHUD();
    updatePanelSelection();

    return { onPieceSelected };
}
