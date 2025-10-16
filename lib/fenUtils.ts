/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Chess } from 'chess.js';
import type { BoardState, PieceColor, PieceSymbol } from './types';
import { FILES, RANKS } from './chessConstants';

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
  // This part of the FEN is often incomplete from manual setup. 
  // We'll let `completeFen` handle the castling/move counters intelligently.
  fen += ` ${turn} - - 0 1`;
  return fen;
};

/**
 * Ensures a FEN string has all 6 required parts, adding default values if they are missing.
 * It also intelligently infers castling rights if they are not provided.
 * @param fen The potentially incomplete FEN string.
 * @param turn The default turn color if not specified in the FEN.
 * @returns A complete, 6-part FEN string.
 */
export const completeFen = (fen: string, turn: PieceColor = 'w'): string => {
    const parts = fen.trim().split(/\s+/);
    if (parts.length >= 6) return fen;
    const pieceData = parts[0] || '';
    const activeTurn = (parts[1] === 'w' || parts[1] === 'b') ? parts[1] : turn;
    
    let castling = parts[2] || '-';
    // If castling rights are not specified, try to infer them from piece positions.
    // This assumes that if the king/rooks are in their starting positions, they haven't moved.
    if (castling === '-') {
        let newCastling = '';
        try {
            const tempBoard = new Chess(pieceData + ' w - - 0 1'); // Load just the pieces
            if (tempBoard.get('e1')?.type === 'k' && tempBoard.get('e1')?.color === 'w') {
                if (tempBoard.get('h1')?.type === 'r' && tempBoard.get('h1')?.color === 'w') newCastling += 'K';
                if (tempBoard.get('a1')?.type === 'r' && tempBoard.get('a1')?.color === 'w') newCastling += 'Q';
            }
            if (tempBoard.get('e8')?.type === 'k' && tempBoard.get('e8')?.color === 'b') {
                if (tempBoard.get('h8')?.type === 'r' && tempBoard.get('h8')?.color === 'b') newCastling += 'k';
                if (tempBoard.get('a8')?.type === 'r' && tempBoard.get('a8')?.color === 'b') newCastling += 'q';
            }
            castling = newCastling || '-';
        } catch(e) {
            console.warn("Could not parse board state to determine castling rights, defaulting to '-'.", e);
            castling = '-';
        }
    }

    const enpassant = parts[3] || '-';
    const halfmove = parts[4] || '0';
    const fullmove = parts[5] || '1';
    return `${pieceData} ${activeTurn} ${castling} ${enpassant} ${halfmove} ${fullmove}`;
};

/**
 * Attempts to validate and fix common errors in a FEN string returned by the AI.
 * @param fen The potentially invalid FEN string.
 * @returns An object containing the (potentially fixed) FEN, a boolean indicating if it was fixed,
 *          and an array of messages describing the fixes.
 */
const validateAndFixFen = (fen: string): { fen: string, fixed: boolean, messages: string[] } => {
    const parts = fen.split(' ');
    let boardFen = parts[0];
    let wasFixed = false;
    const messages: string[] = [];

    if (!boardFen || !boardFen.includes('/') || boardFen.length < 15) {
        boardFen = '8/8/8/8/8/8/8/8';
        wasFixed = true;
        messages.push('Board data was invalid; reset to an empty board.');
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

        while (pieces.length < 8) pieces.push(null);
        if (pieces.length > 8) pieces = pieces.slice(0, 8);

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
        if (pieceCounts(boardFen, 'Q') > 1) { boardFen = boardFen.replace('Q', 'K'); messages.push("Missing white king was replaced by an extra queen."); }
        else if (pieceCounts(boardFen, 'Q') > 0) { boardFen = boardFen.replace('Q', 'K'); messages.push("Missing white king was replaced by a queen."); }
    }

    if (pieceCounts(boardFen, 'k') === 0) {
        wasFixed = true;
        if (pieceCounts(boardFen, 'q') > 1) { boardFen = boardFen.replace('q', 'k'); messages.push("Missing black king was replaced by an extra queen."); }
        else if (pieceCounts(boardFen, 'q') > 0) { boardFen = boardFen.replace('q', 'k'); messages.push("Missing black king was replaced by a queen."); }
    }
    
    parts[0] = boardFen;
    return { fen: parts.join(' '), fixed: wasFixed, messages };
};

/**
 * Converts a FEN string into the application's internal BoardState (2D array).
 * @param fen The FEN string to convert.
 * @returns An object containing the BoardState, the current turn, and an optional correction message.
 */
export const fenToBoardState = (fen: string): { board: BoardState; turn: PieceColor; correctedFenMessages?: string[] } => {
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
            const { fen: fixedFen, fixed, messages } = validateAndFixFen(fen);
            if (fixed) {
                const { board, turn } = attemptLoad(fixedFen);
                console.log("Successfully fixed FEN:", fixedFen);
                return { board, turn, correctedFenMessages: messages };
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
      if (piece === null || piece === "" || piece === '1') {
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

const TILE_PIECE_TO_FEN_CHAR: { [key: string]: string } = {
    'wK': 'K', 'wQ': 'Q', 'wR': 'R', 'wB': 'B', 'wN': 'N', 'wP': 'P',
    'bK': 'k', 'bQ': 'q', 'bR': 'r', 'bB': 'b', 'bN': 'n', 'bP': 'p',
    'empty': '1'
};

/**
 * Converts a tile array from the Gemini response into a FEN string's piece placement part.
 * @param tiles The array of tile objects from the analysis.
 * @returns The FEN piece placement string (e.g., "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR").
 */
export const tilesToFen = (tiles: { square: string, piece: string }[]): string => {
    const board: (string | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
    
    for (const tile of tiles) {
        if (tile.square && tile.square.length === 2) {
            const file = tile.square[0];
            const rank = parseInt(tile.square[1], 10);
            const colIndex = FILES.indexOf(file);
            const rowIndex = 8 - rank;

            if (colIndex !== -1 && rowIndex >= 0 && rowIndex < 8) {
                board[rowIndex][colIndex] = TILE_PIECE_TO_FEN_CHAR[tile.piece] || '1';
            }
        }
    }
    // Re-use the arrayToFen logic, as it correctly handles compressing empty squares.
    return arrayToFen(board);
};

/**
 * Flips a square's notation 180 degrees. (e.g., 'a8' -> 'h1').
 * @param square The algebraic notation of the square.
 * @returns The flipped algebraic notation.
 */
export const flipSquare = (square: string): string => {
    const file = square.charAt(0);
    const rank = square.charAt(1);
    const fileIndex = FILES.indexOf(file);
    const rankIndex = RANKS.indexOf(rank);
    if (fileIndex === -1 || rankIndex === -1) {
        return square; // Should not happen with valid input
    }
    return `${FILES[7 - fileIndex]}${RANKS[7 - rankIndex]}`;
};

/**
 * Gets the algebraic notation of all surrounding squares for a given square.
 * @param square The algebraic notation of the central square.
 * @returns An array of strings with the neighbor square notations.
 */
export const getNeighbors = (square: string): string[] => {
    const neighbors: string[] = [];
    const file = square.charAt(0);
    const rank = parseInt(square.charAt(1), 10);
    const fileIndex = FILES.indexOf(file);

    if (fileIndex === -1 || isNaN(rank)) {
        return []; // Invalid square
    }

    for (let r_offset = -1; r_offset <= 1; r_offset++) {
        for (let f_offset = -1; f_offset <= 1; f_offset++) {
            if (r_offset === 0 && f_offset === 0) continue;
            
            const newRank = rank + r_offset;
            const newFileIndex = fileIndex + f_offset;

            if (newRank >= 1 && newRank <= 8 && newFileIndex >= 0 && newFileIndex < 8) {
                neighbors.push(`${FILES[newFileIndex]}${newRank}`);
            }
        }
    }
    return neighbors;
};


/**
 * Compares two board states and returns a list of squares where they differ.
 * @param fen1 The first FEN string.
 * @param fen2 The second FEN string.
 * @returns An array of algebraic square notations (e.g., ['e4', 'd5']) that are different.
 */
export const compareFens = (fen1: string, fen2: string): string[] => {
    const mismatches: string[] = [];
    try {
        const board1 = fenToBoardState(fen1).board;
        const board2 = fenToBoardState(fen2).board;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p1 = board1[r][c];
                const p2 = board2[r][c];
                
                const piece1Str = p1 ? `${p1.color}${p1.type}` : null;
                const piece2Str = p2 ? `${p2.color}${p2.type}` : null;

                if (piece1Str !== piece2Str) {
                    const square = `${FILES[c]}${RANKS[7-r]}`;
                    mismatches.push(square);
                }
            }
        }
        // Also compare turns
        const turn1 = fen1.split(' ')[1];
        const turn2 = fen2.split(' ')[1];
        if (turn1 !== turn2) {
            // How to signify turn mismatch? For now, we only highlight squares.
            // This could be added to a more detailed diff result in the future.
        }

    } catch (e) {
        console.error("Could not compare FENs due to parsing error:", e);
    }
    return mismatches;
};