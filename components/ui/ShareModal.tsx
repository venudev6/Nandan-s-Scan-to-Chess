/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Chess } from 'chess.js';
import { CloseIcon, CopyIcon, CheckIcon, DownloadIcon } from './Icons';
import { generateBoardImageSVGString, svgToPngDataUrl } from '../../lib/utils';
import type { BoardState } from '../../lib/types';
import Chessboard from '../Chessboard';
import './ShareModal.css';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    game: Chess;
    boardState: BoardState;
    pieceTheme: string;
}

export const ShareModal = ({ isOpen, onClose, game, boardState, pieceTheme }: ShareModalProps) => {
    const [activeTab, setActiveTab] = useState<'pgn' | 'image'>('pgn');
    const [copied, setCopied] = useState<'fen' | 'pgn' | null>(null);

    if (!isOpen) {
        return null;
    }

    const handleCopy = (type: 'fen' | 'pgn') => {
        const textToCopy = type === 'fen' ? game.fen() : game.pgn();
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(type);
            setTimeout(() => setCopied(null), 2000);
        });
    };
    
    const handleDownload = async () => {
        const svgString = generateBoardImageSVGString(game.fen(), pieceTheme);
        const pngDataUrl = await svgToPngDataUrl(svgString, 512, 512);
        const a = document.createElement('a');
        a.href = pngDataUrl;
        a.download = 'chessboard.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return createPortal(
        <div className="share-modal-overlay" onClick={onClose}>
            <div className="share-modal" onClick={(e) => e.stopPropagation()}>
                <div className="share-modal-header">
                    <h2>Share</h2>
                    <button onClick={onClose} className="close-btn" aria-label="Close share modal"><CloseIcon /></button>
                </div>
                <div className="share-modal-tabs">
                    <button className={activeTab === 'pgn' ? 'active' : ''} onClick={() => setActiveTab('pgn')}>PGN</button>
                    <button className={activeTab === 'image' ? 'active' : ''} onClick={() => setActiveTab('image')}>Image</button>
                </div>
                <div className="share-modal-content">
                    {activeTab === 'pgn' && (
                        <div className="share-pgn-content">
                            <div className="share-form-group">
                                <label htmlFor="fen-share">FEN</label>
                                <div className="share-input-wrapper">
                                    <input id="fen-share" type="text" readOnly value={game.fen()} />
                                    <button onClick={() => handleCopy('fen')}>
                                        {copied === 'fen' ? <CheckIcon className="check-icon" /> : <CopyIcon />}
                                    </button>
                                </div>
                            </div>
                            <div className="share-form-group">
                                <label htmlFor="pgn-share">PGN</label>
                                 <div className="share-input-wrapper">
                                    <textarea id="pgn-share" readOnly value={game.pgn()} rows={8}></textarea>
                                    <button onClick={() => handleCopy('pgn')}>
                                        {copied === 'pgn' ? <CheckIcon className="check-icon" /> : <CopyIcon />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'image' && (
                        <div className="share-image-content">
                            <div className="share-image-preview">
                                <Chessboard boardState={boardState} pieceTheme={pieceTheme} />
                            </div>
                            <button className="btn btn-primary download-btn" onClick={handleDownload}>
                                <DownloadIcon /> Download
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
