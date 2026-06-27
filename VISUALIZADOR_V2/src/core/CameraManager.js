import * as THREE from 'three';

/**
 * Administra dos cámaras: perspectiva y ortográfica.
 * Permite cambiar entre ambas manteniendo la misma posición y orientación.
 * Se integra con OrbitControls reasignando la referencia `controls.object`.
 */
export function createCameraManager() {
    const aspect = window.innerWidth / window.innerHeight;
    const FRUSTUM_SIZE = 13;

    // --- Cámara perspectiva ---
    const perspCam = new THREE.PerspectiveCamera(55, aspect, 0.1, 200);
    perspCam.position.set(0, 14, 18);

    // --- Cámara ortográfica ---
    const orthoCam = new THREE.OrthographicCamera(
        -FRUSTUM_SIZE * aspect, FRUSTUM_SIZE * aspect,
        FRUSTUM_SIZE, -FRUSTUM_SIZE,
        0.1, 200
    );
    orthoCam.position.copy(perspCam.position);

    let activeType = 'perspective';

    /** Retorna la cámara activa actualmente. */
    function getActiveCamera() {
        return activeType === 'perspective' ? perspCam : orthoCam;
    }

    /** Cambia entre perspectiva y ortográfica. Retorna el nuevo tipo. */
    function switchCamera() {
        const old = getActiveCamera();
        activeType = activeType === 'perspective' ? 'orthographic' : 'perspective';
        const newCam = getActiveCamera();
        // Mantener misma posición y rotación
        newCam.position.copy(old.position);
        newCam.quaternion.copy(old.quaternion);
        newCam.updateProjectionMatrix();
        return activeType;
    }

    /** Actualiza ambas cámaras al cambiar el tamaño de la ventana. */
    function onResize() {
        const a = window.innerWidth / window.innerHeight;
        perspCam.aspect = a;
        perspCam.updateProjectionMatrix();
        orthoCam.left   = -FRUSTUM_SIZE * a;
        orthoCam.right  =  FRUSTUM_SIZE * a;
        orthoCam.top    =  FRUSTUM_SIZE;
        orthoCam.bottom = -FRUSTUM_SIZE;
        orthoCam.updateProjectionMatrix();
    }

    /** Sincroniza la posición de la cámara inactiva con la activa. */
    function syncCameras() {
        const active = getActiveCamera();
        const other = activeType === 'perspective' ? orthoCam : perspCam;
        other.position.copy(active.position);
        other.quaternion.copy(active.quaternion);
    }

    return {
        perspCam,
        orthoCam,
        getActiveCamera,
        switchCamera,
        onResize,
        syncCameras,
        get activeType() { return activeType; },
    };
}
