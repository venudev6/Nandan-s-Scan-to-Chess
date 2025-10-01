/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { PIECE_SETS, PIECE_SET_NAMES, PieceTheme } from '../../lib/chessConstants';
import type { PieceSymbol } from '../../lib/types';
import { useAppSettings } from '../../hooks/useAppSettings';
import './PieceSetSelectorModal.css';

interface PieceSetSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    appSettings: ReturnType<typeof useAppSettings>;
}

export const PieceSetSelectorModal = ({ isOpen, onClose, appSettings }: PieceSetSelectorModalProps) => {
    const [selectedTheme, setSelectedTheme] = useState<PieceTheme>(appSettings.pieceTheme);

    if (!isOpen) return null;

    const handleSave = () => {
        appSettings.handlePieceThemeChange(selectedTheme);
        onClose();
    };

    const themeName = (theme: string) => theme.charAt(0).toUpperCase() + theme.slice(1);
    
    const pieceOrder: PieceSymbol[] = ['k', 'q', 'r', 'b', 'n', 'p'];
    const pieceSet = PIECE_SETS[selectedTheme];

    return createPortal(
        <div className="piece-set-modal-overlay" onClick={onClose}>
            <div className="piece-set-modal-content" onClick={(e) => e.stopPropagation()}>
                <header className="piece-set-modal-header">
                    <h2>Select Piece Set</h2>
                </header>
                <main className="piece-set-modal-body">
                    <div className="theme-selector-grid">
                        {PIECE_SET_NAMES.map(themeStr => {
                            const theme = themeStr as PieceTheme;
                            const KnightComponent = PIECE_SETS[theme].w.n;
                            const isSelected = selectedTheme === theme;
                            return (
                                <button
                                    key={theme}
                                    className={`theme-selector-grid-item ${isSelected ? 'selected' : ''}`}
                                    onClick={() => setSelectedTheme(theme)}
                                    title={`Select ${themeName(theme)}`}
                                >
                                    <div className="theme-selector-grid-knight"><KnightComponent /></div>
                                    <span className="theme-selector-grid-name">{themeName(theme)}</span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="piece-preview-grid">
                        {pieceOrder.map(pieceType => {
                            const PieceComponent = pieceSet.w[pieceType];
                            return <div className="piece-preview-grid-item" key={`w-${pieceType}`}><PieceComponent /></div>;
                        })}
                        {pieceOrder.map(pieceType => {
                            const PieceComponent = pieceSet.b[pieceType];
                            return <div className="piece-preview-grid-item" key={`b-${pieceType}`}><PieceComponent /></div>;
                        })}
                    </div>
                </main>
                <footer className="piece-set-modal-actions">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSave}>OK</button>
                </footer>
            </div>
        </div>,
        document.body
    );
};