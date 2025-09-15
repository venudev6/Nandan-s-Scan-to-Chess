/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import type { Square as ChessJSSquare, Move, PieceSymbol as ChessJSPieceSymbol } from 'chess.js';
import { soundManager } from '../lib/SoundManager';
import { fenToBoardState } from '../lib/fenUtils';
import { FILES, RANKS } from '../lib/chessConstants';
import type { BoardState, HistoryEntry, PieceColor } from '../lib/types';

/**
 * A custom hook to manage the entire state and logic of a chess game.
 * It encapsulates the chess.js instance and provides a clean API for interacting with the game.
 * @param initialFen The starting FEN string for the game.
 * @param initialHistory Optional array of moves to pre-populate the game with.
 */
export const useChessGame = (initialFen: string, initialHistory?: HistoryEntry[]) => {
    const game = useMemo(() => new Chess(), []);
    
    const [currentBoard, setCurrentBoard] = useState<BoardState>(() => fenToBoardState(game.fen()).board);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [selectedSquare, setSelectedSquare] = useState<ChessJSSquare | null>(null);
    const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
    const [promotionMove, setPromotionMove] = useState<{ from: ChessJSSquare, to: ChessJSSquare } | null>(null);
    const [gameStatus, setGameStatus] = useState('');

    const getGameStatus = useCallback((): string => {
        if (game.isCheckmate()) return "Checkmate!";
        if (game.isStalemate()) return "Stalemate!";
        if (game.isThreefoldRepetition()) return "Draw by Threefold Repetition";
        if (game.isInsufficientMaterial()) return "Draw by Insufficient Material";
        if (game.isDraw()) return "Draw";
        if (game.isCheck()) return `${game.turn() === 'w' ? 'White' : 'Black'} is in Check`;
        return `${game.turn() === 'w' ? 'White' : 'Black'} to move`;
    }, [game]);
    
    const syncGameState = useCallback(() => {
        const { board } = fenToBoardState(game.fen());
        setCurrentBoard(board);
        setGameStatus(getGameStatus());
    }, [game, getGameStatus]);
    
    // Effect to initialize or reset the game state when props change.
    useEffect(() => {
        let fenToLoad = initialFen;
        let historyToSet: HistoryEntry[] = [];
        let historyIndexToSet = -1;

        if (initialHistory && initialHistory.length > 0) {
            historyToSet = initialHistory;
            historyIndexToSet = initialHistory.length - 1;
            fenToLoad = initialHistory[historyIndexToSet].fen;
        }

        game.load(fenToLoad);
        setHistory(historyToSet);
        setHistoryIndex(historyIndexToSet);
        syncGameState();
        setSelectedSquare(null);
        setPossibleMoves([]);
        setPromotionMove(null);

    }, [initialFen, initialHistory, game, syncGameState]);


    const updateBoardAndHistory = useCallback((move: Move | null) => {
        if (move) {
            const newHistoryEntry: HistoryEntry = {
                fen: game.fen(), san: move.san, from: move.from, to: move.to,
                color: move.color as PieceColor, captured: move.captured,
            };
            const newHistory = [...history.slice(0, historyIndex + 1), newHistoryEntry];
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        } else {
             const newHistoryIndex = history.findIndex(h => h.fen === game.fen());
             setHistoryIndex(newHistoryIndex);
        }
        syncGameState();
    }, [game, history, historyIndex, syncGameState]);

    const makeMove = useCallback((move: { from: ChessJSSquare, to: ChessJSSquare, promotion?: ChessJSPieceSymbol }) => {
        try {
            const result = game.move(move);
            if (game.isCheckmate()) soundManager.play('CHECKMATE');
            else if (game.isCheck()) soundManager.play('CHECK');
            else if (result.captured) soundManager.play('CAPTURE');
            else soundManager.play('MOVE');
            updateBoardAndHistory(result);
            return true;
        } catch (e) {
            soundManager.play('ERROR');
            return false;
        } finally {
            setSelectedSquare(null);
            setPossibleMoves([]);
            setPromotionMove(null);
        }
    }, [game, updateBoardAndHistory]);

    const handleSquareClick = useCallback((pos: { row: number, col: number }) => {
        if (game.isGameOver()) return;

        const square = `${FILES[pos.col]}${RANKS[7-pos.row]}` as ChessJSSquare;

        if (selectedSquare) {
            const piece = game.get(selectedSquare);
            if (piece?.type === 'p' && (square.endsWith('8') || square.endsWith('1'))) {
                const moves = game.moves({ square: selectedSquare, verbose: true });
                if (moves.some(m => m.to === square)) {
                    setPromotionMove({ from: selectedSquare, to: square }); 
                    return;
                }
            }
            
            const moveSuccess = makeMove({ from: selectedSquare, to: square, promotion: 'q' });

            if (!moveSuccess) {
                 const newPiece = game.get(square);
                if (newPiece && newPiece.color === game.turn()) {
                    setSelectedSquare(square);
                    setPossibleMoves(game.moves({ square, verbose: true }).map(m => m.to));
                } else {
                    setSelectedSquare(null);
                    setPossibleMoves([]);
                }
            }
        } else {
            const moves = game.moves({ square, verbose: true });
            if (moves.length > 0) {
                setSelectedSquare(square);
                setPossibleMoves(moves.map(m => m.to));
            }
        }
    }, [game, selectedSquare, makeMove]);

    const handlePromotion = useCallback((piece: ChessJSPieceSymbol | null) => {
        if (promotionMove && piece) {
            makeMove({ ...promotionMove, promotion: piece });
        } else {
            setPromotionMove(null);
            setSelectedSquare(null);
            setPossibleMoves([]);
        }
    }, [promotionMove, makeMove]);
    
    const navigateHistory = useCallback((index: number) => {
        if (index < 0) {
             game.load(initialFen); 
        } else if (index < history.length) {
            game.load(history[index].fen);
        }
        updateBoardAndHistory(null);
    }, [game, initialFen, history, updateBoardAndHistory]);

    const getSelectedSquareCoords = () => {
        if (!selectedSquare) return null;
        const file = selectedSquare.charCodeAt(0) - 'a'.charCodeAt(0);
        const rank = parseInt(selectedSquare.substring(1), 10) - 1;
        return { row: 7 - rank, col: file };
    };

    return {
        game,
        currentBoard,
        history,
        historyIndex,
        gameStatus,
        selectedSquare: getSelectedSquareCoords(),
        possibleMoves,
        promotionMove,
        handleSquareClick,
        handlePromotion,
        navigateHistory,
        isGameOver: game.isGameOver(),
        isCheckmate: game.isCheckmate(),
        isCheck: game.isCheck(),
        turn: game.turn()
    };
};