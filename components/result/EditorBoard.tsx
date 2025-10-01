/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import Chessboard from '../Chessboard';
import { CheckIcon } from '../ui/Icons';
import type { BoardState, BoardPiece, AnalysisDetails } from '../../lib/types';
import './EditorBoard.css';

type HeldPiece = {
    piece: BoardPiece;
    from: { row: number, col: number } | 'palette';
};

interface EditorBoardProps {
    board: BoardState;
    handleSquareClick: (pos: { row: number, col: number }) => void;
    handlePiecePointerDown: (item: HeldPiece, e: React.PointerEvent) => void;
    heldPiece: HeldPiece | null;
    selectedSquare: { row: number, col: number } | null;
    analysisDetails: AnalysisDetails;
    isRescanning: boolean;
    showRescanToast: boolean;
    pieceTheme: string;
}

const EditorBoard = ({
    board,
    handleSquareClick,
    handlePiecePointerDown,
    heldPiece,
    selectedSquare,
    analysisDetails,
    isRescanning,
    showRescanToast,
    pieceTheme,
}: EditorBoardProps) => {
    return (
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
                heldPiece={heldPiece}
                selectedSquare={selectedSquare}
                uncertainSquares={analysisDetails.uncertainSquares}
                pieceTheme={pieceTheme}
            />
        </div>
    );
};

export default EditorBoard;