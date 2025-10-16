/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState } from 'react';
import { soundManager } from '../lib/SoundManager';
import { PieceTheme, PIECE_SET_NAMES } from '../lib/chessConstants';

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

    const [pieceTheme, setPieceTheme] = useState<PieceTheme>(() => {
        const savedTheme = localStorage.getItem('pieceTheme');
        if (savedTheme && PIECE_SET_NAMES.includes(savedTheme)) {
            return savedTheme as PieceTheme;
        }
        return 'staunty';
    });

    const [cooldownLocked, setCooldownLocked] = useState(() => {
        return localStorage.getItem('cooldownLocked') === 'true';
    });

    const [fenCopyLocked, setFenCopyLocked] = useState(() => {
        return localStorage.getItem('fenCopyLocked') === 'true';
    });

    const [engineEnabled, setEngineEnabled] = useState(() => {
        const saved = localStorage.getItem('engineEnabled');
        return saved !== 'false'; // Default to true
    });

    const [engineDifficulty, setEngineDifficulty] = useState<'standard' | 'hard' | 'extra-hard'>(() => {
        const saved = localStorage.getItem('engineDifficulty') as 'standard' | 'hard' | 'extra-hard' | null;
        if (saved && ['standard', 'hard', 'extra-hard'].includes(saved)) {
            return saved;
        }
        return 'standard'; // Default to standard
    });

    const handleCooldownChange = (seconds: number) => {
        if (cooldownLocked) return;
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

    const handlePieceThemeChange = (theme: PieceTheme) => {
        setPieceTheme(theme);
        localStorage.setItem('pieceTheme', theme);
    };
    
    const handleSetCooldownLocked = (isLocked: boolean) => {
        setCooldownLocked(isLocked);
        localStorage.setItem('cooldownLocked', String(isLocked));
    };

    const handleSetFenCopyLocked = (isLocked: boolean) => {
        setFenCopyLocked(isLocked);
        localStorage.setItem('fenCopyLocked', String(isLocked));
    };

    const handleEngineEnabledChange = (enabled: boolean) => {
        setEngineEnabled(enabled);
        localStorage.setItem('engineEnabled', String(enabled));
    };

    const handleEngineDifficultyChange = (difficulty: 'standard' | 'hard' | 'extra-hard') => {
        setEngineDifficulty(difficulty);
        localStorage.setItem('engineDifficulty', difficulty);
    };


    return {
        analysisCooldown,
        boardTheme,
        soundEnabled,
        pieceTheme,
        cooldownLocked,
        fenCopyLocked,
        engineEnabled,
        engineDifficulty,
        handleCooldownChange,
        handleBoardThemeChange,
        handleSoundToggle,
        handlePieceThemeChange,
        handleSetCooldownLocked,
        handleSetFenCopyLocked,
        handleEngineEnabledChange,
        handleEngineDifficultyChange,
    };
};