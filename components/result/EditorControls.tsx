/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackIcon, TrashIcon, CopyIcon, CheckIcon, RescanIcon } from '../ui/Icons';
import { soundManager } from '../../lib/SoundManager';
import { PIECE_COMPONENTS, PIECE_NAMES } from '../../lib/chessConstants';
import type { BoardPiece, PieceColor, PieceSymbol, AnalysisDetails } from '../../lib/types';
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
    setSanitizationMessage: (message: string | null) => void;
    handlePalettePointerDown: (piece: BoardPiece, e: React.PointerEvent) => void;
    handleRemoveClick: () => void;
    heldPiece: HeldPiece | null;
    ghostPosition: { x: number; y: number } | null;
    sanitizationMessage: string | null;
    analysisDetails: AnalysisDetails;
    fen: string;
    handleFenChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isFenValid: boolean;
    onBack: () => void;
    onAnalyze: (fen: string) => void;
}

const EditorControls = ({
    originalImage,
    isRescanning,
    onRescan,
    turn,
    setTurn,
    setSanitizationMessage,
    handlePalettePointerDown,
    handleRemoveClick,
    heldPiece,
    ghostPosition,
    sanitizationMessage,
    analysisDetails,
    fen,
    handleFenChange,
    isFenValid,
    onBack,
    onAnalyze
}: EditorControlsProps) => {

    const [showCopied, setShowCopied] = useState(false);
    const [openPalette, setOpenPalette] = useState<PieceColor | null>(null);
    const whitePaletteRef = useRef<HTMLDivElement>(null);
    const blackPaletteRef = useRef<HTMLDivElement>(null);

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
    );
};

export default EditorControls;
