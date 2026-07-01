import * as THREE from 'three';

/**
 * Configura TODA la interfaz de usuario:
 *  - HUD (información del objeto seleccionado)
 *  - Panel de control (objetos, materiales, texturas, proyección, luces)
 *  - Drag & drop con mouse (movimiento + auto‑stack continuo)
 *
 * @param {object} options
 * @param {THREE.WebGLRenderer}  options.renderer
 * @param {object}               options.objects       — key → { mesh, ring, def, state }
 * @param {object}               options.cameras       — { perspCam, orthoCam }
 * @param {{ current: THREE.Camera }}  options.activeCameraRef
 * @param {object}               options.lights        — { ambient, dir, point1, point2 }
 * @param {function}             options.buildMaterial — (type, color, texKey) => Material
 * @param {object}               options.collision     — { tryMove, dragMove, stackSelected, isStacked }
 */
export function setupInterface({ renderer, objects, cameras, activeCameraRef, lights, buildMaterial, collision }) {
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
        // No mostramos estado de stack en HUD para no saturar, pero
        // se nota visualmente por la posición Y del objeto
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

    // ──────────────────────────────────────────────
    //  DRAG & DROP de objetos con el mouse
    // ──────────────────────────────────────────────
    const dragPlane      = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const dragPrevPoint  = new THREE.Vector3();
    let   isDragging     = false;
    let   dragKey        = null;
    let   dragTotalDist  = 0;

    renderer.domElement.addEventListener('mousedown', (e) => {
        mouseVec.x =  (e.clientX / window.innerWidth)  * 2 - 1;
        mouseVec.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouseVec, activeCameraRef.current);

        const meshes = Object.values(objects).map(o => o.mesh);
        const hits = raycaster.intersectObjects(meshes);
        if (hits.length > 0) {
            const key = hits[0].object.userData.key;
            selectObject(key);

            // Iniciar drag
            isDragging    = true;
            dragKey       = key;
            dragTotalDist = 0;

            const pt = new THREE.Vector3();
            raycaster.ray.intersectPlane(dragPlane, pt);
            if (pt) dragPrevPoint.copy(pt);

            window.__dragObject = true;  // ← avisa al orbit que no rote
            e.preventDefault();
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging || !dragKey) return;

        mouseVec.x =  (e.clientX / window.innerWidth)  * 2 - 1;
        mouseVec.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouseVec, activeCameraRef.current);

        const pt = new THREE.Vector3();
        raycaster.ray.intersectPlane(dragPlane, pt);
        if (pt) {
            const dx = pt.x - dragPrevPoint.x;
            const dz = pt.z - dragPrevPoint.z;
            dragPrevPoint.copy(pt);
            dragTotalDist += Math.abs(dx) + Math.abs(dz);

            collision.dragMove(dragKey, dx, dz);
        }
    });

    window.addEventListener('mouseup', () => {
        // El stacking ya ocurre en tiempo real durante dragMove()
        isDragging    = false;
        dragKey       = null;
        dragTotalDist = 0;
        window.__dragObject = false;
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

    //  MOVIMIENTO POR TECLADO (flechas + stacking)
    window.addEventListener('keydown', (e) => {
        if (!selected) return;

        const step = 0.15;

        switch (e.key) {
            case 'ArrowUp':    collision.tryMove(selected,  0, -step); e.preventDefault(); break;
            case 'ArrowDown':  collision.tryMove(selected,  0,  step); e.preventDefault(); break;
            case 'ArrowLeft':  collision.tryMove(selected, -step,  0); e.preventDefault(); break;
            case 'ArrowRight': collision.tryMove(selected,  step,  0); e.preventDefault(); break;

            default: return;
        }
    });

    //  INICIALIZAR — arranca con el Toro seleccionado
    selectObject('torus');
}
