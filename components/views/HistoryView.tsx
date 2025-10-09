/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../lib/db';
import type { StoredGame } from '../../lib/types';
import { BackIcon, HistoryIcon, TrashIcon } from '../ui/Icons';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import './HistoryView.css';

interface HistoryViewProps {
    onGameSelect: (id: number) => void;
    onBack: () => void;
}

const HistoryView = ({ onGameSelect, onBack }: HistoryViewProps) => {
    const [storedGames, setStoredGames] = useState<StoredGame[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [gameToDelete, setGameToDelete] = useState<StoredGame | null>(null);

    const loadGames = useCallback(async () => {
        setIsLoading(true);
        try {
            await db.init();
            const games = await db.getAllHistory();
            setStoredGames(games);
        } catch (e) {
            console.error("Failed to load game history:", e);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    useEffect(() => {
        loadGames();
    }, [loadGames]);

    const handleDeleteClick = (e: React.MouseEvent, game: StoredGame) => {
        e.stopPropagation();
        setGameToDelete(game);
    };

    const confirmDeleteGame = async () => {
        if (gameToDelete) {
            await db.deleteHistory(gameToDelete.id);
            setGameToDelete(null);
            await loadGames(); // Reload games after deletion
        }
    };

    return (
        <div className="card admin-panel">
            <div className="admin-header">
                <button className="btn btn-secondary" onClick={onBack} title="Go back" aria-label="Go back">
                    <BackIcon /> Back
                </button>
                <h1>Game History</h1>
            </div>

            {isLoading ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                </div>
            ) : (
                <div className="history-view-section">
                    {storedGames.length > 0 ? (
                        <ul className="stored-files-list">
                            {storedGames.map(game => (
                                <li key={game.id} onClick={() => onGameSelect(game.id)} title={`Open game from ${new Date(game.date).toLocaleString()}`}>
                                    <div className="pdf-thumbnail-preview">
                                        <img src={game.thumbnail} alt="Chess position thumbnail" />
                                    </div>
                                    <div className="pdf-info">
                                        <span>{new Date(game.date).toLocaleString()}</span>
                                        <button onClick={(e) => handleDeleteClick(e, game)} aria-label="Delete game from history" title="Delete this game from history"><TrashIcon /></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="empty-state">
                           <HistoryIcon />
                           <p>No games played yet.</p>
                           <span>Your analyzed games will automatically appear here.</span>
                        </div>
                    )}
                </div>
            )}
             <ConfirmationDialog
                isOpen={!!gameToDelete}
                title="Delete Game History"
                message={`Are you sure you want to permanently delete this game from your history? This action cannot be undone.`}
                onConfirm={confirmDeleteGame}
                onClose={() => setGameToDelete(null)}
            />
        </div>
    );
};

export default HistoryView;