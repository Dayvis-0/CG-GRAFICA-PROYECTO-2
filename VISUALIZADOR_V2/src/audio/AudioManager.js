/**
 * GESTOR DE AUDIO (Web Audio API)
 * Encapsula el contexto, analizador y control de reproducción.
 * Reutilizado del proyecto base, sin modificaciones.
 */
const FFT_SIZE = 512;

export function createAudioManager() {
    let audioContext      = null;
    let analyser          = null;
    let dataArray         = null;
    let bufferLength      = null;
    let mediaSource       = null;
    let audioInitialized  = false;

    const audioElement    = new Audio();
    let _isPlaying        = false;
    let _hasAudio         = false;
    let _onStateChange    = null;

    function initAudio(file) {
        if (!audioInitialized) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = FFT_SIZE;
            analyser.smoothingTimeConstant = 0.78;
            bufferLength = analyser.frequencyBinCount;
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

    function getFrequencyData() {
        if (analyser) {
            analyser.getByteFrequencyData(dataArray);
            return dataArray;
        }
        return null;
    }

    function destroy() {
        audioElement.pause();
        audioElement.src = '';
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
    }

    function notifyStateChange() {
        if (_onStateChange) _onStateChange();
    }

    audioElement.addEventListener('ended', () => {
        _isPlaying = false;
        notifyStateChange();
    });

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
