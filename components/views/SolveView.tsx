/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { PieceSymbol as ChessJSPieceSymbol, Square as ChessJSSquare } from 'chess.js';
import Chessboard from '../Chessboard';
import CapturedPieces from '../ui/CapturedPieces';
import MoveHistory from '../ui/MoveHistory';
import { soundManager } from '../../lib/SoundManager';
import { BackIcon, FlipIcon, FirstMoveIcon, PrevMoveIcon, NextMoveIcon, LastMoveIcon, BookmarkIcon, BookmarkFilledIcon, CheckIcon, EngineIcon, LightbulbIcon, HumanIcon, ComputerIcon, ResetIcon } from '../ui/Icons';
import { PIECE_COMPONENTS, PIECE_NAMES } from '../../lib/chessConstants';
import { useChessGame } from '../../hooks/useChessGame';
import { useBoardDrawing } from '../../hooks/useBoardDrawing';
import { useCapturedPieces } from '../../hooks/useCapturedPieces';
import { db } from '../../lib/db';
import { generateBoardThumbnail } from '../../lib/utils';
import type { AppState, PieceColor, PieceSymbol, HistoryEntry, User } from '../../lib/types';
import UserPanel from '../result/UserPanel';
import './SolveView.css';

interface EngineAnalysisPanelProps {
    engineThinking: boolean;
    evaluation: string | null;
    bestMove: { from: string; to: string } | null;
    playVsComputer: boolean;
    togglePlayVsComputer: (enabled: boolean) => void;
    playerColor: PieceColor;
    setPlayerColor: (color: PieceColor) => void;
    getHint: () => void;
}

const EngineAnalysisPanel = ({
    engineThinking,
    evaluation,
    bestMove,
    playVsComputer,
    togglePlayVsComputer,
    playerColor,
    setPlayerColor,
    getHint
}: EngineAnalysisPanelProps) => {
    return (
        <div className="control-section">
            <h4><EngineIcon /> Engine Analysis</h4>
            <div className="engine-controls">
                <div className="engine-control-item">
                    <label htmlFor="play-vs-cpu-toggle">Play vs. Computer</label>
                    <div className="toggle-switch">
                        <input
                            type="checkbox"
                            id="play-vs-cpu-toggle"
                            checked={playVsComputer}
                            onChange={(e) => togglePlayVsComputer(e.target.checked)}
                            aria-label="Play against the computer"
                        />
                        <span className="slider round"></span>
                    </div>
                </div>
                {playVsComputer && (
                    <div className="engine-control-item">
                        <span>Play as:</span>
                        <div className="turn-selector-inline">
                            <input
                                type="radio"
                                id="play-as-w"
                                name="playerColor"
                                value="w"
                                checked={playerColor === 'w'}
                                onChange={() => setPlayerColor('w')}
                            />
                            <label htmlFor="play-as-w" title="Play as White"><HumanIcon /></label>
                            <input
                                type="radio"
                                id="play-as-b"
                                name="playerColor"
                                value="b"
                                checked={playerColor === 'b'}
                                onChange={() => setPlayerColor('b')}
                            />
                            <label htmlFor="play-as-b" title="Play as Black"><ComputerIcon /></label>
                        </div>
                    </div>
                )}
                 <button className="btn btn-secondary get-hint-btn" onClick={getHint} disabled={engineThinking || playVsComputer}>
                    <LightbulbIcon />
                    {engineThinking ? 'Thinking...' : 'Get Hint'}
                </button>
            </div>
            {(evaluation || (bestMove && !playVsComputer)) && (
                <div className="engine-output">
                    <div className="evaluation-display">
                        <strong>Eval:</strong>
                        <span>{evaluation ?? '...'}</span>
                    </div>
                    {!playVsComputer && bestMove && (
                        <div className="best-move-display">
                            <strong>Best Move:</strong>
                            <span>{`${bestMove.from}${bestMove.to}`}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


interface SolveViewProps {
    initialFen: string;
    onBack: () => void;
    onHome: () => void;
    analysisCooldown: number;
    onNextPuzzle: () => void;
    source: 'pdf' | 'image';
    initialHistory?: HistoryEntry[] | null;
    initialGameId?: number;
    sourceView: AppState;
    user: User | null;
    isLoggedIn: boolean;
    onLogout: () => void;
    onAdminPanelClick: () => void;
    onSavedGamesClick: () => void;
    onHistoryClick: () => void;
}

/**
 * The main analysis and interaction view. It allows the user to play through moves,
 * see captured pieces, navigate the move history, and play against the Stockfish engine.
 */
const SolveView = ({
    initialFen, onBack, onHome, analysisCooldown, onNextPuzzle, source, initialHistory, sourceView, initialGameId,
    user, isLoggedIn, onLogout, onAdminPanelClick, onSavedGamesClick, onHistoryClick
}: SolveViewProps) => {
    const {
        game, currentBoard, history, historyIndex, gameStatus,
        selectedSquare, possibleMoves, promotionMove,
        handleSquareClick, handlePromotion, navigateHistory,
        isGameOver, isCheckmate, isCheck, turn,
        isFlipped, setIsFlipped, engineThinking, bestMove,
        evaluation, playVsComputer, playerColor, getHint,
        togglePlayVsComputer, setPlayerColor, handleReset,
    } = useChessGame(initialFen, initialHistory || undefined);

    const { boardAreaRef, arrows, drawingArrow, handleBoardPointerDown, handleBoardPointerMove, handleBoardPointerUp } = useBoardDrawing(isFlipped);
    
    const { capturedWhitePieces, capturedBlackPieces, materialAdvantage } = useCapturedPieces(history, historyIndex);

    const [cooldown, setCooldown] = useState(analysisCooldown);
    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(!!initialGameId);
    const [savedGameId, setSavedGameId] = useState<number | undefined>(initialGameId);
    
    const initialFenRef = useRef(initialFen);
    const historyRef = useRef(history);
    const isInitialHistoryRef = useRef(!!initialHistory);

    // FIX: Type 'string' is not assignable to type '{ row: number; col: number; }'.
    // Convert the selectedSquare (string) to coordinates object for the Chessboard component.
    const selectedSquareCoords = useMemo(() => {
        if (!selectedSquare) return null;
        const file = selectedSquare.charCodeAt(0) - 'a'.charCodeAt(0);
        const rank = parseInt(selectedSquare.substring(1), 10) - 1;
        return { row: 7 - rank, col: file };
    }, [selectedSquare]);

    useEffect(() => {
        initialFenRef.current = initialFen;
    }, [initialFen]);

    // Keep historyRef updated with the latest history
    useEffect(() => {
        historyRef.current = history;
    }, [history]);

    useEffect(() => {
        const checkBookmarkStatus = async () => {
            await db.init();
            if (initialGameId) {
                // If an ID is passed from props, we know it's bookmarked.
                setIsBookmarked(true);
                setSavedGameId(initialGameId);
            } else {
                // Otherwise, check by FEN for new/history games.
                const savedGames = await db.getAllGames();
                const existingGame = savedGames.find(g => g.initialFen === initialFen);
                if (existingGame) {
                    setIsBookmarked(true);
                    setSavedGameId(existingGame.id);
                } else {
                    setIsBookmarked(false);
                    setSavedGameId(undefined);
                }
            }
        };
        checkBookmarkStatus();
    }, [initialFen, initialGameId]);


    useEffect(() => {
        // This effect runs only on component unmount.
        // The cleanup function will save the game to history.
        return () => {
            const saveGameToHistory = async () => {
                // Only save if it's not a game loaded from history/bookmarks and if at least one move was made.
                if (!isInitialHistoryRef.current && historyRef.current.length > 0) { 
                    try {
                        const thumbnail = generateBoardThumbnail(initialFenRef.current);
                        const gameData = {
                            initialFen: initialFenRef.current,
                            date: Date.now(), // This is the timestamp
                            thumbnail,
                            moveHistory: historyRef.current,
                        };
                        await db.init();
                        await db.saveHistory(gameData);
                    } catch (e) {
                        console.error("Failed to auto-save game to history:", e);
                    }
                }
            };
            saveGameToHistory();
        };
    }, []); // Empty dependency array ensures this runs only on mount/unmount.

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => {
            setCooldown(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [cooldown]);
    
    // Automatically flip the board to the player's color when starting a game vs computer
    useEffect(() => {
        if (playVsComputer) {
            setIsFlipped(playerColor === 'b');
        }
    }, [playVsComputer, playerColor, setIsFlipped]);


    const handleToggleBookmark = async () => {
        try {
            soundManager.play('UI_CLICK');
            await db.init();

            if (isBookmarked && savedGameId) {
                // Unbookmark
                await db.deleteGame(savedGameId);
                setIsBookmarked(false);
                setSavedGameId(undefined);
            } else {
                // Bookmark
                const thumbnail = generateBoardThumbnail(initialFen);
                const gameData = {
                    initialFen,
                    date: Date.now(),
                    thumbnail,
                    moveHistory: history,
                };
                const newId = await db.saveGame(gameData);
                setSavedGameId(newId);
                setIsBookmarked(true);
                setShowSaveConfirmation(true);
                setTimeout(() => setShowSaveConfirmation(false), 2500);
            }
        } catch (e) {
            console.error("Failed to toggle bookmark:", e);
        }
    };


    const handleAnalysisClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (cooldown > 0) e.preventDefault();
    };

    const lastMove = historyIndex >= 0 ? { from: history[historyIndex].from, to: history[historyIndex].to } : null;
    const backButtonTitle = sourceView === 'result' ? "Back to Editor" : "Back to List";
    const nextButtonText = 'Next Puzzle';

    return (
        <div className="card solve-view-card">
            <div className={`solve-view-container ${isLoggedIn ? 'logged-in' : 'guest'}`}>
                 {isLoggedIn && user && (
                    <UserPanel
                        user={user}
                        onLogout={onLogout}
                        onAdminPanelClick={onAdminPanelClick}
                        onSavedGamesClick={onSavedGamesClick}
                        onHistoryClick={onHistoryClick}
                    />
                )}
                <div className="solve-view-header">
                     <div className="captured-pieces-stack">
                        <CapturedPieces color="b" pieces={capturedBlackPieces} scoreAdvantage={materialAdvantage.blackAdvantage} />
                        <CapturedPieces color="w" pieces={capturedWhitePieces} scoreAdvantage={materialAdvantage.whiteAdvantage} />
                    </div>
                </div>
                <div
                    className="board-area"
                    ref={boardAreaRef}
                    onContextMenu={(e) => e.preventDefault()}
                    onPointerDown={handleBoardPointerDown}
                    onPointerMove={handleBoardPointerMove}
                    onPointerUp={handleBoardPointerUp}
                >
                    <Chessboard
                        boardState={currentBoard}
                        onSquareClick={(pos) => { handleSquareClick(pos); }}
                        selectedSquare={selectedSquareCoords}
                        lastMove={lastMove}
                        possibleMoves={possibleMoves}
                        isFlipped={isFlipped}
                        bestMoveHighlight={playVsComputer ? null : bestMove}
                    />
                    {(engineThinking) && (
                         <div className="engine-thinking-overlay">
                            <div className="spinner"></div>
                            <span>Stockfish is thinking...</span>
                        </div>
                    )}
                    {isGameOver && (
                        <div className="game-over-overlay">
                            <h2>{gameStatus}</h2>
                            <button className="btn btn-secondary" onClick={onNextPuzzle}>
                                Next Puzzle
                            </button>
                        </div>
                    )}
                     {showSaveConfirmation && createPortal(
                        <div className="save-toast">
                            <CheckIcon /> Game Saved
                        </div>,
                        document.body
                    )}
                </div>
                <div className="solve-controls">
                    <div className="move-navigation-controls">
                        <button className="btn-icon" onClick={() => { soundManager.play('UI_CLICK'); navigateHistory(-1); }} disabled={historyIndex < 0} aria-label="First move" title="Go to the first move"><FirstMoveIcon /></button>
                        <button className="btn-icon" onClick={() => { soundManager.play('UI_CLICK'); navigateHistory(historyIndex - 1); }} disabled={historyIndex < 0} aria-label="Previous move" title="Go to previous move"><PrevMoveIcon /></button>
                        <button className="btn-icon" onClick={handleReset} aria-label="Reset Board" title="Reset Board"><ResetIcon /></button>
                        <button className="btn-icon" onClick={() => { soundManager.play('UI_CLICK'); setIsFlipped(!isFlipped); }} aria-label="Flip board" title="Flip board orientation"><FlipIcon /></button>
                        <button className="btn-icon" onClick={() => { soundManager.play('UI_CLICK'); navigateHistory(historyIndex + 1); }} disabled={historyIndex >= history.length - 1} aria-label="Next move" title="Go to next move"><NextMoveIcon /></button>
                        <button className="btn-icon" onClick={() => { soundManager.play('UI_CLICK'); navigateHistory(history.length - 1); }} disabled={historyIndex >= history.length - 1} aria-label="Last move" title="Go to the last move"><LastMoveIcon /></button>
                    </div>
                     <EngineAnalysisPanel 
                        engineThinking={engineThinking}
                        evaluation={evaluation}
                        bestMove={bestMove}
                        playVsComputer={playVsComputer}
                        togglePlayVsComputer={togglePlayVsComputer}
                        playerColor={playerColor}
                        setPlayerColor={setPlayerColor}
                        getHint={getHint}
                    />
                    <div className="move-history-wrapper">
                        <MoveHistory history={history} historyIndex={historyIndex} onNavigate={navigateHistory} />
                        <button 
                            className={`btn-icon save-game-btn ${isBookmarked ? 'bookmarked' : ''}`}
                            onClick={handleToggleBookmark} 
                            title={isBookmarked ? "Remove Bookmark" : "Bookmark Game"}
                            aria-label={isBookmarked ? "Remove Bookmark" : "Bookmark Game"}
                        >
                            {isBookmarked ? <BookmarkFilledIcon /> : <BookmarkIcon />}
                        </button>
                    </div>

                    <div className="solve-main-actions">
                        <a className={`btn btn-analyze ${cooldown > 0 ? 'disabled' : ''}`} href={`https://www.chess.com/analysis?fen=${encodeURIComponent(game.fen())}&flip=${turn === 'b'}`} target="_blank" rel="noopener noreferrer" onClick={handleAnalysisClick}>
                        Analysis with chess.com {cooldown > 0 ? `(${Math.floor(cooldown/60)}:${String(cooldown%60).padStart(2,'0')})` : ''}
                        </a>
                        <a className={`btn btn-dark ${cooldown > 0 ? 'disabled' : ''}`} href={`https://lichess.org/analysis/standard/${encodeURIComponent(game.fen())}`} target="_blank" rel="noopener noreferrer" onClick={handleAnalysisClick}>
                        Analysis with Lichess.org {cooldown > 0 ? `(${Math.floor(cooldown/60)}:${String(cooldown%60).padStart(2,'0')})` : ''}
                        </a>
                        <div className="result-actions">
                            <button className="btn-icon" onClick={() => { soundManager.play('UI_CLICK'); onBack(); }} aria-label={backButtonTitle} title={backButtonTitle}><BackIcon/></button>
                            <button className="btn btn-secondary" onClick={() => { soundManager.play('UI_CLICK'); onHome(); }} aria-label="Go to Home Screen" title="Return to the home screen">Home</button>
                            <button className="btn btn-analyze" onClick={() => { soundManager.play('UI_CLICK'); onNextPuzzle(); }} title="Start a new scan or puzzle">
                                {nextButtonText}
                            </button>
                        </div>
                    </div>
                </div>

                {promotionMove && createPortal(
                    <div className="promotion-overlay" onClick={() => handlePromotion(null)}>
                        <div className="promotion-choices" onClick={e => e.stopPropagation()}>
                            {(['q', 'r', 'b', 'n'] as PieceSymbol[]).map(p => {
                                const PieceComponent = PIECE_COMPONENTS[turn as PieceColor][p];
                                return (
                                    <PieceComponent 
                                        key={p} 
                                        className="piece"
                                        aria-label={`Promote to ${PIECE_NAMES[p]}`}
                                        onClick={() => handlePromotion(p as ChessJSPieceSymbol)}
                                    />
                                );
                            })}
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
};

export default SolveView;
