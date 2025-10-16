/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// --- Sound Asset Data ---
// Sound assets are provided as placeholders. The user can replace the empty
// strings with base64 encoded data URLs to enable sounds.
// The SoundManager will safely skip any empty sources.
const sounds = {
    MOVE: 'data:audio/mpeg;base64,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',
    CAPTURE: 'data:audio/mpeg;base64,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',
    UI_CLICK: '',
    ERROR: 'data:audio/mpeg;base64,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',
    // FIX: Add CHECKMATE sound, reusing the CAPTURE sound for an emphatic effect.
    CHECKMATE: 'data:audio/mpeg;base64,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VVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxIMAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NAxKQAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80LEowAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80DEpAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsSjAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxKMAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NAxKQAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80LEowAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80DEpAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsSjAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxKMAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NAxKQAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80LEowAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80DEpAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxKMAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
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