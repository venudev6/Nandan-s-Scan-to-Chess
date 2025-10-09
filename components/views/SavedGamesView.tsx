/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../../lib/db';
import type { StoredGame } from '../../lib/types';
import { BackIcon, BookmarkFilledIcon, TrashIcon, ChevronRightIcon } from '../ui/Icons';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import './SavedGamesView.css';

interface SavedGamesViewProps {
    onGameSelect: (id: number) => void;
    onBack: () => void;
}

const SavedGamesView = ({ onGameSelect, onBack }: SavedGamesViewProps) => {
    const [allGames, setAllGames] = useState<StoredGame[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [gameToDelete, setGameToDelete] = useState<StoredGame | null>(null);
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

    const loadGames = useCallback(async () => {
        setIsLoading(true);
        try {
            await db.init();
            const games = await db.getAllGames();
            setAllGames(games);
        } catch (e) {
            console.error("Failed to load saved games:", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadGames();
    }, [loadGames]);

    const foldersWithCounts = useMemo(() => {
        const counts = new Map<string, number>();
        allGames.forEach(game => {
            counts.set(game.folder, (counts.get(game.folder) || 0) + 1);
        });
        return new Map([...counts.entries()].sort());
    }, [allGames]);

    const gamesInSelectedFolder = useMemo(() => {
        if (!selectedFolder) return [];
        return allGames.filter(game => game.folder === selectedFolder);
    }, [allGames, selectedFolder]);

    const handleDeleteClick = (e: React.MouseEvent, game: StoredGame) => {
        e.stopPropagation();
        setGameToDelete(game);
    };

    const confirmDeleteGame = async () => {
        if (gameToDelete) {
            await db.deleteGame(gameToDelete.id);
            setGameToDelete(null);
            await loadGames();
        }
    };
    
    const handleBackClick = () => {
        if (selectedFolder) {
            setSelectedFolder(null);
        } else {
            onBack();
        }
    };

    const renderFolderList = () => (
        <ul className="folder-list">
            {Array.from(foldersWithCounts.entries()).map(([folder, count]) => (
                <li key={folder} className="folder-item" onClick={() => setSelectedFolder(folder)}>
                    <BookmarkFilledIcon className="folder-icon" />
                    <div className="folder-info">
                        <div className="folder-name">{folder}</div>
                        <div className="game-count">{count} {count === 1 ? 'game' : 'games'}</div>
                    </div>
                    <ChevronRightIcon className="chevron-icon" />
                </li>
            ))}
        </ul>
    );

    const renderGameList = () => (
        <ul className="stored-files-list">
            {gamesInSelectedFolder.map(game => (
                <li key={game.id} onClick={() => onGameSelect(game.id)} title={game.name}>
                    <div className="pdf-thumbnail-preview">
                        <img src={game.thumbnail} alt="Chess position thumbnail" />
                    </div>
                    <div className="pdf-info">
                        <span>{game.name}</span>
                        <button onClick={(e) => handleDeleteClick(e, game)} aria-label={`Delete ${game.name}`} title="Delete this saved game"><TrashIcon /></button>
                    </div>
                </li>
            ))}
        </ul>
    );

    const renderContent = () => {
        if (isLoading) {
            return <div className="loading-container"><div className="spinner"></div></div>;
        }

        if (allGames.length === 0) {
            return (
                <div className="empty-state">
                   <BookmarkFilledIcon />
                   <p>No Saved Games</p>
                   <span>Click the bookmark icon on the analysis screen to save a game for later.</span>
                </div>
            );
        }

        return selectedFolder ? renderGameList() : renderFolderList();
    };

    return (
        <div className="card admin-panel">
            <div className="admin-header">
                <div className="folder-header">
                    <button className="btn btn-secondary" onClick={handleBackClick} title="Go back" aria-label="Go back">
                        <BackIcon /> Back
                    </button>
                    <h1>{selectedFolder ? `Saved Games > ${selectedFolder}` : 'Saved Games'}</h1>
                </div>
            </div>

            <div className="saved-games-view-section">
                {renderContent()}
            </div>
             <ConfirmationDialog
                isOpen={!!gameToDelete}
                title="Delete Saved Game"
                message={`Are you sure you want to permanently delete "${gameToDelete?.name}"? This action cannot be undone.`}
                onConfirm={confirmDeleteGame}
                onClose={() => setGameToDelete(null)}
            />
        </div>
    );
};

export default SavedGamesView;