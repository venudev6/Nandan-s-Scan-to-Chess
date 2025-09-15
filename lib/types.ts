/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import type { Square as ChessJSSquare, PieceSymbol as ChessJSPieceSymbol } from 'chess.js';

// This file defines the core TypeScript types used throughout the application for better code safety and clarity.

/**
 * Represents the user's role in the application.
 */
export type Role = 'user' | 'admin';

/**
 * Represents the activation status of a user's account.
 */
export type UserStatus = 'active' | 'pending';

/**
 * Represents a registered user.
 */
export interface User {
    id: number;
    email: string;
    role: Role;
    status: UserStatus;
    confirmationToken?: string; // Token used for email verification
}

/**
 * Represents the current view or screen of the application.
 * Used as a state machine in the main App component.
 */
export type AppState = 'initial' | 'camera' | 'screenCapture' | 'preview' | 'pdfViewer' | 'loading' | 'result' | 'solve' | 'error' | 'login' | 'register' | 'admin' | 'savedGames' | 'history';

/**
 * Represents the type of a chess piece (in lowercase).
 */
export type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

/**
 * Represents the color of a chess piece.
 */
export type PieceColor = 'w' | 'b';

/**
 * Represents a single piece on the board, with its type and color.
 */
export type BoardPiece = { type: PieceSymbol; color: PieceColor };

/**
 * Represents the entire state of the chessboard as an 8x8 2D array.
 * Each cell can either contain a BoardPiece or be null (empty).
 */
export type BoardState = (BoardPiece | null)[][];

/**
 * Represents the metadata of a PDF stored in IndexedDB, used for display on the initial screen.
 */
export type StoredPdf = { 
    id: number;       // The unique ID from the database.
    name: string;     // The original filename of the PDF.
    thumbnail?: string; // A base64 data URL for the first page's thumbnail.
    lastAccessed: number; // JS timestamp for sorting.
};

/**
 * Represents the full record of a PDF as stored in IndexedDB, including the file data itself.
 */
export interface StoredPdfRecord extends StoredPdf {
    data: File;          // The actual PDF file object.
    lastPage?: number;    // The last viewed page number to resume reading.
    lastZoom?: number;    // The last used zoom level.
}

/**
 * Represents a single entry in the move history on the Solve screen.
 */
export interface HistoryEntry {
    fen: string;          // The FEN string *after* this move was made.
    san: string | null;   // The Standard Algebraic Notation of the move (e.g., "Nf3").
    from: ChessJSSquare;  // The starting square of the move (e.g., "g1").
    to: ChessJSSquare;    // The ending square of the move (e.g., "f3").
    color: PieceColor;    // The color of the player who made the move.
    captured?: PieceSymbol; // The type of piece captured, if any.
}

/**
 * Represents a saved game session stored in IndexedDB.
 */
export interface StoredGame {
    id: number;
    initialFen: string;
    date: number; // JS timestamp
    thumbnail: string; // base64 data URL of board SVG
    moveHistory: HistoryEntry[];
}

/**
 * Represents the details returned by the AI model's analysis.
 */
export interface AnalysisDetails {
    confidence: number | null; // The AI's confidence in the scan (0.0 to 1.0).
    reasoning: string | null;  // The AI's reasoning for its confidence score.
    uncertainSquares?: string[]; // Squares the AI is unsure about, e.g., ['e4', 'd5']
}
