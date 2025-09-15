/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect, useMemo } from 'react';
import { PIECE_VALUES } from '../lib/chessConstants';
import type { HistoryEntry, BoardPiece, PieceColor, PieceSymbol } from '../lib/types';

/**
 * A custom hook that calculates the captured pieces and material advantage
 * based on the provided game history.
 * @param history The array of moves made in the game.
 * @param historyIndex The index of the current move being viewed.
 * @returns An object containing lists of captured pieces and the material advantage for each side.
 */
export const useCapturedPieces = (history: HistoryEntry[], historyIndex: number) => {
    const [capturedWhitePieces, setCapturedWhitePieces] = useState<BoardPiece[]>([]);
    const [capturedBlackPieces, setCapturedBlackPieces] = useState<BoardPiece[]>([]);

    useEffect(() => {
        const newCapturedWhite: BoardPiece[] = [];
        const newCapturedBlack: BoardPiece[] = [];
        const sortFn = (a: BoardPiece, b: BoardPiece) => PIECE_VALUES[b.type] - PIECE_VALUES[a.type];

        // Iterate through the history up to the current move
        history.slice(0, historyIndex + 1).forEach(move => {
            if (move.captured) {
                const capturedColor: PieceColor = move.color === 'w' ? 'b' : 'w';
                const capturedPiece: BoardPiece = { type: move.captured as PieceSymbol, color: capturedColor };
                if (capturedColor === 'w') {
                    newCapturedWhite.push(capturedPiece);
                } else {
                    newCapturedBlack.push(capturedPiece);
                }
            }
        });
        
        // Sort pieces by value for a conventional display
        newCapturedWhite.sort(sortFn);
        newCapturedBlack.sort(sortFn);

        setCapturedWhitePieces(newCapturedWhite);
        setCapturedBlackPieces(newCapturedBlack);
    }, [history, historyIndex]);

    const materialAdvantage = useMemo(() => {
        const whiteScore = capturedBlackPieces.reduce((sum, piece) => sum + PIECE_VALUES[piece.type], 0);
        const blackScore = capturedWhitePieces.reduce((sum, piece) => sum + PIECE_VALUES[piece.type], 0);
        return {
            whiteAdvantage: whiteScore > blackScore ? whiteScore - blackScore : 0,
            blackAdvantage: blackScore > whiteScore ? blackScore - whiteScore : 0,
        };
    }, [capturedWhitePieces, capturedBlackPieces]);

    return { capturedWhitePieces, capturedBlackPieces, materialAdvantage };
};
