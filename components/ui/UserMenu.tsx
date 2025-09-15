/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect } from 'react';
import { 
    UserCircleIcon, LogoutIcon, SettingsIcon, BoardIcon, GameplayIcon, 
    AccountIcon, ChevronRightIcon, HistoryIcon, BookmarkFilledIcon, BackIcon
} from './Icons';
import type { User } from '../../lib/types';
import { useAppSettings } from '../../hooks/useAppSettings';
import './UserMenu.css';

type AppSettings = ReturnType<typeof useAppSettings>;

interface UserMenuProps {
    user: User;
    onLogout: () => void;
    onAdminPanelClick: () => void;
    onSavedGamesClick: () => void;
    onHistoryClick: () => void;
    appSettings: AppSettings;
}

const UserMenu = ({ user, onLogout, onAdminPanelClick, onSavedGamesClick, onHistoryClick, appSettings }: UserMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [panel, setPanel] = useState<'main' | 'settings'>('main');
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
        setPanel('main'); // Reset to main panel when opening
    };
    
    const handleLogoutClick = () => {
        onLogout();
        setIsOpen(false);
    };

    const MainPanel = () => (
        <>
            <div className="user-menu-header">
                <div className="user-info">
                    <span className="user-email">{user.email}</span>
                    <span className={`role-badge role-${user.role}`}>{user.role}</span>
                </div>
            </div>
            <div className="user-menu-list">
                 {user.role === 'admin' && (
                    <button className="user-menu-item" onClick={() => { onAdminPanelClick(); setIsOpen(false); }} title="Go to the Admin Panel">
                        <AccountIcon/>
                        <span>Admin Panel</span>
                    </button>
                )}
                <button className="user-menu-item" onClick={() => { onSavedGamesClick(); setIsOpen(false); }} title="View your saved games">
                    <BookmarkFilledIcon/>
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
                    <div className="setting-label">
                        <GameplayIcon />
                        <span>Gameplay</span>
                    </div>
                    <div className="setting-sub-item">
                        <label htmlFor="sound-toggle">Enable Sound Effects</label>
                        <div className="toggle-switch" title="Enable or disable sound effects">
                            <input
                                type="checkbox"
                                id="sound-toggle"
                                checked={appSettings.soundEnabled}
                                onChange={(e) => appSettings.handleSoundToggle(e.target.checked)}
                            />
                            <span className="slider round"></span>
                        </div>
                    </div>
                    <div className="setting-sub-item">
                        <label htmlFor="cooldown-slider">
                           Analysis Cooldown: <strong>{Math.floor(appSettings.analysisCooldown / 60)} min</strong>
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
        </div>
    );
};

export default UserMenu;
