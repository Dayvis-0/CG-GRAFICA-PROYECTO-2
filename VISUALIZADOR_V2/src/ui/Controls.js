/**
 * CONFIGURACIÓN DE LA INTERFAZ DE USUARIO
 *
 * Maneja los eventos de la barra de controles inferior:
 *   - Subida de archivo (botón principal + alternativo)
 *   - Play / Pausa
 *   - Clic en barra de progreso (seek)
 *   - Pantalla completa
 *   - Drag & Drop sobre el overlay
 */
export function setupControls(audioManager) {
    const overlay       = document.getElementById('overlay');
    const controlsBar   = document.getElementById('controls-bar');
    const songName      = document.getElementById('songName');
    const playPauseIcon = document.getElementById('playPauseIcon');

    function updatePlayPauseIcon() {
        playPauseIcon.className = audioManager.isPlaying ? 'fas fa-pause' : 'fas fa-play';
    }
    audioManager.onStateChange = updatePlayPauseIcon;

    function onAudioLoaded(file) {
        songName.textContent = file.name;
        overlay.classList.add('hidden-overlay');
        controlsBar.classList.remove('hidden-bar');
    }

    // Subida principal
    document.getElementById('fileInput').addEventListener('change', e => {
        if (e.target.files.length) {
            audioManager.initAudio(e.target.files[0]);
            onAudioLoaded(e.target.files[0]);
        }
    });

    // Subida alternativa
    document.getElementById('fileInputAlt').addEventListener('change', e => {
        if (e.target.files.length) {
            audioManager.initAudio(e.target.files[0]);
            onAudioLoaded(e.target.files[0]);
        }
    });

    // Play / Pausa
    document.getElementById('playPauseBtn').addEventListener('click', () => {
        audioManager.togglePlayPause();
    });

    // Seek en barra de progreso
    document.getElementById('progressBar').addEventListener('click', e => {
        const audio = audioManager.audioElement;
        if (!audioManager.hasAudio || !audio.duration) return;
        const rect  = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        audio.currentTime = ratio * audio.duration;
    });

    // Pantalla completa
    document.getElementById('fullscreenBtn').addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen();
        }
    });

    // Drag & Drop
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
