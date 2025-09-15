/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import Chessboard from '../Chessboard';
import { BackIcon, TrashIcon, CopyIcon, CheckIcon, RescanIcon, UserCircleIcon, LogoutIcon, AccountIcon, BookmarkFilledIcon, HistoryIcon } from '../ui/Icons';
import { soundManager } from '../../lib/SoundManager';
import { PIECE_COMPONENTS, PIECE_NAMES } from '../../lib/chessConstants';
import { useBoardEditor } from '../../hooks/useBoardEditor';
import { usePieceInteraction } from '../../hooks/usePieceInteraction';
import type { BoardPiece, PieceColor, PieceSymbol, AnalysisDetails, User } from '../../lib/types';
import './ResultView.css';
import { useAppSettings } from '../../hooks/useAppSettings';
import UserMenu from '../ui/UserMenu';

type AppSettingsHook = ReturnType<typeof useAppSettings>;

interface ResultViewProps {
    initialFen: string;
    initialTurn: PieceColor;
    originalImage: string | null;
    onBack: () => void;
    onAnalyze: (fen: string) => void;
    analysisDetails: AnalysisDetails;
    onRescan: () => void;
    isRescanning: boolean;
    onRescanComplete: number;
    user: User | null;
    isLoggedIn: boolean;
    onLogout: () => void;
    onAdminPanelClick: () => void;
    onSavedGamesClick: () => void;
    onHistoryClick: () => void;
    appSettings: AppSettingsHook;
    onAuthRequired: () => void;
}

const UserPanel = ({ user, onLogout, onAdminPanelClick, onSavedGamesClick, onHistoryClick }: {
    user: User;
    onLogout: () => void;
    onAdminPanelClick: () => void;
    onSavedGamesClick: () => void;
    onHistoryClick: () => void;
}) => (
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

/**
 * The view shown after a successful scan. It displays the resulting board position
 * and provides tools for the user to edit the board, correct any errors, and
 * then proceed to analysis. This component now features a custom, robust
 * pointer-event-based system for all piece interactions.
 */
const ResultView = ({ 
    initialFen, initialTurn, originalImage, onBack, onAnalyze, analysisDetails, onRescan, isRescanning, onRescanComplete,
    user, isLoggedIn, onLogout, onAdminPanelClick, onSavedGamesClick, onHistoryClick, appSettings, onAuthRequired
}: ResultViewProps) => {
    const {
        board, turn, fen, isFenValid,
        setBoard, setTurn,
        sanitizationMessage, setSanitizationMessage,
        handlePieceDrop, handleFenChange,
    } = useBoardEditor(initialFen, initialTurn);

    const {
        heldPiece, ghostPosition,
        handlePiecePointerDown, handleSquareClick,
    } = usePieceInteraction({ board, onPieceDrop: handlePieceDrop });
    
    const [showCopied, setShowCopied] = useState(false);
    const [openPalette, setOpenPalette] = useState<PieceColor | null>(null);
    const whitePaletteRef = useRef<HTMLDivElement>(null);
    const blackPaletteRef = useRef<HTMLDivElement>(null);
    const [showRescanToast, setShowRescanToast] = useState(false);
    const isInitialMount = useRef(true);
    const WhitePawn = PIECE_COMPONENTS.w.p;
    const BlackPawn = PIECE_COMPONENTS.b.p;

    // Effect to show a "Rescan Complete" toast message after a rescan.
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        
        // Don't show toast if we are currently rescanning
        if (!isRescanning) {
            setShowRescanToast(true);
            const timer = setTimeout(() => {
                setShowRescanToast(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [onRescanComplete, isRescanning]);

    // Effect to close the piece palettes when clicking outside of them.
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                whitePaletteRef.current && !whitePaletteRef.current.contains(event.target as Node) &&
                blackPaletteRef.current && !blackPaletteRef.current.contains(event.target as Node)
            ) {
                setOpenPalette(null);
            }
        };
        if (openPalette !== null) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openPalette]);

    const handlePalettePointerDown = useCallback((piece: BoardPiece, e: React.PointerEvent) => {
        handlePiecePointerDown({ piece, from: 'palette' }, e);
    }, [handlePiecePointerDown]);

    const handleRemoveClick = useCallback(() => {
        if (heldPiece) {
            handlePieceDrop(heldPiece, null);
        }
    }, [heldPiece, handlePieceDrop]);

    const copyFen = () => {
        navigator.clipboard.writeText(fen).then(() => {
            soundManager.play('UI_CLICK');
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 2000);
        });
    };
    
    const allPieces: { color: PieceColor, types: PieceSymbol[] }[] = [
        { color: 'w', types: ['q', 'k', 'r', 'b', 'n', 'p'] },
        { color: 'b', types: ['q', 'k', 'r', 'b', 'n', 'p'] }
    ];

    return (
        <div className="card result-view-card">
            {ghostPosition && heldPiece && createPortal(
                <div
                    id="ghost-piece"
                    style={{
                        position: 'fixed',
                        left: ghostPosition.x,
                        top: ghostPosition.y,
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'none',
                        width: '12.5vmin',
                        maxWidth: '80px',
                        zIndex: 1000,
                    }}
                >
                    {React.createElement(PIECE_COMPONENTS[heldPiece.piece.color][heldPiece.piece.type])}
                </div>,
                document.body
            )}
             {isLoggedIn &&
                <header className="initial-view-header">
                     <UserMenu user={user!} onLogout={onLogout} onAdminPanelClick={onAdminPanelClick} onSavedGamesClick={onSavedGamesClick} onHistoryClick={onHistoryClick} appSettings={appSettings} />
                </header>
            }
            
            <div className={`result-view-container ${isLoggedIn ? 'logged-in' : 'guest'}`}>
                 {isLoggedIn && user && (
                    <UserPanel
                        user={user}
                        onLogout={onLogout}
                        onAdminPanelClick={onAdminPanelClick}
                        onSavedGamesClick={onSavedGamesClick}
                        onHistoryClick={onHistoryClick}
                    />
                )}
                <div className="editor-board-panel">
                    {isRescanning && (
                        <div className="rescanning-board-overlay">
                            <div className="spinner"></div>
                            <span>Rescanning...</span>
                        </div>
                    )}
                    {showRescanToast && (
                        <div className="rescan-toast">
                            <CheckIcon /> Rescan Complete
                        </div>
                    )}
                    <Chessboard
                        boardState={board}
                        onSquareClick={handleSquareClick}
                        onPiecePointerDown={handlePiecePointerDown}
                        heldPiece={ghostPosition ? heldPiece : null}
                        uncertainSquares={analysisDetails.uncertainSquares}
                    />
                </div>
                <div className={`editor-controls-panel ${openPalette ? 'palette-is-open' : ''}`}>
                    {originalImage && (
                        <div className="control-section result-image-panel">
                            <h4>Original Scan</h4>
                             <div className="rescannable-image-container">
                                <img src={originalImage} alt="Original scanned position" />
                                <div className="rescan-overlay" onClick={isRescanning ? undefined : onRescan} role="button" tabIndex={isRescanning ? -1 : 0} title="Rescan original image">
                                    {isRescanning ? <div className="spinner-small"></div> : <RescanIcon />}
                                    <span>{isRescanning ? 'Scanning...' : 'Click to Rescan'}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="control-section">
                        <h4 className="board-controls-title">Board Controls</h4>
                        <div className="board-actions">
                            <div className="chess-turn-toggle">
                                <input
                                    type="checkbox"
                                    id="turn-toggle-checkbox"
                                    checked={turn === 'b'}
                                    onChange={() => {
                                        setSanitizationMessage(null);
                                        setTurn(prev => (prev === 'w' ? 'b' : 'w'));
                                    }}
                                    aria-label="Toggle turn to move"
                                />
                                <label htmlFor="turn-toggle-checkbox" className="toggle-label" title="Toggle who moves first (White/Black)">
                                    <WhitePawn className="pawn-icon white-pawn" />
                                    <BlackPawn className="pawn-icon black-pawn" />
                                    <span className="knob" />
                                </label>
                            </div>
                            {allPieces.map(({ color, types }) => {
                                const KingComponent = PIECE_COMPONENTS[color].k;
                                return (
                                <div ref={color === 'w' ? whitePaletteRef : blackPaletteRef} className={`palette-group ${openPalette === color ? 'open' : ''}`} key={color}>
                                    <button className="btn-icon" onClick={() => { soundManager.play('UI_CLICK'); setOpenPalette(prev => prev === color ? null : color); }} title={`Add ${color === 'w' ? 'White' : 'Black'} pieces`}>
                                        <KingComponent className="piece" aria-label={`Add ${color === 'w' ? 'White' : 'Black'} pieces`} />
                                    </button>
                                    <div className="palette">
                                        {types.map(p => {
                                            const PieceComponent = PIECE_COMPONENTS[color][p];
                                            const pieceData = { type: p, color: color };
                                            return (
                                                <div
                                                    key={`${color}_${p}`}
                                                    className="piece"
                                                    onPointerDown={(e) => handlePalettePointerDown(pieceData, e)}
                                                    title={`Add ${PIECE_NAMES[p]}`}
                                                    aria-label={`Add ${PIECE_NAMES[p]}`}
                                                >
                                                     <PieceComponent/>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )})}
                            <div className={`remove-zone ${ghostPosition || (heldPiece && heldPiece.from !== 'palette') ? 'dragging-active' : ''}`} onClick={handleRemoveClick} data-drop-target="remove" title="Drag a piece here or hold a piece and click to remove it">
                                <TrashIcon />
                            </div>
                        </div>
                    </div>

                    {(sanitizationMessage || (analysisDetails.uncertainSquares && analysisDetails.uncertainSquares.length > 0)) && (
                        <div className="warning-banner">
                            {sanitizationMessage || "The AI was unsure about the highlighted squares. Please check the piece placement."}
                        </div>
                    )}


                    <div className="result-actions-wrapper">
                        <div className="control-section">
                            <h4>FEN String</h4>
                            <div className="fen-input-wrapper">
                                <input type="text" value={fen} onChange={handleFenChange} className={`fen-input ${!isFenValid ? 'invalid' : ''}`} />
                                <button className="btn-icon" onClick={copyFen} title="Copy FEN string to clipboard">
                                    {showCopied ? <CheckIcon/> : <CopyIcon/>}
                                </button>
                            </div>
                        </div>
                        <div className="result-actions">
                             <button className="btn-icon" onClick={() => { soundManager.play('UI_CLICK'); onBack(); }} aria-label="Back to Home" title="Go back"><BackIcon /></button>
                             <button className="btn btn-analyze btn-analyse-large" onClick={() => { soundManager.play('UI_CLICK'); onAnalyze(fen); }} disabled={!isFenValid} title="Analyze this position">
                                Analyze Position
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultView;