/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { PieceSymbol as ChessJSPieceSymbol, Square as ChessJSSquare, Move } from 'chess.js';
import Chessboard from '../Chessboard';
import CapturedPieces from '../ui/CapturedPieces';
import MoveHistory from '../ui/MoveHistory';
import { soundManager } from '../../lib/SoundManager';
import { BackIcon, FlipIcon, FirstMoveIcon, PrevMoveIcon, NextMoveIcon, LastMoveIcon, BookmarkIcon, BookmarkFilledIcon, CheckIcon, CloseIcon, RobotIcon, HumanIcon, ShareIcon } from '../ui/Icons';
import { PIECE_SETS, PIECE_NAMES } from '../../lib/chessConstants';
import { useChessGame } from '../../hooks/useChessGame';
import { useBoardDrawing } from '../../hooks/useBoardDrawing';
import { useCapturedPieces } from '../../hooks/useCapturedPieces';
import { db } from '../../lib/db';
import { generateBoardThumbnail } from '../../lib/utils';
import type { AppState, PieceColor, PieceSymbol, HistoryEntry, User, StoredGame, AnalysisDetails } from '../../lib/types';
import UserPanel from '../result/UserPanel';
import { useAppSettings } from '../../hooks/useAppSettings';
import { useStockfish } from '../../hooks/useStockfish';
import { ShareModal } from '../ui/ShareModal';
import './SolveView.css';

type AppSettingsHook = ReturnType<typeof useAppSettings>;

// --- Bookmark Modal Component ---
interface BookmarkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, folder: string) => Promise<void>;
    onRemove: () => Promise<void>;
    initialGame: StoredGame | null;
    anchorRect: DOMRect | null;
}

const BookmarkModal = ({ isOpen, onClose, onSave, onRemove, initialGame, anchorRect }: BookmarkModalProps) => {
    const [name, setName] = useState('');
    const [selectedFolder, setSelectedFolder] = useState('Default');
    const [newFolderName, setNewFolderName] = useState('');
    const [isCreatingNewFolder, setIsCreatingNewFolder] = useState(false);
    const [allFolders, setAllFolders] = useState<string[]>([]);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            const fetchFolders = async () => {
                const folders = await db.getAllFolders();
                setAllFolders(folders);
            };
            fetchFolders();
            
            setName(initialGame?.name || `Game from ${new Date().toLocaleDateString()}`);
            setSelectedFolder(initialGame?.folder || 'Default');
            setIsCreatingNewFolder(false);
            setNewFolderName('');
        }
    }, [isOpen, initialGame]);

    if (!isOpen || !anchorRect) return null;

    const modalStyle: React.CSSProperties = {
        position: 'absolute',
        top: `${anchorRect.bottom + 8}px`,
        right: `${window.innerWidth - anchorRect.right}px`,
    };

    const handleFolderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === '__new__') {
            setIsCreatingNewFolder(true);
        } else {
            setSelectedFolder(e.target.value);
            setIsCreatingNewFolder(false);
        }
    };

    const handleSaveClick = () => {
        const folder = isCreatingNewFolder ? (newFolderName.trim() || 'Default') : selectedFolder;
        onSave(name.trim(), folder);
    };

    return createPortal(
        <div className="bookmark-modal-overlay" onClick={onClose}>
            <div className="bookmark-modal" ref={modalRef} style={modalStyle} onClick={(e) => e.stopPropagation()}>
                <div className="bookmark-modal-header">
                    <h3>{initialGame ? 'Edit Bookmark' : 'Add Bookmark'}</h3>
                    <button onClick={onClose} className="close-btn"><CloseIcon /></button>
                </div>
                <div className="bookmark-form-group">
                    <label htmlFor="bookmark-name">Name</label>
                    <input id="bookmark-name" type="text" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="bookmark-form-group">
                    <label htmlFor="bookmark-folder">Folder</label>
                    {!isCreatingNewFolder ? (
                        <select id="bookmark-folder" value={selectedFolder} onChange={handleFolderChange}>
                            {!allFolders.includes(selectedFolder) && <option value={selectedFolder}>{selectedFolder}</option>}
                            {allFolders.map(f => <option key={f} value={f}>{f}</option>)}
                            <option value="__new__">Create new folder...</option>
                        </select>
                    ) : (
                        <input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="New folder name" autoFocus />
                    )}
                </div>
                <div className="bookmark-modal-actions">
                    {initialGame && <button className="btn btn-remove" onClick={onRemove}>Remove</button>}
                    <button className="btn btn-primary" onClick={handleSaveClick}>Done</button>
                </div>
            </div>
        </div>,
        document.body
    );
};


interface SolveViewProps {
    initialFen: string;
    onBack: () => void;
    onHome: () => void;
    appSettings: AppSettingsHook;
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
    onProfileClick: () => void;
    onAuthRequired: () => void;
    scanDuration: number | null;
    analysisDetails: AnalysisDetails | null;
}

/**
 * The main analysis and interaction view. It allows the user to play through moves,
 * see captured pieces, and navigate the move history.
 */
const SolveView = ({
    initialFen, onBack, onHome, appSettings, onNextPuzzle, source, initialHistory, sourceView, initialGameId,
    user, isLoggedIn, onLogout, onAdminPanelClick, onSavedGamesClick, onHistoryClick, onProfileClick, onAuthRequired, scanDuration,
    analysisDetails
}: SolveViewProps) => {
    const {
        game, currentBoard, history, historyIndex, gameStatus,
        selectedSquare, possibleMoves, promotionMove,
        handleSquareClick: originalHandleSquareClick, handlePromotion, navigateHistory, makeRawMove,
        isGameOver, turn,
        isFlipped, setIsFlipped,
    } = useChessGame(initialFen, initialHistory || undefined);
    
    const [highlightedSquares, setHighlightedSquares] = useState<ChessJSSquare[]>([]);
    const { boardAreaRef, renderedArrows, setArrows, handleBoardPointerDown, handleBoardPointerMove, handleBoardPointerUp } = useBoardDrawing(isFlipped, handleSquareRightClick);
    const { capturedWhitePieces, capturedBlackPieces, materialAdvantage } = useCapturedPieces(history, historyIndex);

    const stockfish = useStockfish();
    const { evaluatePosition, stopEvaluation, logDebug, isReady: isEngineReady, isThinking, bestMove, debugLog } = stockfish;

    const [playerSide, setPlayerSide] = useState<'w' | 'b' | null>(appSettings.engineEnabled ? turn : null);

    const [cooldown, setCooldown] = useState(appSettings.analysisCooldown);
    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
    const [bookmarkedGame, setBookmarkedGame] = useState<StoredGame | null>(null);
    const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [bookmarkAnchorRect, setBookmarkAnchorRect] = useState<DOMRect | null>(null);
    const bookmarkButtonRef = useRef<HTMLButtonElement>(null);

    const PIECE_COMPONENTS = PIECE_SETS[appSettings.pieceTheme as keyof typeof PIECE_SETS] || PIECE_SETS['staunty'];
    
    const initialFenRef = useRef(initialFen);
    const historyRef = useRef(history);
    const isInitialHistoryRef = useRef(!!initialHistory);

    function handleSquareRightClick(square: ChessJSSquare) {
        setHighlightedSquares(prev => {
            if (prev.includes(square)) {
                return prev.filter(s => s !== square);
            } else {
                return [...prev, square];
            }
        });
    }

    const selectedSquareCoords = useMemo(() => {
        if (!selectedSquare) return null;
        const file = selectedSquare.charCodeAt(0) - 'a'.charCodeAt(0);
        const rank = parseInt(selectedSquare.substring(1), 10) - 1;
        return { row: 7 - rank, col: file };
    }, [selectedSquare]);

    const handleSquareClick = useCallback((pos: { row: number; col: number }) => {
        setArrows([]);
        setHighlightedSquares([]);

        if (playerSide && turn !== playerSide) {
            logDebug(`Move ignored: Not player's turn (Player: ${playerSide}, Current: ${turn})`);
            return; 
        }

        const moveResult = originalHandleSquareClick(pos);
        if (moveResult && moveResult.san) {
            logDebug(`User move: ${moveResult.san}`);
        }
    }, [originalHandleSquareClick, setArrows, playerSide, turn, logDebug]);

    useEffect(() => {
        if (appSettings.engineEnabled) {
            setPlayerSide(turn);
        } else {
            setPlayerSide(null);
            if (isThinking) {
                stopEvaluation();
            }
        }
    }, [appSettings.engineEnabled]); 
    
    const difficultyToDepth = {
        'standard': 10,
        'hard': 15,
        'extra-hard': 20,
    };
    const currentDepth = difficultyToDepth[appSettings.engineDifficulty];
    
    useEffect(() => {
        if (playerSide && turn !== playerSide && !isGameOver && appSettings.engineEnabled && isEngineReady && !isThinking) {
            const currentFen = game.fen();
            logDebug(`Requesting engine move for FEN: ${currentFen} at depth ${currentDepth}`);
            
            evaluatePosition(currentFen, currentDepth, (engineBestMove) => {
                if (engineBestMove) {
                    logDebug(`Engine best move received: ${engineBestMove}.`);
                    setTimeout(() => {
                        const moveResult = makeRawMove(engineBestMove);
                        if(moveResult && moveResult.san) {
                            logDebug(`Engine made move: ${moveResult.san}`);
                        } else {
                            logDebug(`Engine move ${engineBestMove} was illegal or failed.`);
                        }
                    }, 500);
                }
            });
        }
    }, [historyIndex, playerSide, turn, isGameOver, appSettings.engineEnabled, isEngineReady, isThinking, evaluatePosition, logDebug, makeRawMove, game, currentDepth]);
    
    useEffect(() => { initialFenRef.current = initialFen; }, [initialFen]);
    useEffect(() => { historyRef.current = history; }, [history]);
    useEffect(() => { setCooldown(appSettings.analysisCooldown); }, [appSettings.analysisCooldown]);

    const checkBookmarkStatus = useCallback(async () => {
        await db.init();
        const savedGames = await db.getAllGames();
        const existingGame = savedGames.find(g => g.initialFen === initialFen);
        setBookmarkedGame(existingGame || null);
    }, [initialFen]);

    useEffect(() => {
        checkBookmarkStatus();
    }, [checkBookmarkStatus]);

    useEffect(() => {
        return () => {
            const saveGameToHistory = async () => {
                if (!isInitialHistoryRef.current && historyRef.current.length > 0) { 
                    try {
                        const thumbnail = generateBoardThumbnail(initialFenRef.current);
                        const gameData = { initialFen: initialFenRef.current, date: Date.now(), thumbnail, moveHistory: historyRef.current };
                        await db.init();
                        await db.saveHistory(gameData);
                    } catch (e) {
                        console.error("Failed to auto-save game to history:", e);
                    }
                }
            };
            saveGameToHistory();
        };
    }, []);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => setCooldown(prev => (prev > 0 ? prev - 1 : 0)), 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    const handleBookmarkClick = () => {
        if (bookmarkButtonRef.current) {
            setBookmarkAnchorRect(bookmarkButtonRef.current.getBoundingClientRect());
        }
        setIsBookmarkModalOpen(true);
    };

    const handleSaveBookmark = async (name: string, folder: string) => {
        try {
            await db.init();
            if (bookmarkedGame) {
                await db.updateGameDetails(bookmarkedGame.id, name, folder);
            } else {
                const thumbnail = generateBoardThumbnail(initialFen);
                await db.saveGame({ name, folder, initialFen, date: Date.now(), thumbnail, moveHistory: history });
            }
            await checkBookmarkStatus();
            setIsBookmarkModalOpen(false);
            setShowSaveConfirmation(true);
            setTimeout(() => setShowSaveConfirmation(false), 2500);
        } catch (e) { console.error("Failed to save bookmark:", e); }
    };

    const handleRemoveBookmark = async () => {
        try {
            if (bookmarkedGame) {
                await db.init();
                await db.deleteGame(bookmarkedGame.id);
                setBookmarkedGame(null);
            }
            setIsBookmarkModalOpen(false);
        } catch (e) { console.error("Failed to remove bookmark:", e); }
    };

    const handleAnalysisClick = (e: React.MouseEvent<HTMLAnchorElement>) => { if (cooldown > 0) e.preventDefault(); };

    const lastMove = historyIndex >= 0 ? { from: history[historyIndex].from, to: history[historyIndex].to } : null;
    const backButtonTitle = sourceView === 'result' ? "Back to Editor" : "Back to List";
    const nextButtonText = source === 'pdf' ? 'Back to PDF' : 'New Scan';
    const nextButtonTitle = source === 'pdf' ? 'Return to PDF viewer' : 'Start a new scan';

    return (
        <div className="card solve-view-card">
            <div className="solve-view-container">
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
                    debugLog={debugLog} 
                    bestMove={bestMove}
                    displayMode="compact"
                    isEngineReady={isEngineReady}
                    isThinking={isThinking}
                    playerSide={playerSide}
                    turn={turn}
                />
                <div className="board-analysis-wrapper">
                    <div className="board-area" ref={boardAreaRef} onContextMenu={(e) => e.preventDefault()} onPointerDown={handleBoardPointerDown} onPointerMove={handleBoardPointerMove} onPointerUp={handleBoardPointerUp}>
                        <Chessboard boardState={currentBoard} onSquareClick={handleSquareClick} selectedSquare={selectedSquareCoords} lastMove={lastMove} possibleMoves={possibleMoves} userHighlights={highlightedSquares} isFlipped={isFlipped} pieceTheme={appSettings.pieceTheme} />
                        
                        {renderedArrows.length > 0 && ( <svg className="drawing-overlay" width="100%" height="100%"><defs><marker id="arrowhead" viewBox="0 -24 41.57 48" refX="0" refY="0" markerUnits="userSpaceOnUse" markerWidth="48" markerHeight="48" orient="auto"><polygon points="41.57,0 0,-24 0,24" /></marker></defs>{renderedArrows}</svg> )}
                        {isGameOver && ( <div className="game-over-overlay"><h2>{gameStatus}</h2><button className="btn btn-secondary" onClick={() => { onNextPuzzle(); }}>{nextButtonText}</button></div> )}
                        {showSaveConfirmation && createPortal( <div className="save-toast"><CheckIcon /> Game Saved</div>, document.body )}
                    </div>
                </div>
                <div className="solve-controls">
                    <div className="solve-view-header">
                         <div className="captured-pieces-stack">
                            <CapturedPieces color="b" pieces={capturedBlackPieces} scoreAdvantage={materialAdvantage.blackAdvantage} pieceTheme={appSettings.pieceTheme} />
                            <CapturedPieces color="w" pieces={capturedWhitePieces} scoreAdvantage={materialAdvantage.whiteAdvantage} pieceTheme={appSettings.pieceTheme} />
                        </div>
                    </div>
                    <div className="move-navigation-controls">
                        <button className="btn-icon" onClick={() => { navigateHistory(-1); }} disabled={historyIndex < 0} aria-label="First move" title="Go to the first move"><FirstMoveIcon /></button>
                        <button className="btn-icon" onClick={() => { navigateHistory(historyIndex - 1); }} disabled={historyIndex < 0} aria-label="Previous move" title="Go to previous move"><PrevMoveIcon /></button>
                        <button className="btn-icon" onClick={() => { setIsFlipped(!isFlipped); }} aria-label="Flip board" title="Flip board orientation"><FlipIcon /></button>
                        <button className="btn-icon" onClick={() => { navigateHistory(historyIndex + 1); }} disabled={historyIndex >= history.length - 1} aria-label="Next move" title="Go to next move"><NextMoveIcon /></button>
                        <button className="btn-icon" onClick={() => { navigateHistory(history.length - 1); }} disabled={historyIndex >= history.length - 1} aria-label="Last move" title="Go to the last move"><LastMoveIcon /></button>
                    </div>
                    <div className="move-history-wrapper">
                        <MoveHistory history={history} historyIndex={historyIndex} onNavigate={navigateHistory} />
                        <div className="move-history-actions">
                            <button ref={bookmarkButtonRef} className={`btn-icon save-game-btn ${bookmarkedGame ? 'bookmarked' : ''}`} onClick={handleBookmarkClick} title={bookmarkedGame ? "Edit Bookmark" : "Bookmark Game"} aria-label={bookmarkedGame ? "Edit Bookmark" : "Bookmark Game"}>{bookmarkedGame ? <BookmarkFilledIcon /> : <BookmarkIcon />}</button>
                            <button className="btn-icon share-game-btn" onClick={() => setIsShareModalOpen(true)} title="Share Game"><ShareIcon /></button>
                        </div>
                        <BookmarkModal isOpen={isBookmarkModalOpen} onClose={() => setIsBookmarkModalOpen(false)} onSave={handleSaveBookmark} onRemove={handleRemoveBookmark} initialGame={bookmarkedGame} anchorRect={bookmarkAnchorRect} />
                    </div>

                    <div className="solve-main-actions">
                        <a className={`btn btn-analyze ${cooldown > 0 ? 'disabled' : ''}`} href={`https://www.chess.com/analysis?fen=${encodeURIComponent(game.fen())}&flip=${turn === 'b'}`} target="_blank" rel="noopener noreferrer" onClick={handleAnalysisClick}>Analysis with chess.com {cooldown > 0 ? `(${Math.floor(cooldown/60)}:${String(cooldown%60).padStart(2,'0')})` : ''}</a>
                        <a className={`btn btn-dark ${cooldown > 0 ? 'disabled' : ''}`} href={`https://lichess.org/analysis/standard/${encodeURIComponent(game.fen())}`} target="_blank" rel="noopener noreferrer" onClick={handleAnalysisClick}>Analysis with Lichess.org {cooldown > 0 ? `(${Math.floor(cooldown/60)}:${String(cooldown%60).padStart(2,'0')})` : ''}</a>
                        <div className="result-actions">
                            <button className="btn btn-secondary btn-back" onClick={() => { onBack(); }} title={backButtonTitle} aria-label={backButtonTitle}><BackIcon/> Back</button>
                            <button className="btn btn-secondary" onClick={() => { onHome(); }} aria-label="Go to Home Screen" title="Return to the home screen">Home</button>
                            <button className="btn btn-analyze" onClick={() => { onNextPuzzle(); }} title={nextButtonTitle}>{nextButtonText}</button>
                        </div>
                    </div>
                </div>

                {promotionMove && createPortal( <div className="promotion-overlay" onClick={() => handlePromotion(null)}><div className="promotion-choices" onClick={e => e.stopPropagation()}>{(['q', 'r', 'b', 'n'] as PieceSymbol[]).map(p => { const PieceComponent = PIECE_COMPONENTS[turn as PieceColor][p]; return ( <PieceComponent key={p} className="piece" aria-label={`Promote to ${PIECE_NAMES[p]}`} onClick={() => handlePromotion(p as ChessJSPieceSymbol)} /> ); })}</div></div>, document.body )}
            </div>
             <ShareModal 
                isOpen={isShareModalOpen} 
                onClose={() => setIsShareModalOpen(false)} 
                game={game}
                boardState={currentBoard}
                pieceTheme={appSettings.pieceTheme}
            />
        </div>
    );
};

export default SolveView;