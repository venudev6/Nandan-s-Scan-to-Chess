/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackIcon, TrashIcon, CopyIcon, CheckIcon, RescanIcon, LockIcon } from '../ui/Icons';
import { soundManager } from '../../lib/SoundManager';
import { PIECE_SETS, PIECE_NAMES } from '../../lib/chessConstants';
import type { BoardPiece, PieceColor, PieceSymbol, AnalysisDetails } from '../../lib/types';
import { useAppSettings } from '../../hooks/useAppSettings';
import './EditorControls.css';

type HeldPiece = {
    piece: BoardPiece;
    from: { row: number, col: number } | 'palette';
};

interface EditorControlsProps {
    originalImage: string | null;
    isRescanning: boolean;
    onRescan: () => void;
    turn: PieceColor;
    setTurn: React.Dispatch<React.SetStateAction<"w" | "b">>;
    setSanitizationMessages: (messages: string[] | null) => void;
    handlePalettePointerDown: (piece: BoardPiece, e: React.PointerEvent) => void;
    handleRemoveClick: () => void;
    heldPiece: HeldPiece | null;
    ghostPosition: { x: number; y: number } | null;
    sanitizationMessages: string[] | null;
    analysisDetails: AnalysisDetails;
    fen: string;
    handleFenChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isFenValid: boolean;
    onBack: () => void;
    onAnalyze: (fen: string) => void;
    pieceTheme: string;
    appSettings: ReturnType<typeof useAppSettings>;
}

const EditorControls = ({
    originalImage,
    isRescanning,
    onRescan,
    turn,
    setTurn,
    setSanitizationMessages,
    handlePalettePointerDown,
    handleRemoveClick,
    heldPiece,
    ghostPosition,
    sanitizationMessages,
    analysisDetails,
    fen,
    handleFenChange,
    isFenValid,
    onBack,
    onAnalyze,
    pieceTheme,
    appSettings
}: EditorControlsProps) => {

    const [showCopied, setShowCopied] = useState(false);
    const [openPalette, setOpenPalette] = useState<PieceColor | null>(null);
    const whitePaletteRef = useRef<HTMLDivElement>(null);
    const blackPaletteRef = useRef<HTMLDivElement>(null);
    
    const PIECE_COMPONENTS = PIECE_SETS[pieceTheme as keyof typeof PIECE_SETS] || PIECE_SETS['merida'];
    const WhitePawn = PIECE_COMPONENTS.w.p;
    const BlackPawn = PIECE_COMPONENTS.b.p;

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
    
    const copyFen = () => {
        if (appSettings.fenCopyLocked) return;
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
                                setSanitizationMessages(null);
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
                                            title={`Add ${PIECE_NAMES[p]}`}
                                            aria-label={`Add ${PIECE_NAMES[p]}`}
                                        >
                                             <PieceComponent onPointerDown={(e) => handlePalettePointerDown(pieceData, e)} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )})}
                    {/* FIX: The component was truncated here. The onClick handler, children, and closing tags for the remove zone have been restored. */}
                    <div className={`remove-zone ${ghostPosition || (heldPiece && heldPiece.from !== 'palette') ? 'dragging-active' : ''}`} onClick={handleRemoveClick} role="button" tabIndex={0} title="Remove held piece from board">
                        <TrashIcon />
                        <span>Remove Piece</span>
                    </div>
                </div>
            </div>
            <div className="control-section fen-section">
                 {sanitizationMessages && (
                    <div className="info-banner sanitization-banner">
                        <div>
                            <strong>Initial FEN Corrections:</strong>
                            <ul className="validation-list">
                                {sanitizationMessages.map((msg, i) => <li key={i}>{msg}</li>)}
                            </ul>
                        </div>
                        <button onClick={() => setSanitizationMessages(null)}>&times;</button>
                    </div>
                )}
                <h4 className="fen-header">
                    Position (FEN)
                    {appSettings.fenCopyLocked && <LockIcon />}
                </h4>
                <div className={`fen-input-wrapper ${!isFenValid ? 'invalid' : ''}`}>
                    <input type="text" className="fen-input" value={fen} onChange={handleFenChange} aria-label="FEN string of the current position" title={fen} />
                    <button onClick={copyFen} className="btn-icon copy-fen-btn" aria-label="Copy FEN to clipboard" title={appSettings.fenCopyLocked ? "Unlock in Profile settings to enable" : "Copy FEN"} disabled={appSettings.fenCopyLocked}>
                        {showCopied ? <CheckIcon /> : <CopyIcon />}
                    </button>
                </div>
            </div>
            <div className="control-section result-actions">
                <button className="btn btn-secondary btn-back" onClick={onBack} title="Go back to the previous screen" aria-label="Go back">
                    <BackIcon /> Back
                </button>
                <button className="btn btn-primary" onClick={() => onAnalyze(fen)} disabled={!isFenValid} title="Analyze this position">
                    Analyse Position
                </button>
            </div>
        </div>
    );
};

export default EditorControls;