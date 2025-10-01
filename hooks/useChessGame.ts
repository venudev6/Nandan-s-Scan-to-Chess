/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import type { Square as ChessJSSquare, PieceSymbol as ChessJSPieceSymbol, Move } from 'chess.js';
import { soundManager } from '../lib/SoundManager';
import { fenToBoardState } from '../lib/fenUtils';
import { FILES, RANKS, INITIAL_FEN } from '../lib/chessConstants';
import type { BoardState, HistoryEntry, PieceColor, PieceSymbol } from '../lib/types';

/**
 * A comprehensive hook for managing the state of a chess game.
 * It uses the chess.js library for game logic.
 * @param initialFen - The FEN string of the starting position.
 * @param initialHistory - An optional array of moves to load into the game.
 */
export const useChessGame = (initialFen: string, initialHistory?: HistoryEntry[]) => {
    // useRef to hold the mutable chess.js instance without causing re-renders
    const gameRef = useRef(new Chess());

    // Game state
    const [fen, setFen] = useState(initialFen);
    const [currentBoard, setCurrentBoard] = useState<BoardState>([]);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isFlipped, setIsFlipped] = useState(false);
    
    // Interaction State
    const [selectedSquare, setSelectedSquare] = useState<ChessJSSquare | null>(null);
    const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
    const [promotionMove, setPromotionMove] = useState<{ from: ChessJSSquare; to: ChessJSSquare; } | null>(null);
    
    // Derived state from FEN. This recalculates whenever `fen` changes.
    const { isGameOver, isCheckmate, isDraw, turn, isCheck } = useMemo(() => {
        // Use a temporary instance for checks to avoid mutating the ref's instance
        const tempGame = new Chess(fen); 
        return {
            isGameOver: tempGame.isGameOver(),
            isCheckmate: tempGame.isCheckmate(),
            isDraw: tempGame.isDraw(),
            turn: tempGame.turn() as PieceColor,
            isCheck: tempGame.isCheck(),
        };
    }, [fen]);
    
    const gameStatus = useMemo(() => {
        if (isCheckmate) {
            soundManager.play('CHECKMATE');
            return `Checkmate! ${turn === 'w' ? 'Black' : 'White'} wins.`;
        }
        if (isDraw) return 'Draw';
        if (isGameOver) return 'Game Over';
        return '';
    }, [isGameOver, isCheckmate, isDraw, turn]);

    // Function to update all React state from the chess.js instance
    const updateGameState = useCallback((gameInstance: Chess) => {
        setFen(gameInstance.fen());
        setCurrentBoard(fenToBoardState(gameInstance.fen()).board);
    }, []);
    
    // Function to make a move and update state
    const makeMove = useCallback((move: { from: ChessJSSquare, to: ChessJSSquare, promotion?: ChessJSPieceSymbol }) => {
        const game = gameRef.current;
        const result = game.move(move);

        if (result) {
            soundManager.play(result.captured ? 'CAPTURE' : 'MOVE');
            const newHistoryEntry: HistoryEntry = {
                fen: game.fen(),
                san: result.san,
                from: result.from,
                to: result.to,
                color: result.color as PieceColor,
                captured: result.captured as PieceSymbol,
            };
            
            const newHistory = [...history.slice(0, historyIndex + 1), newHistoryEntry];
            
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
            updateGameState(game);
            
            // Clear interaction states
            setSelectedSquare(null);
            setPossibleMoves([]);
            setPromotionMove(null);
        }

        return result;
    }, [history, historyIndex, updateGameState]);
    
    // Effect to initialize the game state from FEN or history
    useEffect(() => {
        try {
            const gameInstance = new Chess();
            gameInstance.load(initialFen);
            
            if (initialHistory && initialHistory.length > 0) {
                initialHistory.forEach(move => {
                    if (move.san) gameInstance.move(move.san);
                });
                setHistory(initialHistory);
                setHistoryIndex(initialHistory.length - 1);
            } else {
                setHistory([]);
                setHistoryIndex(-1);
            }
            
            gameRef.current = gameInstance;
            updateGameState(gameInstance);
            
            // Reset states for a new/loaded game
            setSelectedSquare(null);
            setPossibleMoves([]);
            setPromotionMove(null);

        } catch (e) {
            console.error("Failed to load FEN or history, resetting to initial board.", e);
            gameRef.current = new Chess(INITIAL_FEN);
            updateGameState(gameRef.current);
            setHistory([]);
            setHistoryIndex(-1);
        }
    }, [initialFen, initialHistory, updateGameState]);

    const handleReset = useCallback(() => {
        const gameInstance = new Chess(initialFen);
        gameRef.current = gameInstance;
        updateGameState(gameInstance);
        setHistory([]);
        setHistoryIndex(-1);
        setSelectedSquare(null);
        setPossibleMoves([]);
        setPromotionMove(null);
    }, [initialFen, updateGameState]);
    
    const handleSquareClick = useCallback((pos: { row: number, col: number }) => {
        if (isGameOver) return;

        const square = (FILES[pos.col] + RANKS[7 - pos.row]) as ChessJSSquare;
        
        if (selectedSquare === square) {
            setSelectedSquare(null);
            setPossibleMoves([]);
            return;
        }

        if (selectedSquare) {
            const move = gameRef.current.moves({ square: selectedSquare, verbose: true }).find(m => m.to === square);
            if (move) {
                if (move.flags.includes('p')) { // 'p' for promotion
                    setPromotionMove({ from: move.from, to: move.to });
                } else {
                    makeMove({ from: move.from, to: move.to });
                }
            } else {
                const piece = gameRef.current.get(square);
                if (piece && piece.color === turn) {
                    setSelectedSquare(square);
                    const newMoves = gameRef.current.moves({ square, verbose: true });
                    setPossibleMoves(newMoves.map(m => m.to));
                    soundManager.play('MOVE');
                } else {
                    setSelectedSquare(null);
                    setPossibleMoves([]);
                }
            }
        } else {
            const piece = gameRef.current.get(square);
            if (piece && piece.color === turn) {
                setSelectedSquare(square);
                const moves = gameRef.current.moves({ square, verbose: true });
                setPossibleMoves(moves.map(m => m.to));
                soundManager.play('MOVE');
            }
        }
    }, [isGameOver, turn, selectedSquare, makeMove]);

    const handlePromotion = useCallback((piece: ChessJSPieceSymbol | null) => {
        if (promotionMove && piece) {
            makeMove({ ...promotionMove, promotion: piece });
        }
        setPromotionMove(null);
    }, [promotionMove, makeMove]);
    
    const navigateHistory = useCallback((index: number) => {
        const newIndex = Math.max(-1, Math.min(index, history.length - 1));
        const game = new Chess(initialFen);
        for (let i = 0; i <= newIndex; i++) {
            game.move(history[i].san!);
        }
        gameRef.current = game;
        updateGameState(game);
        setHistoryIndex(newIndex);
        setSelectedSquare(null);
        setPossibleMoves([]);
    }, [history, initialFen, updateGameState]);
    
    return {
        game: gameRef.current,
        currentBoard,
        history,
        historyIndex,
        gameStatus,
        selectedSquare,
        possibleMoves,
        promotionMove,
        handleSquareClick,
        handlePromotion,
        navigateHistory,
        isGameOver,
        isCheckmate,
        isCheck,
        turn,
        isFlipped,
        setIsFlipped,
        handleReset,
    };
};