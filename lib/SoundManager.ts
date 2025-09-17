/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// --- Sound Asset Data ---
// Sound assets are provided as placeholders. The user can replace the empty
// strings with base64 encoded data URLs to enable sounds.
// The SoundManager will safely skip any empty sources.
const sounds = {
    MOVE: '',
    CAPTURE: '',
    CHECKMATE: '',
    UI_CLICK: ''
};

type SoundName = keyof typeof sounds;

/**
 * A manager class for handling all audio playback in the application.
 * It uses the Web Audio API for low-latency sound playback and manages
 * loading, decoding, and enabling/disabling of sounds.
 */
class SoundManager {
    private audioContext: AudioContext | null = null;
    private soundBuffers: { [key in SoundName]?: AudioBuffer } = {};
    private isEnabled: boolean;
    private isInitialized = false;

    constructor() {
        // Retrieve the sound setting from localStorage, defaulting to true.
        const savedSoundSetting = localStorage.getItem('soundEnabled');
        this.isEnabled = savedSoundSetting !== 'false';
    }

    /**
     * Initializes the AudioContext. This must be called in response to a user
     * interaction (e.g., a click) to comply with browser autoplay policies.
     */
    public init() {
        if (this.isInitialized || typeof window === 'undefined') {
            return;
        }
        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.loadAllSounds();
            this.isInitialized = true;
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.", e);
        }
    }
    
    /**
     * Toggles sound on or off and saves the preference to localStorage.
     * @param enabled - True to enable sound, false to disable.
     */
    public setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
        localStorage.setItem('soundEnabled', String(enabled));
    }

    /**
     * Decodes all sound data URLs into AudioBuffers for playback.
     */
    private async loadAllSounds() {
        if (!this.audioContext) return;
        for (const key in sounds) {
            const soundName = key as SoundName;
            const dataUrl = sounds[soundName];
            if (dataUrl) {
                try {
                    const response = await fetch(dataUrl);
                    const arrayBuffer = await response.arrayBuffer();
                    this.audioContext.decodeAudioData(arrayBuffer, (buffer) => {
                        this.soundBuffers[soundName] = buffer;
                    }, (error) => {
                        console.error(`Error decoding audio data for ${soundName}:`, error);
                    });
                } catch (e) {
                    console.error(`Failed to load sound ${soundName}:`, e);
                }
            }
        }
    }

    /**
     * Plays a sound if sound is enabled and the buffer is loaded.
     * @param soundName - The name of the sound to play.
     */
    public play(soundName: SoundName) {
        if (!this.isEnabled || !this.audioContext || !this.isInitialized) {
            return;
        }
        
        const buffer = this.soundBuffers[soundName];
        if (buffer) {
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(this.audioContext.destination);
            source.start(0);
        }
    }
}

// Export a singleton instance of the SoundManager.
export const soundManager = new SoundManager();
