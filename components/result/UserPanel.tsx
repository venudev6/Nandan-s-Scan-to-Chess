/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { UserCircleIcon, LogoutIcon, AccountIcon, BookmarkFilledIcon, HistoryIcon } from '../ui/Icons';
import type { User } from '../../lib/types';
import './UserPanel.css';

interface UserPanelProps {
    user: User;
    onLogout: () => void;
    onAdminPanelClick: () => void;
    onSavedGamesClick: () => void;
    onHistoryClick: () => void;
}

const UserPanel = ({ user, onLogout, onAdminPanelClick, onSavedGamesClick, onHistoryClick }: UserPanelProps) => (
    <aside className="user-panel">
        <div className="user-panel-header">
            <UserCircleIcon />
            <div className="user-info">
                <span className="user-email" title={user.email}>{user.email}</span>
                <span className={`role-badge role-${user.role}`}>{user.role}</span>
            </div>
        </div>
        <nav className="user-panel-nav">
            {user.role === 'admin' && (
                <button className="user-menu-item" onClick={onAdminPanelClick} title="Go to the Admin Panel">
                    <AccountIcon /><span>Admin Panel</span>
                </button>
            )}
            <button className="user-menu-item" onClick={onSavedGamesClick} title="View your saved games">
                <BookmarkFilledIcon /><span>Saved Games</span>
            </button>
            <button className="user-menu-item" onClick={onHistoryClick} title="View your game history">
                <HistoryIcon /><span>Game History</span>
            </button>
        </nav>
        <div className="user-panel-footer">
            <button className="btn btn-secondary logout-btn" onClick={onLogout} title="Log out">
                <LogoutIcon /> <span>Logout</span>
            </button>
        </div>
    </aside>
);

export default UserPanel;
