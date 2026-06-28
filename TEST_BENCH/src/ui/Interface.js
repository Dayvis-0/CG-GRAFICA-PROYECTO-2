import * as THREE from 'three';

/**
 * Configura TODA la interfaz de usuario:
 *  - HUD (información del objeto seleccionado)
 *  - Panel de control (objetos, materiales, texturas, proyección, luces)
 *  - Selección por clic en el viewport (raycaster)
 *
 * @param {object} options
 * @param {THREE.WebGLRenderer}  options.renderer
 * @param {object}               options.objects       — key → { mesh, ring, def, state }
 * @param {object}               options.cameras       — { perspCam, orthoCam }
 * @param {{ current: THREE.Camera }}  options.activeCameraRef
 * @param {object}               options.lights        — { ambient, dir, point1, point2 }
 * @param {function}             options.buildMaterial — (type, color, texKey) => Material
 */
export function setupInterface({ renderer, objects, cameras, activeCameraRef, lights, buildMaterial }) {
    const { perspCam, orthoCam } = cameras;

    let selected = null;

    const raycaster = new THREE.Raycaster();
    const mouseVec  = new THREE.Vector2();

    //  HELPERS
    function capitalize(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    function textureLabel(key) {
        return {
            none: 'Ninguna',
            stripes: 'Rayas',
            dots: 'Lunares',
            gradient: 'Degradado',
            wood: 'Madera',
        }[key] || key;
    }

    function updateHUD() {
        const o = objects[selected];
        document.getElementById('hud-obj').textContent = o.def.label;
        document.getElementById('hud-mat').textContent = capitalize(o.state.material);
        document.getElementById('hud-tex').textContent = textureLabel(o.state.texture);
        document.getElementById('hud-wf').textContent = o.state.wireframe ? 'Sí' : 'No';
    }

    function updatePanelSelection() {
        // Botones de objeto
        document.querySelectorAll('.objbtn').forEach(b => {
            b.classList.toggle('active', b.dataset.key === selected);
        });
        // Botones de material
        const st = objects[selected].state;
        document.querySelectorAll('.matbtn').forEach(b => {
            b.classList.toggle('active', b.dataset.mat === st.material);
        });
        // Botones de textura
        document.querySelectorAll('.texbtn').forEach(b => {
            b.classList.toggle('active', b.dataset.tex === st.texture);
        });
        // Botón wireframe
        const wfBtn = document.getElementById('wf-btn');
        wfBtn.classList.toggle('active', st.wireframe);
        wfBtn.textContent = st.wireframe ? 'Wireframe: ON' : 'Wireframe: OFF';
    }

    //  SELECCIÓN
    function selectObject(key) {
        if (selected) objects[selected].ring.visible = false;
        selected = key;
        objects[key].ring.visible = true;
        updateHUD();
        updatePanelSelection();
    }

    // --- Raycaster: clic en el viewport ---
    renderer.domElement.addEventListener('click', (e) => {
        mouseVec.x =  (e.clientX / window.innerWidth)  * 2 - 1;
        mouseVec.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouseVec, activeCameraRef.current);

        const meshes = Object.values(objects).map(o => o.mesh);
        const hits = raycaster.intersectObjects(meshes);
        if (hits.length > 0) {
            selectObject(hits[0].object.userData.key);
        }
    });

    //  PANEL — Botones de objeto
    const objButtonsDiv = document.getElementById('obj-buttons');
    Object.values(objects).forEach(o => {
        const btn = document.createElement('span');
        btn.className = 'objbtn';
        btn.textContent = o.def.label;
        btn.dataset.key = o.def.key;
        btn.onclick = () => selectObject(o.def.key);
        objButtonsDiv.appendChild(btn);
    });

    //  PANEL — Botones de material
    document.querySelectorAll('.matbtn').forEach(btn => {
        btn.onclick = () => {
            const o = objects[selected];
            o.state.material = btn.dataset.mat;
            o.mesh.material = buildMaterial(o.state.material, o.state.color, o.state.texture, o.state.wireframe);
            updateHUD();
            updatePanelSelection();
        };
    });

    //  PANEL — Botones de textura
    document.querySelectorAll('.texbtn').forEach(btn => {
        btn.onclick = () => {
            const o = objects[selected];
            o.state.texture = btn.dataset.tex;
            o.mesh.material = buildMaterial(o.state.material, o.state.color, o.state.texture, o.state.wireframe);
            updateHUD();
            updatePanelSelection();
        };
    });

    //  PANEL — Proyección (perspectiva / ortográfica)
    document.getElementById('proj-persp').onclick = () => {
        activeCameraRef.current = perspCam;
        document.getElementById('proj-persp').classList.add('active');
        document.getElementById('proj-ortho').classList.remove('active');
        document.getElementById('hud-proj').textContent = 'Perspectiva';
    };

    document.getElementById('proj-ortho').onclick = () => {
        activeCameraRef.current = orthoCam;
        document.getElementById('proj-ortho').classList.add('active');
        document.getElementById('proj-persp').classList.remove('active');
        document.getElementById('hud-proj').textContent = 'Ortográfica';
    };

    //  PANEL — Toggles de luces
    document.querySelectorAll('.lighttoggle').forEach(tg => {
        tg.onclick = () => {
            const key = tg.dataset.light;
            const isOn = tg.classList.toggle('on');
            lights[key].visible = isOn;
        };
    });

    //  PANEL — Botón wireframe
    document.getElementById('wf-btn').onclick = () => {
        const o = objects[selected];
        o.state.wireframe = !o.state.wireframe;
        o.mesh.material = buildMaterial(o.state.material, o.state.color, o.state.texture, o.state.wireframe);
        updateHUD();
        updatePanelSelection();
    };

    //  MOVIMIENTO POR TECLADO (flechas)
    window.addEventListener('keydown', (e) => {
        if (!selected) return;

        const o = objects[selected];
        const step = 0.15;

        switch (e.key) {
            case 'ArrowUp':    o.mesh.position.z -= step; o.ring.position.z -= step; break;
            case 'ArrowDown':  o.mesh.position.z += step; o.ring.position.z += step; break;
            case 'ArrowLeft':  o.mesh.position.x -= step; o.ring.position.x -= step; break;
            case 'ArrowRight': o.mesh.position.x += step; o.ring.position.x += step; break;
            default:           return;
        }

        e.preventDefault();
    });

    //  INICIALIZAR — arranca con el Toro seleccionado
    selectObject('torus');
}
