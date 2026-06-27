
//  GESTOR DE AUDIO (Web Audio API)
//  Encapsula el contexto, analizador y control
//  de reproducción.

const FFT_SIZE = 512;

export function createAudioManager() {
    let audioContext    = null;
    let analyser        = null;
    let dataArray       = null;
    let bufferLength    = null;
    let mediaSource     = null;
    let audioInitialized = false;

    const audioElement  = new Audio();
    let _isPlaying      = false;
    let _hasAudio       = false;
    let _onStateChange  = null; // callback cada vez que cambia isPlaying

    // --- Inicializar cadena de audio y cargar archivo ---
    function initAudio(file) {
        if (!audioInitialized) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = FFT_SIZE;
            analyser.smoothingTimeConstant = 0.78;
            bufferLength = analyser.frequencyBinCount; // 256
            dataArray = new Uint8Array(bufferLength);

            mediaSource = audioContext.createMediaElementSource(audioElement);
            mediaSource.connect(analyser);
            analyser.connect(audioContext.destination);
            audioInitialized = true;
        }

        audioElement.src = URL.createObjectURL(file);
        audioElement.load();

        if (audioContext.state === 'suspended') audioContext.resume();

        audioElement.play()
            .then(() => {
                _isPlaying = true;
                _hasAudio  = true;
                notifyStateChange();
            })
            .catch(err => console.error('Error al reproducir:', err));
    }

    // --- Alternar play / pausa ---
    function togglePlayPause() {
        if (!_hasAudio) return;

        if (_isPlaying) {
            audioElement.pause();
            _isPlaying = false;
        } else {
            if (audioContext?.state === 'suspended') audioContext.resume();
            audioElement.play();
            _isPlaying = true;
        }
        notifyStateChange();
    }

    // --- Obtener array de frecuencias ---
    function getFrequencyData() {
        if (analyser) {
            analyser.getByteFrequencyData(dataArray);
            return dataArray;
        }
        return null;
    }

    // --- Limpiar recursos ---
    function destroy() {
        audioElement.pause();
        audioElement.src = '';
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
    }

    // --- Notificar cambio de estado a la UI ---
    function notifyStateChange() {
        if (_onStateChange) _onStateChange();
    }

    // --- Capturar fin de canción ---
    audioElement.addEventListener('ended', () => {
        _isPlaying = false;
        notifyStateChange();
    });

    // --- API pública ---
    return {
        audioElement,
        get analyser()       { return analyser; },
        get bufferLength()   { return bufferLength; },
        get isPlaying()      { return _isPlaying; },
        get hasAudio()       { return _hasAudio; },
        set onStateChange(fn) { _onStateChange = fn; },
        initAudio,
        togglePlayPause,
        getFrequencyData,
        destroy,
    };
}
