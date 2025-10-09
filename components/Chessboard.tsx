/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useMemo } from 'react';
import { FILES, RANKS, PIECE_NAMES, PIECE_SETS } from '../lib/chessConstants';
import type { BoardState, BoardPiece } from '../lib/types';
import './Chessboard.css';

// Type definition for a "held" piece, used for both click-to-move and drag-and-drop.
type HeldPiece = {
    piece: BoardPiece;
    from: { row: number, col: number } | 'palette';
};

interface ChessboardProps {
    boardState: BoardState;
    onSquareClick?: (pos: { row: number, col: number }) => void;
    onPiecePointerDown?: (item: HeldPiece, e: React.PointerEvent) => void;
    selectedSquare?: { row: number, col: number } | null;
    lastMove?: { from: string, to: string } | null;
    possibleMoves?: string[];
    uncertainSquares?: string[];
    userHighlights?: string[];
    verificationHighlights?: string[];
    isFlipped?: boolean;
    heldPiece?: HeldPiece | null;
    pieceTheme: string;
}

/**
 * A highly configurable and memoized component for rendering a chessboard.
 * It has been updated to use a modern pointer-event system for all interactions.
 * React.memo is used to prevent re-rendering if its props have not changed.
 */
const Chessboard = React.memo(({
  boardState,
  onSquareClick,
  onPiecePointerDown,
  selectedSquare,
  lastMove,
  possibleMoves = [],
  uncertainSquares = [],
  userHighlights = [],
  verificationHighlights = [],
  isFlipped = false,
  heldPiece,
  pieceTheme
}: ChessboardProps) => {
    
    // Determine the order of ranks and files based on whether the board is flipped.
    const ranks = isFlipped ? [...RANKS] : [...RANKS].reverse();
    const files = isFlipped ? [...FILES].reverse() : [...FILES];
    const PIECE_COMPONENTS = PIECE_SETS[pieceTheme as keyof typeof PIECE_SETS] || PIECE_SETS['merida'];
    
    // Helper function to convert algebraic notation (e.g., 'e4') to board coordinates ({row: 4, col: 4}).
    const getSquareCoords = (square: string): { row: number, col: number } => {
        const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
        const rank = parseInt(square.substring(1), 10) - 1;
        return { row: 7 - rank, col: file };
    };

    // `useMemo` is used here for performance. This calculation only re-runs if `lastMove` changes.
    // It creates a Set of coordinate strings for quick lookup when rendering squares.
    const lastMoveSquares = useMemo(() => {
        if (!lastMove) return new Set();
        const fromCoords = getSquareCoords(lastMove.from);
        const toCoords = getSquareCoords(lastMove.to);
        return new Set([`${fromCoords.row}-${fromCoords.col}`, `${toCoords.row}-${toCoords.col}`]);
    }, [lastMove]);
    
    // Similarly, memoize the set of possible move squares.
    const possibleMoveSquares = useMemo(() => {
        return new Set(possibleMoves.map(move => {
            const coords = getSquareCoords(move);
            return `${coords.row}-${coords.col}`;
        }));
    }, [possibleMoves]);

    const uncertainSquareSet = useMemo(() => {
        return new Set(uncertainSquares.map(square => {
            const coords = getSquareCoords(square);
            return `${coords.row}-${coords.col}`;
        }));
    }, [uncertainSquares]);
    
    const userHighlightSet = useMemo(() => new Set(userHighlights), [userHighlights]);
    
    const verificationHighlightSet = useMemo(() => {
        return new Set(verificationHighlights.map(square => {
            const coords = getSquareCoords(square);
            return `${coords.row}-${coords.col}`;
        }));
    }, [verificationHighlights]);

    // Determine the source square of the currently held piece for styling.
    const heldSquare = (heldPiece && typeof heldPiece.from === 'object' && 'row' in heldPiece.from) ? heldPiece.from : null;

    /**
     * The main rendering function that generates the 64 squares and the pieces on them.
     */
    const renderBoard = () => {
        const board = [];
        for (let i = 0; i < 8; i++) { // Represents the visual row from top to bottom
            for (let j = 0; j < 8; j++) { // Represents the visual column from left to right
                // Get the actual board coordinates, accounting for whether the board is flipped.
                const row = isFlipped ? 7 - i : i;
                const col = isFlipped ? 7 - j : j;

                const piece = boardState[row]?.[col];
                const isLight = (row + col) % 2 === 0;
                const squareName = `${FILES[col]}${RANKS[7 - row]}`;
                
                // Determine the state of the current square for styling.
                const isSelected = selectedSquare && selectedSquare.row === row && selectedSquare.col === col;
                const isLastMove = lastMoveSquares.has(`${row}-${col}`);
                const isPossibleMove = possibleMoveSquares.has(`${row}-${col}`);
                const isUncertain = uncertainSquareSet.has(`${row}-${col}`);
                const isUserHighlighted = userHighlightSet.has(squareName);
                const isVerificationMismatch = verificationHighlightSet.has(`${row}-${col}`);
                const hasPiece = !!piece;
                
                const isHeldOrigin = heldSquare && heldSquare.row === row && heldSquare.col === col;
                
                board.push(
                    <div
                        key={`${row}-${col}`}
                        // Add data-attributes for reliable drop target identification.
                        data-row={row}
                        data-col={col}
                        // Dynamically build the CSS class list based on the square's state.
                        className={`square ${isLight ? 'light' : 'dark'} ${isSelected ? 'selected' : ''} ${isLastMove ? 'last-move-square' : ''} ${isHeldOrigin ? 'held-piece-origin' : ''} ${isUncertain ? 'uncertain-square' : ''} ${isUserHighlighted ? 'user-highlighted-square' : ''} ${isVerificationMismatch ? 'verification-mismatch-square' : ''}`}
                        onClick={() => onSquareClick?.({ row, col })}
                        aria-label={`Square ${squareName}`}
                    >
                        {/* This inner div is for move indicators (dot or capture ring). */}
                        <div className={`
                            ${isPossibleMove && !hasPiece ? 'possible-move-dot' : ''}
                            ${isPossibleMove && hasPiece ? 'possible-move-capture' : ''}
                        `}>
                        {piece && (
                            // Render the piece component if one exists on this square.
                            React.createElement(PIECE_COMPONENTS[piece.color][piece.type], {
                                onPointerDown: (e: React.PointerEvent) => onPiecePointerDown?.({ piece, from: { row, col } }, e),
                                className: `piece ${isHeldOrigin ? 'dragging' : ''}`, // The 'dragging' class makes the original piece transparent
                                'aria-label': `${piece.color === 'w' ? 'White' : 'Black'} ${PIECE_NAMES[piece.type]}`,
                            })
                        )}
                        </div>

                        {/* Render rank and file notations on the edges of the board. */}
                        {j === 0 && <span className="notation rank">{ranks[i]}</span>}
                        {i === 7 && <span className="notation file">{files[j]}</span>}
                    </div>
                );
            }
        }
        return board;
    };

    return (
        <div className="board-wrapper">
            <div className={`chessboard-container ${heldPiece ? 'is-holding-piece' : ''}`}>
                <div className="chessboard">
                    {renderBoard()}
                </div>
            </div>
        </div>
    );
});

export default Chessboard;