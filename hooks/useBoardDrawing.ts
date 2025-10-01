/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useCallback, useRef, useMemo } from 'react';
import type { Square as ChessJSSquare } from 'chess.js';
import { FILES, RANKS } from '../lib/chessConstants';

type Arrow = { from: ChessJSSquare; to: ChessJSSquare };

/**
 * A custom hook to manage drawing arrows on the chessboard.
 * It encapsulates the state for arrows, the current drawing state,
 * and all the pointer event handlers required for the drawing interaction.
 */
export const useBoardDrawing = (isFlipped = false, onSquareRightClick?: (square: ChessJSSquare) => void) => {
    const [arrows, setArrows] = useState<Arrow[]>([]);
    const drawingStartSquareRef = useRef<ChessJSSquare | null>(null);
    const pointerStartPos = useRef<{ x: number; y: number } | null>(null);
    const isDrawingRef = useRef(false);
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
           drawingStartSquareRef.current = fromSquare;
           pointerStartPos.current = { x: e.clientX, y: e.clientY };
           isDrawingRef.current = false;
        }
    }, [getSquareFromMouseEvent]);

    const handleBoardPointerMove = useCallback((e: React.PointerEvent) => {
        if (!drawingStartSquareRef.current || !pointerStartPos.current) return;
        
        e.preventDefault();

        const movedDistance = Math.sqrt(
            Math.pow(e.clientX - pointerStartPos.current.x, 2) +
            Math.pow(e.clientY - pointerStartPos.current.y, 2)
        );

        if (movedDistance > 5) {
            isDrawingRef.current = true;
        }
    }, []);

    const handleBoardPointerUp = useCallback((e: React.PointerEvent) => {
        if (e.button !== 2 || !drawingStartSquareRef.current) return;
        e.preventDefault();

        const toSquare = getSquareFromMouseEvent(e);
        const fromSquare = drawingStartSquareRef.current;
        
        if (isDrawingRef.current) {
            // It was a drag, draw an arrow
            if (toSquare && toSquare !== fromSquare) {
                setArrows(prev => [...prev, { from: fromSquare, to: toSquare }]);
            }
        } else {
            // It was a click, highlight the square
            onSquareRightClick?.(fromSquare);
        }
        
        // Reset
        drawingStartSquareRef.current = null;
        pointerStartPos.current = null;
        isDrawingRef.current = false;
    }, [getSquareFromMouseEvent, onSquareRightClick]);
    
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
    
    return {
        boardAreaRef,
        renderedArrows,
        setArrows,
        handleBoardPointerDown,
        handleBoardPointerMove,
        handleBoardPointerUp
    };
};