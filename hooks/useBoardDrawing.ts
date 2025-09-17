/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useCallback, useRef, useMemo } from 'react';
import type { Square as ChessJSSquare } from 'chess.js';
import { FILES, RANKS } from '../lib/chessConstants';

type Arrow = { from: ChessJSSquare; to: ChessJSSquare };
type DrawingState = {
    fromSquare: ChessJSSquare;
    toCoords: { x: number; y: number };
} | null;

/**
 * A custom hook to manage drawing arrows on the chessboard.
 * It encapsulates the state for arrows, the current drawing state,
 * and all the pointer event handlers required for the drawing interaction.
 */
export const useBoardDrawing = (isFlipped = false) => {
    const [arrows, setArrows] = useState<Arrow[]>([]);
    const [drawingArrow, setDrawingArrow] = useState<DrawingState>(null);
    const boardAreaRef = useRef<HTMLDivElement>(null);

    const getSquareFromMouseEvent = useCallback((e: React.MouseEvent | MouseEvent | React.PointerEvent): ChessJSSquare | null => {
        if (!boardAreaRef.current) return null;
        const rect = boardAreaRef.current.getBoundingClientRect();
        const squareSize = rect.width / 8;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (x < 0 || x > rect.width || y < 0 || y > rect.height) return null;

        let col = Math.floor(x / squareSize);
        let row = Math.floor(y / squareSize);
        
        if (isFlipped) {
            col = 7 - col;
            row = 7 - row;
        }

        return `${FILES[col]}${RANKS[7 - row]}` as ChessJSSquare;
    }, [isFlipped]);

    const getSquareCenterCoords = useCallback((square: ChessJSSquare): { x: number; y: number } | null => {
        if (!boardAreaRef.current) return null;
        const rect = boardAreaRef.current.getBoundingClientRect();
        const squareSize = rect.width / 8;
        
        let col = FILES.indexOf(square[0]);
        let rankIndex = RANKS.indexOf(square[1]);
        let row = 7 - rankIndex; // board state index to visual row

        if (isFlipped) {
            col = 7 - col;
            row = 7 - row;
        }

        return {
            x: col * squareSize + squareSize / 2,
            y: row * squareSize + squareSize / 2,
        };
    }, [isFlipped]);

    const handleBoardPointerDown = useCallback((e: React.PointerEvent) => {
        if (e.button !== 2) return; // Only right-click
        e.preventDefault();
        const fromSquare = getSquareFromMouseEvent(e);
        if (fromSquare) {
            const boardRect = boardAreaRef.current?.getBoundingClientRect();
            if (boardRect) {
                setDrawingArrow({ fromSquare, toCoords: { x: e.clientX - boardRect.left, y: e.clientY - boardRect.top } });
            }
        }
    }, [getSquareFromMouseEvent]);

    const handleBoardPointerMove = useCallback((e: React.PointerEvent) => {
        if (drawingArrow) {
            e.preventDefault();
            const boardRect = boardAreaRef.current?.getBoundingClientRect();
            if (boardRect) {
                setDrawingArrow(d => d ? { ...d, toCoords: { x: e.clientX - boardRect.left, y: e.clientY - boardRect.top } } : null);
            }
        }
    }, [drawingArrow]);

    const handleBoardPointerUp = useCallback((e: React.PointerEvent) => {
        if (e.button !== 2) return; // Only right-click
        e.preventDefault();

        if (drawingArrow) {
            const toSquare = getSquareFromMouseEvent(e);
            if (toSquare && toSquare !== drawingArrow.fromSquare) {
                setArrows(prev => {
                    const newArrow = { from: drawingArrow.fromSquare, to: toSquare };
                    // If arrow exists, remove it. Otherwise, add it.
                    const existingIndex = prev.findIndex(a => a.from === newArrow.from && a.to === newArrow.to);
                    if (existingIndex > -1) {
                        return [...prev.slice(0, existingIndex), ...prev.slice(existingIndex + 1)];
                    } else {
                        // Clear other arrows from the same start square before adding a new one.
                        const otherArrows = prev.filter(a => a.from !== newArrow.from);
                        return [...otherArrows, newArrow];
                    }
                });
            } else {
                // If it's just a click (no drag), clear all arrows
                setArrows([]);
            }
        }
        setDrawingArrow(null);
    }, [drawingArrow, getSquareFromMouseEvent]);
    
    // Convert arrow data to SVG <line> elements. useMemo for performance.
    const renderedArrows = useMemo(() => {
        return arrows.map((arrow, i) => {
            const fromCoords = getSquareCenterCoords(arrow.from);
            const toCoords = getSquareCenterCoords(arrow.to);
            if (!fromCoords || !toCoords) return null;
            // FIX: Replaced JSX with React.createElement to avoid TSX parsing errors in a .ts file.
            return React.createElement('line', {
                key: `${arrow.from}-${arrow.to}-${i}`,
                x1: fromCoords.x,
                y1: fromCoords.y,
                x2: toCoords.x,
                y2: toCoords.y,
                markerEnd: "url(#arrowhead)"
            });
        });
    }, [arrows, getSquareCenterCoords]);

    const renderedDrawingArrow = useMemo(() => {
        if (!drawingArrow || !boardAreaRef.current) return null;
        const fromCoords = getSquareCenterCoords(drawingArrow.fromSquare);
        if (!fromCoords) return null;

        // FIX: Replaced JSX with React.createElement.
        return React.createElement('line', {
            x1: fromCoords.x,
            y1: fromCoords.y,
            x2: drawingArrow.toCoords.x,
            y2: drawingArrow.toCoords.y,
            markerEnd: "url(#arrowhead)"
        });
    }, [drawingArrow, getSquareCenterCoords]);
    
    return {
        boardAreaRef,
        arrows: renderedArrows,
        drawingArrow: renderedDrawingArrow,
        handleBoardPointerDown,
        handleBoardPointerMove,
        handleBoardPointerUp
    };
};