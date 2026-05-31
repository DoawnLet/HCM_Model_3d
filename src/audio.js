// Silent Audio System Stub
// The user will implement audio assets and logic later.
export function createAudioSystem() {
    let enabled = false;

    function playTone(freq, duration, type = 'sine', volume = 0.15) {
        // Silent stub
    }

    function playSuccessSound() {
        // Silent stub
    }

    function playFailureSound() {
        // Silent stub
    }

    function playClickSound() {
        // Silent stub
    }

    function startBackgroundMusic() {
        // Silent stub
    }

    function stopBackgroundMusic() {
        // Silent stub
    }

    function setEnabled(nextEnabled) {
        enabled = nextEnabled;
    }

    async function resume() {
        // Silent stub
    }

    return {
        playTone,
        playSuccessSound,
        playFailureSound,
        playClickSound,
        startBackgroundMusic,
        stopBackgroundMusic,
        setEnabled,
        resume,
        get enabled() {
            return enabled;
        }
    };
}
