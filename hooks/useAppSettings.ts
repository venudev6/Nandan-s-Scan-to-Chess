/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState } from 'react';
import { soundManager } from '../lib/SoundManager';

/**
 * A custom hook to manage and persist global user settings.
 * This centralizes the logic for handling settings like theme, sound, and cooldown,
 * and abstracts away the interaction with localStorage.
 */
export const useAppSettings = () => {
    const [analysisCooldown, setAnalysisCooldown] = useState(() => {
        const savedCooldown = localStorage.getItem('analysisCooldown');
        return savedCooldown ? parseInt(savedCooldown, 10) : 600; // Default 10 minutes
    });

    const [soundEnabled, setSoundEnabled] = useState(() => {
        const savedSound = localStorage.getItem('soundEnabled');
        return savedSound !== 'false';
    });

    const [boardTheme, setBoardTheme] = useState(() => {
        return localStorage.getItem('boardTheme') || 'default';
    });

    const handleCooldownChange = (seconds: number) => {
        setAnalysisCooldown(seconds);
        localStorage.setItem('analysisCooldown', String(seconds));
    };

    const handleSoundToggle = (enabled: boolean) => {
        soundManager.setEnabled(enabled);
        setSoundEnabled(enabled);
    };

    const handleBoardThemeChange = (theme: string) => {
        setBoardTheme(theme);
        localStorage.setItem('boardTheme', theme);
    };

    return {
        analysisCooldown,
        boardTheme,
        soundEnabled,
        handleCooldownChange,
        handleBoardThemeChange,
        handleSoundToggle,
    };
};
