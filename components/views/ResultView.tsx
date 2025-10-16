/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { soundManager } from '../../lib/SoundManager';
import { PIECE_SETS } from '../../lib/chessConstants';
import { useBoardEditor } from '../../hooks/useBoardEditor';
import { usePieceInteraction } from '../../hooks/usePieceInteraction';
import type { BoardPiece, PieceColor, AnalysisDetails, User } from '../../lib/types';
import UserPanel from '../result/UserPanel';
import EditorBoard from '../result/EditorBoard';
import EditorControls from '../result/EditorControls';
import { useAppSettings } from '../../hooks/useAppSettings';
import './ResultView.css';

type AppSettingsHook = ReturnType<typeof useAppSettings>;

interface ResultViewProps {
    initialFen: string;
    initialTurn: PieceColor;
    originalImage: string | null;
    onBack: () => void;
    onAnalyze: (fen: string) => void;
    analysisDetails: AnalysisDetails;
    scanDuration: number | null;
    onRescan: () => void;
    isRescanning: boolean;
    onRescanComplete: number;
    user: User | null;
    isLoggedIn: boolean;
    onLogout: () => void;
    onAdminPanelClick: () => void;
    onSavedGamesClick: () => void;
    onHistoryClick: () => void;
    onProfileClick: () => void;
    onAuthRequired: () => void;
    appSettings: AppSettingsHook;
}


/**
 * The view shown after a successful scan. It displays the resulting board position
 * and provides tools for the user to edit the board, correct any errors, and
 * then proceed to analysis. This component now features a custom, robust
 * pointer-event-based system for all piece interactions.
 */
const ResultView = ({ 
    initialFen, initialTurn, originalImage, onBack, onAnalyze, analysisDetails, scanDuration, onRescan, isRescanning, onRescanComplete,
    user, isLoggedIn, onLogout, onAdminPanelClick, onSavedGamesClick, onHistoryClick, onProfileClick, onAuthRequired, appSettings
}: ResultViewProps) => {
    const {
        board, turn, fen, isFenValid,
        setTurn,
        sanitizationMessages, setSanitizationMessages,
        handlePieceDrop, handleFenChange,
    } = useBoardEditor(initialFen, initialTurn);

    const {
        heldPiece, ghostPosition,
        handlePiecePointerDown, handleSquareClick,
    } = usePieceInteraction({ board, onPieceDrop: handlePieceDrop });
    
    const [showRescanToast, setShowRescanToast] = useState(false);
    const isInitialMount = useRef(true);
    const PIECE_COMPONENTS = PIECE_SETS[appSettings.pieceTheme as keyof typeof PIECE_SETS] || PIECE_SETS['merida'];
    
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

    const handlePalettePointerDown = useCallback((piece: BoardPiece, e: React.PointerEvent) => {
        handlePiecePointerDown({ piece, from: 'palette' }, e);
    }, [handlePiecePointerDown]);

    const handleRemoveClick = useCallback(() => {
        if (heldPiece) {
            handlePieceDrop(heldPiece, null);
        }
    }, [heldPiece, handlePieceDrop]);

    const selectedSquare = useMemo(() => {
        // A square is "selected" for highlighting if a piece is held, but not yet being dragged.
        if (heldPiece && heldPiece.from !== 'palette' && !ghostPosition) {
            return heldPiece.from;
        }
        return null;
    }, [heldPiece, ghostPosition]);

    const handleAnalyzeClick = () => {
        onAnalyze(fen);
    };

    const handleBackClick = () => {
        onBack();
    };

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
            
            <div className="result-view-container">
                <UserPanel
                    user={user}
                    isLoggedIn={isLoggedIn}
                    onLogout={onLogout}
                    onAdminPanelClick={onAdminPanelClick}
                    onSavedGamesClick={onSavedGamesClick}
                    onHistoryClick={onHistoryClick}
                    onLoginClick={onAuthRequired}
                    onProfileClick={onProfileClick}
                    appSettings={appSettings}
                    scanDuration={scanDuration}
                    analysisDetails={analysisDetails}
                    displayMode="full"
                />
                <EditorBoard
                    board={board}
                    handleSquareClick={handleSquareClick}
                    handlePiecePointerDown={handlePiecePointerDown}
                    heldPiece={ghostPosition ? heldPiece : null}
                    selectedSquare={selectedSquare}
                    analysisDetails={analysisDetails}
                    isRescanning={isRescanning}
                    showRescanToast={showRescanToast}
                    pieceTheme={appSettings.pieceTheme}
                />
                {/* FIX: Pass the 'appSettings' prop to the EditorControls component. */}
                <EditorControls
                    originalImage={originalImage}
                    isRescanning={isRescanning}
                    onRescan={onRescan}
                    turn={turn}
                    setTurn={setTurn}
                    setSanitizationMessages={setSanitizationMessages}
                    handlePalettePointerDown={handlePalettePointerDown}
                    handleRemoveClick={handleRemoveClick}
                    heldPiece={heldPiece}
                    ghostPosition={ghostPosition}
                    sanitizationMessages={sanitizationMessages}
                    analysisDetails={analysisDetails}
                    fen={fen}
                    handleFenChange={handleFenChange}
                    isFenValid={isFenValid}
                    onBack={handleBackClick}
                    onAnalyze={handleAnalyzeClick}
                    pieceTheme={appSettings.pieceTheme}
                    appSettings={appSettings}
                />
            </div>
        </div>
    );
};

export default ResultView;