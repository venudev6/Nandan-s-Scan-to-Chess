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

// Custom hook to manage the Stockfish Web Worker
const useStockfish = (onMessage: (message: string) => void) => {
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        let isMounted = true;
        
        try {
            // The worker is now served statically from the public directory.
            const stockfishWorker = new Worker('/workers/stockfish-bootstrap.js');
            workerRef.current = stockfishWorker;
    
            const messageHandler = (e: MessageEvent) => {
                if (isMounted) {
                    onMessage(e.data);
                }
            };
            stockfishWorker.addEventListener('message', messageHandler);
        } catch (e) {
            console.error("Error initializing Stockfish worker:", e);
        }

        // Terminate the worker on cleanup
        return () => {
            isMounted = false;
            if (workerRef.current) {
                workerRef.current.postMessage('quit');
                workerRef.current.terminate();
                workerRef.current = null;
            }
        };
    }, [onMessage]);

    const postCommand = useCallback((command: string) => {
        if (workerRef.current) {
            workerRef.current.postMessage(command);
        }
    }, []);

    return { postCommand };
};


/**
 * A comprehensive hook for managing the state of a chess game.
 * It uses the chess.js library for game logic and a custom Stockfish service for AI analysis.
 * @param initialFen - The FEN string of the starting position.
 * @param initialHistory - An optional array of moves to load into the game.
 */
export const useChessGame = (initialFen: string, initialHistory?: HistoryEntry[]) => {
    // useRef to hold the mutable chess.js instance without causing re-renders
    const gameRef = useRef(new Chess());
    const isInitialHistoryRef = useRef(!!(initialHistory && initialHistory.length > 0));

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
    
    // Engine State
    const [engineThinking, setEngineThinking] = useState(false);
    const [bestMove, setBestMove] = useState<{ from: string, to: string } | null>(null);
    const [evaluation, setEvaluation] = useState<string | null>(null);
    const [playVsComputer, setPlayVsComputer] = useState(false);
    const [playerColor, setPlayerColor] = useState<PieceColor>('w');

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
            setBestMove(null); 
            setEvaluation(null);
        }

        return result;
    }, [history, historyIndex, updateGameState]);
    
    // useRef to hold latest state for use inside the memoized engine message handler
    const engineStateRef = useRef({ playVsComputer, isGameOver, playerColor, makeMove });
    useEffect(() => {
        engineStateRef.current = { playVsComputer, isGameOver, playerColor, makeMove };
    }, [playVsComputer, isGameOver, playerColor, makeMove]);

    // Memoized engine message handler
    const handleEngineMessage = useCallback((message: string) => {
        // The bootstrap worker signals when the WASM is ready.
        if (message === '__engine_ready__') {
            postCommand('uci');
            return;
        }

        if (message.startsWith('info depth')) {
            const scoreMatch = message.match(/score (cp|mate) (-?\d+)/);
            if (scoreMatch) {
                const type = scoreMatch[1];
                let value = parseInt(scoreMatch[2], 10);
                if (gameRef.current.turn() === 'b' && type === 'cp') {
                   value = -value;
                }
                const evalString = type === 'mate' ? `#${value}` : (value / 100).toFixed(2);
                setEvaluation(evalString);
            }
        } else if (message.startsWith('bestmove')) {
            setEngineThinking(false);
            const moveStr = message.split(' ')[1];
            if (moveStr && moveStr !== '(none)') {
                const from = moveStr.substring(0, 2) as ChessJSSquare;
                const to = moveStr.substring(2, 4) as ChessJSSquare;
                
                // If it's the computer's turn to play, make the move
                // Use the ref here to get the latest state without creating a new callback.
                const { playVsComputer, isGameOver, playerColor, makeMove } = engineStateRef.current;
                if (playVsComputer && !isGameOver && gameRef.current.turn() !== playerColor) {
                    const moves = gameRef.current.moves({ square: from, verbose: true });
                    const moveDetails = moves.find(m => m.to === to);
                    setTimeout(() => {
                        makeMove({ from, to, promotion: moveDetails?.promotion as ChessJSPieceSymbol | undefined });
                    }, 500); // Small delay for effect
                } else {
                    // Otherwise, just show the hint
                    setBestMove({ from, to });
                }
            }
        }
    // FIX: Removed dependencies that would cause re-creation of this handler, leading to re-subscribing the worker listener.
    // Instead, we use a ref (engineStateRef) to access the latest state from within this stable callback.
    // We still need postCommand though.
    }, [/* No dependencies here */]);

    const { postCommand } = useStockfish(handleEngineMessage);
    
    // Effect to trigger engine calculation for computer's turn
    useEffect(() => {
        if (playVsComputer && !isGameOver && turn !== playerColor && !engineThinking) {
            setEngineThinking(true);
            setBestMove(null);
            postCommand(`position fen ${gameRef.current.fen()}`);
            postCommand('go movetime 2000');
        }
    }, [fen, playVsComputer, isGameOver, turn, playerColor, postCommand, engineThinking]);
    
    // Effect to initialize the game state from FEN or history
    useEffect(() => {
        isInitialHistoryRef.current = !!(initialHistory && initialHistory.length > 0);
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
            setPlayVsComputer(false);
            setBestMove(null);
            setEvaluation(null);
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


    const getHint = useCallback(() => {
        if (engineThinking) return;
        setEngineThinking(true);
        postCommand(`position fen ${gameRef.current.fen()}`);
        postCommand('go movetime 1000');
    }, [postCommand, engineThinking]);

    const handleTogglePlayVsComputer = useCallback((enabled: boolean) => {
        setPlayVsComputer(enabled);
        if (enabled) {
            if (gameRef.current.turn() !== playerColor && !gameRef.current.isGameOver()) {
                setEngineThinking(true);
                postCommand(`position fen ${gameRef.current.fen()}`);
                postCommand('go movetime 2000');
            }
        } else {
            // If we turn off AI, stop any current thinking
            postCommand('stop');
            setEngineThinking(false);
        }
    }, [playerColor, postCommand]);

    const handleReset = useCallback(() => {
        const gameInstance = new Chess(initialFen);
        gameRef.current = gameInstance;
        updateGameState(gameInstance);
        setHistory([]);
        setHistoryIndex(-1);
        setSelectedSquare(null);
        setPossibleMoves([]);
        setPromotionMove(null);
        setBestMove(null);
        setEvaluation(null);
        if (playVsComputer && gameInstance.turn() !== playerColor) {
            setEngineThinking(true);
            postCommand(`position fen ${initialFen}`);
            postCommand('go movetime 2000');
        }
    }, [initialFen, playVsComputer, playerColor, postCommand, updateGameState]);
    
    const handleSquareClick = useCallback((pos: { row: number, col: number }) => {
        if (isGameOver || (playVsComputer && turn !== playerColor)) return;

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
    }, [isGameOver, playVsComputer, turn, playerColor, selectedSquare, makeMove]);

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
        setBestMove(null);
        setEvaluation(null);
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
        engineThinking,
        bestMove,
        evaluation,
        playVsComputer,
        setPlayerColor,
        playerColor,
        getHint,
        togglePlayVsComputer: handleTogglePlayVsComputer,
        handleReset,
    };
};
