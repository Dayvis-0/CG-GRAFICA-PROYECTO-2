import { HOLE_CONFIGS } from '../data/holeConfigs.js';

/**
 * Configura el HUD y panel de control del Cubo Clasificador.
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

    // ── Puntajes por pieza clasificada ──
    const scores = {};
    for (const cfg of HOLE_CONFIGS) {
        scores[cfg.label] = 0;
    }

    // ── Helpers ──
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

    // ── HUD: puntajes ──
    function updateHUD() {
        for (const cfg of HOLE_CONFIGS) {
            const el = document.getElementById(`score-${cfg.label}`);
            if (el) el.textContent = scores[cfg.label];
        }
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

    // ── Aplicar estado actualizado al mesh ──
    function applyState(st) {
        if (!st) return;
        st.mesh.material = buildMaterial(st.state.material, st.def.color, st.state.texture, st.state.wireframe);
        st.mesh.userData._matType = st.state.material;
        st.mesh.userData._texKey = st.state.texture;
        updatePanelSelection();
    }

    // ── Helper genérico para cambios de estado del material ─────
    function onStateChange(propKey, valueOrFn) {
        if (!selectedKey) return;
        const st = getMeshState();
        if (!st) return;
        st.state[propKey] = typeof valueOrFn === 'function'
            ? valueOrFn(st.state[propKey])
            : valueOrFn;
        applyState(st);
    }

    // ─── SELECCIÓN ──────────────────────────────
    function onPieceSelected(mesh) {
        if (mesh && mesh.userData.label && labelToMesh[mesh.userData.label]) {
            selectedKey = mesh.userData.label;
        } else {
            selectedKey = null;
        }
        updatePanelSelection();
    }

    function selectByLabel(label) {
        selectedKey = label;
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

    // ─── PANEL: Material / Textura / Wireframe ──
    document.querySelectorAll('.matbtn').forEach(btn => {
        btn.onclick = () => onStateChange('material', btn.dataset.mat);
    });

    document.querySelectorAll('.texbtn').forEach(btn => {
        btn.onclick = () => onStateChange('texture', btn.dataset.tex);
    });

    document.getElementById('wf-btn').onclick = () => {
        onStateChange('wireframe', prev => !prev);
    };

    // ─── PANEL: Luces ───────────────────────────
    document.querySelectorAll('.lighttoggle').forEach(tg => {
        tg.onclick = () => {
            const key = tg.dataset.light;
            const isOn = tg.classList.toggle('on');
            lights[key].visible = isOn;
        };
    });

    // ─── Construir filas de puntajes en el HUD ──
    const scoresContainer = document.getElementById('hud-scores');
    for (const cfg of HOLE_CONFIGS) {
        const row = document.createElement('div');
        row.className = 'row';
        row.innerHTML = `${cfg.label}: <span class="status" id="score-${cfg.label}">0</span>`;
        scoresContainer.appendChild(row);
    }

    // ─── Inicializar ────────────────────────────
    updateHUD();
    updatePanelSelection();

    return {
        onPieceSelected,
        /** Incrementa el puntaje de una pieza clasificada correctamente */
        onPieceClassified(label) {
            if (scores[label] !== undefined) {
                scores[label]++;
                updateHUD();
            }
        },
        /** Reinicia todos los puntajes a 0 */
        resetScores() {
            for (const key in scores) scores[key] = 0;
            updateHUD();
        },
    };
}