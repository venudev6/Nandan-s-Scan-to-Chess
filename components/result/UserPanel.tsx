/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect } from 'react';
import { UserCircleIcon, LogoutIcon, AccountIcon, BookmarkIcon, HistoryIcon, SettingsIcon, ChevronRightIcon, BoardIcon, GameplayIcon, ExternalLinkIcon, LockIcon, CheckIcon, WarningIcon, RobotIcon, HumanIcon, AdviceIcon } from '../ui/Icons';
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
    debugLog?: string[];
    bestMove?: string | null;
    displayMode: 'full' | 'compact';
    isEngineReady?: boolean;
    isThinking?: boolean;
    playerSide?: 'w' | 'b' | null;
    turn?: 'w' | 'b';
}

const UserPanel = ({ user, isLoggedIn, onLogout, onAdminPanelClick, onSavedGamesClick, onHistoryClick, onProfileClick, onLoginClick, appSettings, scanDuration, analysisDetails, debugLog, bestMove, displayMode, isEngineReady, isThinking, playerSide, turn }: UserPanelProps) => {
    const [showSettings, setShowSettings] = useState(false);
    const [showEngineSettings, setShowEngineSettings] = useState(false);
    const [showAnalysisDetails, setShowAnalysisDetails] = useState(false);
    const [isPieceSetModalOpen, setIsPieceSetModalOpen] = useState(false);
    const debugLogRef = useRef<HTMLDivElement>(null);

    // Effect to auto-scroll the debug log
    useEffect(() => {
        if (debugLogRef.current) {
            debugLogRef.current.scrollTop = debugLogRef.current.scrollHeight;
        }
    }, [debugLog, showAnalysisDetails]);

    const getConfidenceClass = (confidence: number | null) => {
        if (confidence === null || confidence === undefined) return '';
        if (confidence >= 0.95) return 'accuracy-high';
        if (confidence >= 0.85) return 'accuracy-medium';
        return 'accuracy-low';
    };
    
    const timingStages: { key: keyof NonNullable<AnalysisDetails['timingSummary']>, name: string }[] = [
        { key: 'image_hashing_ms', name: 'Image Hashing' },
        { key: 'board_detection_ms', name: 'Board Detection' },
        { key: 'perspective_warp_ms', name: 'Perspective Warp' },
        { key: 'tile_slicing_ms', name: 'Tile Slicing' },
        { key: 'gemini_classification_ms', name: 'Gemini Classification' },
        { key: 'post_processing_ms', name: 'Post-Processing' },
    ];


    if (!isLoggedIn || !user) {
        return (
            <aside className="user-panel guest-panel">
                <div className="user-panel-header">
                    <div className="user-avatar"><UserCircleIcon /></div>
                    <div className="user-info">
                        <span className="user-email">Guest User</span>
                        <span className={`role-badge role-guest`}>Trial</span>
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
                <div className="user-avatar">
                    {user.photoUrl ? <img src={user.photoUrl} alt="User avatar" /> : <UserCircleIcon />}
                </div>
                <div className="user-info">
                    <span className="user-email" title={user.name || user.email}>{user.name || user.email}</span>
                    <span className={`role-badge role-${user.role}`}>{user.role}</span>
                </div>
            </button>
            
            {displayMode === 'full' && (
                <>
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
                                    <span>Avg. Accuracy</span>
                                    <strong className={getConfidenceClass(analysisDetails.confidence)}>
                                        {(analysisDetails.confidence * 100).toFixed(1)}%
                                    </strong>
                                </div>
                            )}
                            {analysisDetails?.postProcess?.minimumConfidence !== null && analysisDetails?.postProcess?.minimumConfidence !== undefined && (
                                <div className="scan-stat">
                                    <span>Min. Accuracy</span>
                                    <strong className={getConfidenceClass(analysisDetails.postProcess.minimumConfidence)}>
                                        {(analysisDetails.postProcess.minimumConfidence * 100).toFixed(1)}%
                                    </strong>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {analysisDetails?.timingSummary && (
                        <div className="scan-timing-details">
                            <h4>Scan Breakdown</h4>
                            <ul>
                                {timingStages.map(stage => {
                                    const duration = analysisDetails.timingSummary![stage.key];
                                    return duration !== undefined && duration > 0 && (
                                        <li key={stage.key}>
                                            <span>{stage.name}</span>
                                            <strong>{(duration / 1000).toFixed(2)}s</strong>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {analysisDetails && (analysisDetails.tokenUsage || analysisDetails.geminiScans) && (
                        <div className="scan-timing-details gemini-details">
                            <h4>Gemini Classification</h4>
                            <ul>
                                {analysisDetails.tokenUsage && (
                                    <li>
                                        <span>Token Usage</span>
                                        <strong>~{analysisDetails.tokenUsage.totalTokens.toLocaleString()} tokens</strong>
                                    </li>
                                )}
                                {analysisDetails.costEstimateINR !== undefined && (
                                    <li>
                                        <span>Est. Cost</span>
                                        <strong>₹{analysisDetails.costEstimateINR.toFixed(2)}</strong>
                                    </li>
                                )}
                            </ul>

                            {analysisDetails.geminiScans && analysisDetails.geminiScans.filter(s => s.piece !== 'empty').length > 0 && (
                                <div className="individual-scans">
                                    <h5>Individual Scans</h5>
                                    <div className="scans-grid">
                                        {analysisDetails.geminiScans
                                            .filter(scan => scan.piece !== 'empty')
                                            .sort((a, b) => {
                                                const rankA = a.square[1];
                                                const fileA = a.square[0];
                                                const rankB = b.square[1];
                                                const fileB = b.square[0];
                                                if (rankA !== rankB) {
                                                    return rankB.localeCompare(rankA); // Sort by rank descending (8 -> 1)
                                                }
                                                return fileA.localeCompare(fileB); // Then by file ascending (a -> h)
                                            })
                                            .map(scan => (
                                                <div key={scan.square} className="scan-item">
                                                    <span className="scan-square">{scan.square}:</span>
                                                    <span className="scan-piece">{scan.piece}</span>
                                                    <span className="scan-confidence">({(scan.confidence * 100).toFixed(0)}%)</span>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {analysisDetails?.postProcess?.autoFixes && analysisDetails.postProcess.autoFixes.length > 0 && (
                        <div className="post-scan-validations">
                            <h4>Post-Scan Validations ({analysisDetails.postProcess.autoFixes.length})</h4>
                            <ul>
                                {analysisDetails.postProcess.autoFixes.map((fix, index) => (
                                    <li key={index} className={fix.type}>
                                        {fix.type === 'fix' ? <CheckIcon /> : <WarningIcon />}
                                        {fix.message}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </>
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
                                   {appSettings.cooldownLocked && <LockIcon />}
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
                                    title={appSettings.cooldownLocked ? "Unlock in Profile settings to change" : "Set the cooldown time for external analysis links"}
                                    disabled={appSettings.cooldownLocked}
                                />
                            </div>
                        </div>
                    </div>
                )}
                 {debugLog && (
                    <>
                        <button className="user-menu-item" onClick={() => setShowEngineSettings(!showEngineSettings)}>
                            <RobotIcon/>
                            <span>Engine Settings</span>
                            <ChevronRightIcon style={{ transform: showEngineSettings ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                        </button>
                        {showEngineSettings && (
                             <div className="user-panel-settings">
                                <div className="engine-setting-item">
                                    <label htmlFor="engine-enabled-toggle">Play vs. Engine</label>
                                    <div className="engine-toggle-switch" title={appSettings.engineEnabled ? 'Disable Engine' : 'Enable Engine'}>
                                        <label className="switch">
                                            <input 
                                                type="checkbox" 
                                                id="engine-enabled-toggle"
                                                checked={appSettings.engineEnabled} 
                                                onChange={(e) => appSettings.handleEngineEnabledChange(e.target.checked)} 
                                            />
                                            <span className="slider round"></span>
                                        </label>
                                    </div>
                                </div>

                                <div className={`engine-setting-item ${!appSettings.engineEnabled ? 'disabled' : ''}`}>
                                    <label htmlFor="engine-difficulty-select">Difficulty</label>
                                    <select 
                                        id="engine-difficulty-select" 
                                        value={appSettings.engineDifficulty} 
                                        onChange={(e) => appSettings.handleEngineDifficultyChange(e.target.value as 'standard' | 'hard' | 'extra-hard')}
                                        disabled={!appSettings.engineEnabled}
                                    >
                                        <option value="standard">Standard</option>
                                        <option value="hard">Hard</option>
                                        <option value="extra-hard">Extra Hard</option>
                                    </select>
                                </div>

                                <div className="engine-status-line">
                                    <strong>Status:</strong>
                                    <span className={`engine-status ${!appSettings.engineEnabled ? 'disabled' : isEngineReady ? 'ready' : 'loading'}`}>
                                        {appSettings.engineEnabled ? (isEngineReady ? 'Ready' : 'Initializing...') : 'Disabled'}
                                    </span>
                                </div>
                                
                                {playerSide && appSettings.engineEnabled && (
                                    <div className={`play-vs-computer-status ${isThinking && turn !== playerSide ? 'thinking' : ''}`}>
                                        {turn === playerSide ? <HumanIcon/> : <RobotIcon />}
                                        <span>
                                            {isThinking && turn !== playerSide ? "Computer is thinking..." :
                                            turn === playerSide ? `Your turn (as ${playerSide === 'w' ? 'White' : 'Black'})` : "Computer's turn..."}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                 )}
                 {(bestMove || (debugLog && debugLog.length > 0)) && (
                    <>
                        <button className="user-menu-item" onClick={() => setShowAnalysisDetails(!showAnalysisDetails)}>
                            <AdviceIcon />
                            <span>Engine Analysis</span>
                            <ChevronRightIcon style={{ transform: showAnalysisDetails ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                        </button>
                        {showAnalysisDetails && (
                            <div className="user-panel-settings">
                                {bestMove && (
                                    <div className="engine-analysis-section">
                                        <div className="best-move-line">
                                            <strong>Best Move:</strong>
                                            <span>{bestMove}</span>
                                        </div>
                                    </div>
                                )}
                                {debugLog && debugLog.length > 0 && (
                                    <div className="engine-debug-log-section">
                                        <h4>Engine Debug Log</h4>
                                        <div className="engine-debug-log" ref={debugLogRef}>
                                            {debugLog.map((line, index) => <div key={index}>{line}</div>)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </nav>
            
            <div className="logout-wrapper">
                <button className="user-menu-item" onClick={onLogout} title="Log out">
                    <LogoutIcon /> <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default UserPanel;