/**
 * Configura todos los eventos de la interfaz de usuario:
 *  - Subida de archivo (botón principal y alternativo)
 *  - Play / Pausa
 *  - Clic en barra de progreso
 *  - Pantalla completa
 *  - Drag & Drop sobre el overlay
 */
export function setupControls(audioManager) {
    const overlay       = document.getElementById('overlay');
    const controlsBar   = document.getElementById('controls-bar');
    const songName      = document.getElementById('songName');
    const playPauseIcon = document.getElementById('playPauseIcon');

    // --- Sincronizar icono de play/pausa ---
    function updatePlayPauseIcon() {
        playPauseIcon.className = audioManager.isPlaying ? 'fas fa-pause' : 'fas fa-play';
    }
    audioManager.onStateChange = updatePlayPauseIcon;

    // --- Mostrar controles y overlay tras cargar audio ---
    function onAudioLoaded(file) {
        songName.textContent = file.name;
        overlay.classList.add('hidden-overlay');
        controlsBar.classList.remove('hidden-bar');
    }

    // --- Subida de archivo (botón principal) ---
    document.getElementById('fileInput').addEventListener('change', e => {
        if (e.target.files.length) {
            audioManager.initAudio(e.target.files[0]);
            onAudioLoaded(e.target.files[0]);
        }
    });

    // --- Subida de archivo (botón alternativo en controles) ---
    document.getElementById('fileInputAlt').addEventListener('change', e => {
        if (e.target.files.length) {
            audioManager.initAudio(e.target.files[0]);
            onAudioLoaded(e.target.files[0]);
        }
    });

    // --- Play / Pausa ---
    document.getElementById('playPauseBtn').addEventListener('click', () => {
        audioManager.togglePlayPause();
    });

    // --- Clic en barra de progreso para saltar ---
    document.getElementById('progressBar').addEventListener('click', e => {
        const audio = audioManager.audioElement;
        if (!audioManager.hasAudio || !audio.duration) return;
        const rect  = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        audio.currentTime = ratio * audio.duration;
    });

    // --- Pantalla completa ---
    document.getElementById('fullscreenBtn').addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen();
        }
    });

    // --- Drag & Drop sobre el overlay ---
    overlay.addEventListener('dragover', e => {
        e.preventDefault();
        overlay.classList.add('drag-active');
    });
    overlay.addEventListener('dragleave', () => {
        overlay.classList.remove('drag-active');
    });
    overlay.addEventListener('drop', e => {
        e.preventDefault();
        overlay.classList.remove('drag-active');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('audio/')) {
            audioManager.initAudio(file);
            onAudioLoaded(file);
        }
    });
}
