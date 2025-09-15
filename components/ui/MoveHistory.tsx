/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef, useMemo } from 'react';
import { soundManager } from '../../lib/SoundManager';
import type { HistoryEntry } from '../../lib/types';
import './MoveHistory.css';

interface MoveHistoryProps {
    /** The full list of moves made so far. */
    history: HistoryEntry[];
    /** The index of the currently displayed move in the history array. */
    historyIndex: number;
    /** Callback function to navigate to a specific move index. */
    onNavigate: (index: number) => void;
}

/**
 * A component that displays the game's move history in standard algebraic notation.
 * It groups moves into pairs (e.g., "1. e4 e5") and highlights the active move.
 */
const MoveHistory = ({ history, historyIndex, onNavigate }: MoveHistoryProps) => {
    // A ref to the DOM element of the currently active move.
    const activeMoveRef = useRef<HTMLSpanElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // `useMemo` is used for performance to avoid re-calculating the move pairs on every render.
    // This logic groups the linear `history` array into pairs of (white, black) moves.
    const movePairs = useMemo(() => {
        const pairs: {
            moveNum: number;
            white?: { entry: HistoryEntry; index: number };
            black?: { entry: HistoryEntry; index: number };
        }[] = [];

        if (!history || history.length === 0) {
            return pairs;
        }

        const firstMoveIsBlack = history[0].color === 'b';
        let moveCounter = 1;
        let historyIdx = 0;

        // Special handling if the first move in the history is Black's.
        if (firstMoveIsBlack) {
            pairs.push({
                moveNum: moveCounter,
                white: undefined, // No white move for this number.
                black: { entry: history[historyIdx], index: historyIdx },
            });
            moveCounter++;
            historyIdx++;
        }

        // Loop through the rest of the history, pairing white and black moves.
        while (historyIdx < history.length) {
            pairs.push({
                moveNum: moveCounter,
                white: { entry: history[historyIdx], index: historyIdx },
                black: history[historyIdx + 1] ? { entry: history[historyIdx + 1], index: historyIdx + 1 } : undefined,
            });
            moveCounter++;
            historyIdx += 2;
        }

        return pairs;
    }, [history]);
    
    // This effect automatically scrolls the active move into view when the historyIndex changes.
    useEffect(() => {
        if (activeMoveRef.current) {
            activeMoveRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest', // Scrolls the minimum amount to bring it into view.
            });
        }
    }, [historyIndex]);

    return (
        <div className="move-history-panel">
            <div className="move-history-content" ref={containerRef}>
                {history.length > 0 ? (
                    <ol className="move-list">
                        {movePairs.map(({ moveNum, white, black }) => (
                            <li key={moveNum} className="move-pair">
                                <span className="move-number">{moveNum}.</span>
                                {white ? (
                                    <span
                                        // Attach the ref to the active move element.
                                        ref={historyIndex === white.index ? activeMoveRef : null}
                                        className={`move-notation ${historyIndex === white.index ? 'active' : ''}`}
                                        onClick={() => { soundManager.play('UI_CLICK'); onNavigate(white.index); }}
                                        role="button"
                                        tabIndex={0}
                                    >
                                        {white.entry.san}
                                    </span>
                                ) : (
                                    // If there's no white move but there is a black one, show a placeholder.
                                    black && <span className="move-notation placeholder">...</span>
                                )}
                                {black && (
                                    <span
                                        ref={historyIndex === black.index ? activeMoveRef : null}
                                        className={`move-notation ${historyIndex === black.index ? 'active' : ''}`}
                                        onClick={() => { soundManager.play('UI_CLICK'); onNavigate(black.index); }}
                                        role="button"
                                        tabIndex={0}
                                    >
                                        {black.entry.san}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ol>
                ) : (
                    <div className="no-moves-placeholder">
                        <h4>Move History</h4>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MoveHistory;