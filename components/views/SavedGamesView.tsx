/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../lib/db';
import type { StoredGame } from '../../lib/types';
import { BackIcon, BookmarkFilledIcon, TrashIcon } from '../ui/Icons';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import './SavedGamesView.css';

interface SavedGamesViewProps {
    onGameSelect: (id: number) => void;
    onBack: () => void;
}

const SavedGamesView = ({ onGameSelect, onBack }: SavedGamesViewProps) => {
    const [savedGames, setSavedGames] = useState<StoredGame[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [gameToDelete, setGameToDelete] = useState<StoredGame | null>(null);

    const loadGames = useCallback(async () => {
        setIsLoading(true);
        try {
            await db.init();
            const games = await db.getAllGames(); // Use getAllGames for bookmarks
            setSavedGames(games);
        } catch (e) {
            console.error("Failed to load saved games:", e);
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
            await db.deleteGame(gameToDelete.id); // Use deleteGame for bookmarks
            setGameToDelete(null);
            await loadGames(); // Reload games after deletion
        }
    };

    return (
        <div className="card admin-panel">
            <div className="admin-header">
                <h1>Saved Games</h1>
                <button className="btn btn-secondary" onClick={onBack} title="Go back to the home screen">
                    <BackIcon /> Back to Home
                </button>
            </div>

            {isLoading ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                </div>
            ) : (
                <div className="saved-games-view-section">
                    {savedGames.length > 0 ? (
                        <ul className="stored-files-list">
                            {savedGames.map(game => (
                                <li key={game.id} onClick={() => onGameSelect(game.id)} title={`Open game from ${new Date(game.date).toLocaleString()}`}>
                                    <div className="pdf-thumbnail-preview">
                                        <img src={game.thumbnail} alt="Chess position thumbnail" />
                                    </div>
                                    <div className="pdf-info">
                                        <span>{new Date(game.date).toLocaleString()}</span>
                                        <button onClick={(e) => handleDeleteClick(e, game)} aria-label="Delete saved game" title="Delete this saved game"><TrashIcon /></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="empty-state">
                           <BookmarkFilledIcon />
                           <p>No Saved Games</p>
                           <span>Click the bookmark icon on the analysis screen to save a game for later.</span>
                        </div>
                    )}
                </div>
            )}
             <ConfirmationDialog
                isOpen={!!gameToDelete}
                title="Delete Saved Game"
                message={`Are you sure you want to permanently delete this game? This action cannot be undone.`}
                onConfirm={confirmDeleteGame}
                onClose={() => setGameToDelete(null)}
            />
        </div>
    );
};

export default SavedGamesView;