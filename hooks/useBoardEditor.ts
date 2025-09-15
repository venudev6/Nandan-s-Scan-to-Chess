/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { soundManager } from '../lib/SoundManager';
// FIX: INITIAL_FEN is not exported from fenUtils. It is in chessConstants.
import { boardStateToFen, fenToBoardState, completeFen } from '../lib/fenUtils';
import { INITIAL_FEN } from '../lib/chessConstants';
import type { BoardState, BoardPiece, PieceColor } from '../lib/types';

type HeldPiece = {
    piece: BoardPiece;
    from: { row: number, col: number } | 'palette';
};

/**
 * A custom hook to manage the state of the board editor in the ResultView.
 * It encapsulates the board state, turn, FEN string, validation, and modification logic.
 */
export const useBoardEditor = (initialFen: string, initialTurn: PieceColor) => {
    const [board, setBoard] = useState<BoardState>([]);
    const [turn, setTurn] = useState<PieceColor>(initialTurn);
    const [fen, setFen] = useState(initialFen);
    const [isFenValid, setIsFenValid] = useState(true);
    const [sanitizationMessage, setSanitizationMessage] = useState<string | null>(null);

    // This effect syncs the editor's state with the initialFen prop.
    // It runs on mount and whenever initialFen or initialTurn changes (e.g., after a rescan).
    useEffect(() => {
        try {
            const { board, turn, correctedFen } = fenToBoardState(initialFen);
            setBoard(board);
            setTurn(turn);
            const newFen = correctedFen ? boardStateToFen(board, turn) : initialFen;
            setFen(newFen);
            setIsFenValid(true);
            setSanitizationMessage(correctedFen || null);
        } catch (e) {
            console.error("Failed to parse FEN, falling back to initial board.", initialFen, e);
            const { board, turn } = fenToBoardState(INITIAL_FEN);
            setBoard(board);
            setTurn(turn);
            setFen(INITIAL_FEN);
            setIsFenValid(true);
            setSanitizationMessage("Could not parse the scanned position. Please set up the board manually.");
        }
    }, [initialFen, initialTurn]);

    // This effect updates the FEN string whenever the board or turn is modified by the user.
    useEffect(() => {
        // Avoid running this on the initial setup triggered by the effect above.
        if (board.length === 0) return;

        const newFen = boardStateToFen(board, turn);
        setFen(newFen);
        try {
            new Chess(newFen);
            setIsFenValid(true);
        } catch(e) {
            setIsFenValid(false);
        }
    }, [board, turn]);

    const handlePieceDrop = useCallback((
        item: HeldPiece,
        to: { row: number, col: number } | null
    ) => {
        setSanitizationMessage(null); // Clear any auto-correction messages on manual edit
        setBoard(currentBoard => {
            const newBoard = currentBoard.map(r => [...r]);
            if (typeof item.from === 'object' && 'row' in item.from) {
                newBoard[item.from.row][item.from.col] = null;
            }
            if (to) {
                newBoard[to.row][to.col] = item.piece;
                soundManager.play('MOVE');
            } else {
                soundManager.play('CAPTURE');
            }
            return newBoard;
        });
    }, []);

    const handleFenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFen = e.target.value;
        setFen(newFen);
        setSanitizationMessage(null);
        try {
            const completed = completeFen(newFen);
            const { board: newBoard, turn: newTurn } = fenToBoardState(completed);
            setBoard(newBoard);
            setTurn(newTurn);
            setIsFenValid(true);
        } catch (error) {
            setIsFenValid(false);
        }
    };
    
    return {
        board, setBoard,
        turn, setTurn,
        fen, setFen,
        isFenValid,
        sanitizationMessage, setSanitizationMessage,
        handlePieceDrop,
        handleFenChange
    };
};
