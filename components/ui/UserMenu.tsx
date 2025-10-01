/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect } from 'react';
import { 
    UserCircleIcon, LogoutIcon, SettingsIcon, BoardIcon, GameplayIcon, 
    AccountIcon, ChevronRightIcon, HistoryIcon, BookmarkIcon, BackIcon, ExternalLinkIcon
} from './Icons';
import type { User } from '../../lib/types';
import { useAppSettings } from '../../hooks/useAppSettings';
import { PIECE_SETS, PIECE_SET_NAMES, PieceTheme } from '../../lib/chessConstants';
import { PieceSetSelectorModal } from './PieceSetSelectorModal';
import './UserMenu.css';

type AppSettings = ReturnType<typeof useAppSettings>;

interface UserMenuProps {
    user: User;
    onLogout: () => void;
    onAdminPanelClick: () => void;
    onSavedGamesClick: () => void;
    onHistoryClick: () => void;
    onProfileClick: () => void;
    appSettings: AppSettings;
}

const UserMenu = ({ user, onLogout, onAdminPanelClick, onSavedGamesClick, onHistoryClick, onProfileClick, appSettings }: UserMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [panel, setPanel] = useState<'main' | 'settings'>('main');
    const [isPieceSetModalOpen, setIsPieceSetModalOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMenuToggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setPanel('main'); // Reset to main panel when opening
        }
    };
    
    const handleLogoutClick = () => {
        onLogout();
        setIsOpen(false);
    };

    const handleProfileClick = () => {
        onProfileClick();
        setIsOpen(false);
    };

    const MainPanel = () => (
        <>
            <button className="user-menu-header" onClick={handleProfileClick} title="View your profile">
                <div className="user-avatar"><UserCircleIcon /></div>
                <div className="user-info">
                    <span className="user-name">{user.name || user.email}</span>
                    <span className={`role-badge role-${user.role}`}>{user.role}</span>
                </div>
            </button>
            <div className="user-menu-separator"></div>
            <div className="user-menu-list">
                <button className="user-menu-item" onClick={() => { onSavedGamesClick(); setIsOpen(false); }} title="View your saved games">
                    <BookmarkIcon/>
                    <span>Saved Games</span>
                </button>
                <button className="user-menu-item" onClick={() => { onHistoryClick(); setIsOpen(false); }} title="View your game history">
                    <HistoryIcon/>
                    <span>Game History</span>
                </button>
                <button className="user-menu-item" onClick={() => setPanel('settings')} title="Open settings">
                    <SettingsIcon />
                    <span>Board Settings</span>
                    <ChevronRightIcon />
                </button>
                 {user.role === 'admin' && (
                    <button className="user-menu-item" onClick={() => { onAdminPanelClick(); setIsOpen(false); }} title="Go to the Admin Panel">
                        <AccountIcon/>
                        <span>Admin Panel</span>
                    </button>
                )}
                <div className="user-menu-separator"></div>
                 <button className="user-menu-item" onClick={handleLogoutClick} title="Log out">
                    <LogoutIcon />
                    <span>Logout</span>
                </button>
            </div>
        </>
    );

    const SettingsPanel = () => (
        <>
             <div className="user-menu-header settings-header">
                 <button className="back-button" onClick={() => setPanel('main')} title="Back to main menu">
                    <BackIcon />
                </button>
                <h3>Board Settings</h3>
            </div>
            <div className="user-menu-list settings-list">
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
                                    id={`theme-${theme}`}
                                    name="board-theme"
                                    value={theme}
                                    checked={appSettings.boardTheme === theme}
                                    onChange={() => appSettings.handleBoardThemeChange(theme)}
                                />
                                <label htmlFor={`theme-${theme}`} title={`Set board theme to ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}>
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
                        <label htmlFor="cooldown-slider">
                           Cooldown: <strong>{Math.floor(appSettings.analysisCooldown / 60)} min</strong>
                        </label>
                         <input
                            type="range"
                            id="cooldown-slider"
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
        </>
    );

    return (
        <div className="user-menu-container" ref={menuRef}>
            <button className="user-menu-button" onClick={handleMenuToggle} aria-haspopup="true" aria-expanded={isOpen} title="Open user menu">
                <UserCircleIcon />
            </button>
            {isOpen && (
                <div className="user-menu-dropdown">
                    {panel === 'main' ? <MainPanel /> : <SettingsPanel />}
                </div>
            )}
            <PieceSetSelectorModal
                isOpen={isPieceSetModalOpen}
                onClose={() => setIsPieceSetModalOpen(false)}
                appSettings={appSettings}
            />
        </div>
    );
};

export default UserMenu;