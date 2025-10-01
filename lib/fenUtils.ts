/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Chess } from 'chess.js';
import type { BoardState, PieceColor, PieceSymbol } from './types';

/**
 * Converts the application's internal board state (a 2D array) into a FEN string.
 * @param board The 8x8 BoardState array.
 * @param turn The color of the player whose turn it is to move ('w' or 'b').
 * @returns A FEN string representing the position.
 */
export const boardStateToFen = (board: BoardState, turn: PieceColor): string => {
  let fen = '';
  for (let i = 0; i < 8; i++) {
    let empty = 0;
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece === null) {
        empty++;
      } else {
        if (empty > 0) {
          fen += empty;
          empty = 0;
        }
        fen += piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase();
      }
    }
    if (empty > 0) {
      fen += empty;
    }
    if (i < 7) {
      fen += '/';
    }
  }
  fen += ` ${turn} - - 0 1`;
  return fen;
};

/**
 * Ensures a FEN string has all 6 required parts, adding default values if they are missing.
 * @param fen The potentially incomplete FEN string.
 * @param turn The default turn color if not specified in the FEN.
 * @returns A complete, 6-part FEN string.
 */
export const completeFen = (fen: string, turn: PieceColor = 'w'): string => {
    const parts = fen.trim().split(/\s+/);
    if (parts.length >= 6) return fen;
    const pieceData = parts[0] || '';
    const activeTurn = (parts[1] === 'w' || parts[1] === 'b') ? parts[1] : turn;
    const castling = parts[2] || '-';
    const enpassant = parts[3] || '-';
    const halfmove = parts[4] || '0';
    const fullmove = parts[5] || '1';
    return `${pieceData} ${activeTurn} ${castling} ${enpassant} ${halfmove} ${fullmove}`;
};

/**
 * Attempts to validate and fix common errors in a FEN string returned by the AI.
 * @param fen The potentially invalid FEN string.
 * @returns An object containing the (potentially fixed) FEN, a boolean indicating if it was fixed,
 *          and a message describing the fixes.
 */
const validateAndFixFen = (fen: string): { fen: string, fixed: boolean, message?: string } => {
    const parts = fen.split(' ');
    let boardFen = parts[0];
    let wasFixed = false;
    const messages: string[] = [];

    if (!boardFen || !boardFen.includes('/') || boardFen.length < 15) {
        boardFen = '8/8/8/8/8/8/8/8';
        wasFixed = true;
        messages.push('Board data was invalid and was reset to an empty board.');
    }

    let ranks = boardFen.split('/');
    
    // Ensure there are exactly 8 ranks.
    if (ranks.length < 8) {
        wasFixed = true;
        messages.push(`FEN had only ${ranks.length} ranks; missing ranks were added as empty.`);
        while (ranks.length < 8) {
            ranks.push('8');
        }
    } else if (ranks.length > 8) {
        wasFixed = true;
        messages.push(`FEN had ${ranks.length} ranks; extra ranks were removed.`);
        ranks = ranks.slice(0, 8);
    }
    
    const fixedRanks = ranks.map((rank, i) => {
        let pieces: (string | null)[] = [];
        for (const char of rank) {
            const num = parseInt(char, 10);
            if (!isNaN(num) && num >= 1 && num <= 8) {
                for (let k = 0; k < num; k++) {
                    pieces.push(null);
                }
            } else {
                pieces.push(char);
            }
        }

        if (pieces.length === 8) {
             // Even if the count is 8, the original string might be invalid (e.g. 'r11b4').
             // Reconstructing it ensures it's always valid.
             let hasConsecutiveNumbers = false;
             for(let j = 0; j < rank.length - 1; j++) {
                if(!isNaN(parseInt(rank[j], 10)) && !isNaN(parseInt(rank[j+1], 10))) {
                    hasConsecutiveNumbers = true;
                    break;
                }
             }
             if (!hasConsecutiveNumbers) return rank;
        }

        wasFixed = true;
        messages.push(`Rank ${8 - i} was invalid (had ${pieces.length} squares) and has been corrected.`);

        // Truncate or pad the pieces array
        while (pieces.length < 8) pieces.push(null);
        if (pieces.length > 8) pieces = pieces.slice(0, 8);

        // Reconstruct the rank string from the pieces array
        let newRank = '';
        let emptyCounter = 0;
        for (const p of pieces) {
            if (p === null) {
                emptyCounter++;
            } else {
                if (emptyCounter > 0) {
                    newRank += emptyCounter;
                    emptyCounter = 0;
                }
                newRank += p;
            }
        }
        if (emptyCounter > 0) {
            newRank += emptyCounter;
        }
        return newRank;
    });
    boardFen = fixedRanks.join('/');

    const pieceCounts = (board: string, piece: string) => (board.match(new RegExp(piece, 'g')) || []).length;

    if (pieceCounts(boardFen, 'K') === 0) {
        wasFixed = true;
        if (pieceCounts(boardFen, 'Q') > 1) { boardFen = boardFen.replace('Q', 'K'); messages.push("missing white king was replaced by an extra queen"); }
        else if (pieceCounts(boardFen, 'Q') > 0) { boardFen = boardFen.replace('Q', 'K'); messages.push("missing white king was replaced by a queen"); }
    }

    if (pieceCounts(boardFen, 'k') === 0) {
        wasFixed = true;
        if (pieceCounts(boardFen, 'q') > 1) { boardFen = boardFen.replace('q', 'k'); messages.push("missing black king was replaced by an extra queen"); }
        else if (pieceCounts(boardFen, 'q') > 0) { boardFen = boardFen.replace('q', 'k'); messages.push("missing black king was replaced by a queen"); }
    }
    
    parts[0] = boardFen;
    return { fen: parts.join(' '), fixed: wasFixed, message: messages.join(', ') };
};

/**
 * Converts a FEN string into the application's internal BoardState (2D array).
 * @param fen The FEN string to convert.
 * @returns An object containing the BoardState, the current turn, and an optional correction message.
 */
export const fenToBoardState = (fen: string): { board: BoardState; turn: PieceColor; correctedFen?: string } => {
    const attemptLoad = (fenToLoad: string) => {
        const chess = new Chess(fenToLoad);
        const board: BoardState = Array(8).fill(null).map(() => Array(8).fill(null));
        chess.board().forEach((row, rowIndex) => {
            row.forEach((piece, colIndex) => {
                if (piece) {
                    board[rowIndex][colIndex] = { type: piece.type as PieceSymbol, color: piece.color as PieceColor };
                }
            });
        });
        return { board, turn: chess.turn() as PieceColor };
    };

    try {
        new Chess(fen); // Validate FEN
        const { board, turn } = attemptLoad(fen);
        return { board, turn };
    } catch (e) {
        console.warn("Initial FEN invalid, attempting to fix:", fen, e);
        try {
            const { fen: fixedFen, fixed, message } = validateAndFixFen(fen);
            if (fixed) {
                const { board, turn } = attemptLoad(fixedFen);
                console.log("Successfully fixed FEN:", fixedFen);
                return { board, turn, correctedFen: message || "Position auto-corrected." };
            }
        } catch (e2) {
             console.error("Fixing FEN also failed:", fen, e2);
             throw e2;
        }
        throw e;
    }
};

/**
 * Converts an 8x8 array of piece characters into the piece placement part of a FEN string.
 * @param board The 8x8 array, where inner arrays are ranks 8 through 1.
 *              Uses standard piece characters ('P', 'n', etc.) and an empty string for empty squares.
 * @returns The FEN piece placement string (e.g., "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR").
 */
export const arrayToFen = (board: (string | null)[][]): string => {
  return board.map(row => {
    if (!row || !Array.isArray(row) || row.length !== 8) {
      console.error(`Invalid board array format for rank:`, row);
      return '8';
    }
    let empty = 0;
    let rankFen = '';
    for (const piece of row) {
      if (piece === null || piece === "") {
        empty++;
      } else {
        if (empty > 0) {
          rankFen += empty;
          empty = 0;
        }
        rankFen += piece;
      }
    }
    if (empty > 0) {
      rankFen += empty;
    }
    return rankFen;
  }).join('/');
};