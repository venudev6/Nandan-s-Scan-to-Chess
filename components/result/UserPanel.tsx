/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect } from 'react';
import { UserCircleIcon, LogoutIcon, AccountIcon, BookmarkIcon, HistoryIcon, SettingsIcon, ChevronRightIcon, BoardIcon, GameplayIcon, ExternalLinkIcon } from '../ui/Icons';
import type { User, AnalysisDetails } from '../../lib/types';
import { useAppSettings } from '../../hooks/useAppSettings';
import { PieceSetSelectorModal } from '../ui/PieceSetSelectorModal';
import './UserPanel.css';

type AppSettings = ReturnType<typeof useAppSettings>;

interface UserPanelProps {
    user: User | null;
    isLoggedIn: boolean;
    onLogout: () => void;
    onAdminPanelClick: () => void;
    onSavedGamesClick: () => void;
    onHistoryClick: () => void;
    onProfileClick: () => void;
    onLoginClick: () => void;
    appSettings: AppSettings;
    scanDuration: number | null;
    analysisDetails: AnalysisDetails | null;
}

const UserPanel = ({ user, isLoggedIn, onLogout, onAdminPanelClick, onSavedGamesClick, onHistoryClick, onProfileClick, onLoginClick, appSettings, scanDuration, analysisDetails }: UserPanelProps) => {
    const [showSettings, setShowSettings] = useState(false);
    const [isPieceSetModalOpen, setIsPieceSetModalOpen] = useState(false);

    const getConfidenceClass = (confidence: number | null) => {
        if (confidence === null || confidence === undefined) return '';
        if (confidence >= 0.95) return 'accuracy-high';
        if (confidence >= 0.85) return 'accuracy-medium';
        return 'accuracy-low';
    };

    if (!isLoggedIn || !user) {
        return (
            <aside className="user-panel guest-panel">
                <div className="user-panel-header">
                    <UserCircleIcon />
                    <div className="user-info">
                        <span className="user-email">Guest User</span>
                        <span className="role-badge role-guest">Trial</span>
                    </div>
                </div>
                <div className="guest-panel-content">
                    <p>Log in or sign up to save games and access your full history.</p>
                    <button className="btn btn-primary" onClick={onLoginClick}>
                        Login / Sign Up
                    </button>
                </div>
            </aside>
        );
    }

    return (
        <aside className="user-panel">
            <PieceSetSelectorModal isOpen={isPieceSetModalOpen} onClose={() => setIsPieceSetModalOpen(false)} appSettings={appSettings} />
            <button className="user-panel-header" onClick={onProfileClick} title="View your profile">
                <UserCircleIcon />
                <div className="user-info">
                    <span className="user-email" title={user.name || user.email}>{user.name || user.email}</span>
                    <span className={`role-badge role-${user.role}`}>{user.role}</span>
                </div>
            </button>
            {(scanDuration !== null || (analysisDetails && analysisDetails.confidence !== null)) && (
                <div className="scan-stats-container">
                    {scanDuration !== null && (
                        <div className="scan-stat">
                            <span>Scan Time</span>
                            <strong>{scanDuration.toFixed(1)}s</strong>
                        </div>
                    )}
                    {analysisDetails && analysisDetails.confidence !== null && (
                         <div className="scan-stat">
                            <span>Scan Accuracy</span>
                            <strong className={getConfidenceClass(analysisDetails.confidence)}>
                                {(analysisDetails.confidence * 100).toFixed(1)}%
                            </strong>
                        </div>
                    )}
                </div>
            )}
            <nav className="user-panel-nav">
                {user.role === 'admin' && (
                    <button className="user-menu-item" onClick={onAdminPanelClick} title="Go to the Admin Panel">
                        <AccountIcon /><span>Admin Panel</span>
                    </button>
                )}
                <button className="user-menu-item" onClick={onSavedGamesClick} title="View your saved games">
                    <BookmarkIcon /><span>Saved Games</span>
                </button>
                <button className="user-menu-item" onClick={onHistoryClick} title="View your game history">
                    <HistoryIcon /><span>Game History</span>
                </button>

                <button className="user-menu-item" onClick={() => setShowSettings(!showSettings)}>
                    <SettingsIcon />
                    <span>Board Settings</span>
                    <ChevronRightIcon style={{ transform: showSettings ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                </button>
                
                {showSettings && (
                    <div className="user-panel-settings">
                        <div className="setting-item">
                            <div className="setting-label">
                                <BoardIcon />
                                <span>Board Theme</span>
                            </div>
                            <div className="theme-selector-group">
                                {(['default', 'green', 'blue', 'wood'] as const).map(theme => (
                                    <div className="theme-option" key={theme}>
                                        <input
                                            type="radio"
                                            id={`theme-panel-${theme}`}
                                            name="board-theme-panel"
                                            value={theme}
                                            checked={appSettings.boardTheme === theme}
                                            onChange={() => appSettings.handleBoardThemeChange(theme)}
                                        />
                                        <label htmlFor={`theme-panel-${theme}`} title={`Set board theme to ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}>
                                            <div className={`theme-preview theme-preview-${theme}`}></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="setting-item">
                           <button className="setting-item-button" onClick={() => setIsPieceSetModalOpen(true)}>
                                <div className="setting-label">
                                    <GameplayIcon />
                                    <span>Piece Set</span>
                                </div>
                                <div className="setting-value">
                                    <span>{appSettings.pieceTheme.charAt(0).toUpperCase() + appSettings.pieceTheme.slice(1)}</span>
                                    <ChevronRightIcon />
                                </div>
                           </button>
                        </div>
                        <div className="setting-item">
                             <div className="setting-label">
                                <ExternalLinkIcon />
                                <span>External Analysis</span>
                            </div>
                            <div className="setting-sub-item">
                                <label htmlFor="cooldown-slider-panel">
                                   Cooldown: <strong>{Math.floor(appSettings.analysisCooldown / 60)} min</strong>
                                </label>
                                 <input
                                    type="range"
                                    id="cooldown-slider-panel"
                                    min="0"
                                    max="1800"
                                    step="60"
                                    value={appSettings.analysisCooldown}
                                    onChange={(e) => appSettings.handleCooldownChange(parseInt(e.target.value, 10))}
                                    aria-label="Analysis button cooldown time"
                                    title="Set the cooldown time for external analysis links"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="logout-wrapper">
                    <button className="user-menu-item" onClick={onLogout} title="Log out">
                        <LogoutIcon /> <span>Logout</span>
                    </button>
                </div>
            </nav>
        </aside>
    );
};

export default UserPanel;