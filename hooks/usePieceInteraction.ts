/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { BoardState, BoardPiece } from '../lib/types';

type HeldPiece = {
    piece: BoardPiece;
    from: { row: number, col: number } | 'palette';
};

type UsePieceInteractionProps = {
    board: BoardState;
    onPieceDrop: (item: HeldPiece, to: { row: number, col: number } | null) => void;
};

/**
 * A custom hook to manage all pointer-based piece interactions for a board editor.
 * It handles state for the currently held piece, its "ghost" element position, and
 * the global pointer move/up listeners required for a smooth drag-and-drop experience.
 */
export const usePieceInteraction = ({ board, onPieceDrop }: UsePieceInteractionProps) => {
    const [heldPiece, setHeldPiece] = useState<HeldPiece | null>(null);
    const [ghostPosition, setGhostPosition] = useState<{ x: number; y: number } | null>(null);
    const pointerStartPos = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        if (!heldPiece) return;

        const handlePointerMove = (e: PointerEvent) => {
            if (!pointerStartPos.current) return;

            const movedDistance = Math.sqrt(
                Math.pow(e.clientX - pointerStartPos.current.x, 2) +
                Math.pow(e.clientY - pointerStartPos.current.y, 2)
            );

            if (movedDistance > 5 || ghostPosition) {
                setGhostPosition({ x: e.clientX, y: e.clientY });
            }
        };

        const handlePointerUp = (e: PointerEvent) => {
            const wasDragging = !!ghostPosition;

            if (wasDragging) {
                const ghostElement = document.getElementById('ghost-piece');
                if (ghostElement) ghostElement.style.display = 'none';
                const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
                if (ghostElement) ghostElement.style.display = '';

                const row = dropTarget?.getAttribute('data-row');
                const col = dropTarget?.getAttribute('data-col');
                const removeTarget = dropTarget?.closest('.remove-zone');

                if (removeTarget) {
                    onPieceDrop(heldPiece, null);
                } else if (row && col) {
                    onPieceDrop(heldPiece, { row: parseInt(row), col: parseInt(col) });
                }
            }

            pointerStartPos.current = null;
            setGhostPosition(null);
            
            if (wasDragging) {
                setHeldPiece(null);
            }
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp, { once: true });

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [heldPiece, ghostPosition, onPieceDrop]);
    
    const handlePiecePointerDown = useCallback((item: HeldPiece, e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        
        pointerStartPos.current = { x: e.clientX, y: e.clientY };
        setHeldPiece(item);
    }, []);

    const handleSquareClick = useCallback(({ row, col }: { row: number, col: number }) => {
        if (ghostPosition) return;

        if (heldPiece) {
            onPieceDrop(heldPiece, { row, col });
            setHeldPiece(null);
        } else {
            const pieceOnSquare = board[row][col];
            if (pieceOnSquare) {
                setHeldPiece({ piece: pieceOnSquare, from: { row, col } });
            }
        }
    }, [heldPiece, board, onPieceDrop, ghostPosition]);
    
    return {
        heldPiece,
        ghostPosition,
        handlePiecePointerDown,
        handleSquareClick,
    };
};
