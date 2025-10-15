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
    name?: string;
    about?: string;
    photoUrl?: string;
    confirmationToken?: string; // Token used for email verification
    pinHash?: string | null; // Store a hash of the 4-digit PIN
    pinResetToken?: string | null;
    pinResetExpires?: number | null;
}

/**
 * Represents the current view or screen of the application.
 * Used as a state machine in the main App component.
 */
export type AppState = 'initial' | 'camera' | 'screenCapture' | 'preview' | 'pdfViewer' | 'loading' | 'result' | 'solve' | 'error' | 'login' | 'register' | 'admin' | 'savedGames' | 'history' | 'profile';

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
    driveId?: string; // ID of the file in Google Drive
    syncStatus?: 'local' | 'syncing' | 'synced' | 'error'; // Sync status with Google Drive
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
    // FIX: Add optional 'promotion' property to support promotion moves.
    promotion?: PieceSymbol;
}

/**
 * Represents a saved game session stored in IndexedDB.
 */
export interface StoredGame {
    id: number;
    name: string;
    folder: string;
    initialFen: string;
    date: number; // JS timestamp
    thumbnail: string; // base64 data URL of board SVG
    moveHistory: HistoryEntry[];
}

/**
 * Represents the details from local post-processing of the AI result.
 */
export interface PostProcessDetails {
  orientationCorrected: boolean;
  autoFixes: { message: string, type: 'fix' | 'warning' }[];
  minimumConfidence: number | null;
  orientationScore: number | null;
}

/**
 * Represents the details returned by the AI model's analysis.
 */
export interface AnalysisDetails {
    confidence: number | null; // The AI's average confidence in the scan (0.0 to 1.0).
    reasoning: string | null;  // The AI's reasoning for its confidence score.
    uncertainSquares?: string[]; // Squares the AI is unsure about, e.g., ['e4', 'd5']
    postProcess?: PostProcessDetails;
    meta?: {
      boardHash?: string;
    };
    timingSummary?: {
        image_hashing_ms?: number;
        board_detection_ms?: number;
        perspective_warp_ms?: number;
        tile_slicing_ms?: number;
        gemini_classification_ms: number;
        post_processing_ms: number;
        total_scan_ms: number;
    };
    failureReason?: string;
    tokenUsage?: {
      totalTokens: number;
    };
    costEstimateINR?: number;
    geminiScans?: { square: string, piece: string, confidence: number }[];
}

/**
 * Represents a bounding box for a detected puzzle on a PDF page.
 * Values are percentages of the page dimensions.
 */
export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Represents the record of all puzzles found on a single page of a PDF, as stored in IndexedDB.
 */
export interface StoredPdfPuzzles {
    pdfId: number;
    page: number;
    boundingBoxes: BoundingBox[];
}


// --- Client-Side Vision Pipeline Types ---

export interface VisionPipelineInput {
  image: string; // base64 or url
  source_type: "pdf_raster" | "pdf_vector" | "photo";
  onProgress: (message: string) => void;
  confidence_threshold?: number;
}

export interface TileInfo {
    square: string;
    class: string; // e.g., 'wP', 'bN', 'empty'
    confidence: number;
}

export interface Timings {
    end_to_end: number;
    detect_and_warp: number;
    classify_tiles: number;
}

export interface VisionResult {
    homography: number[];
    warped_image_b64: string;
    tiles: TileInfo[];
    fen: string;
    validator: { violations: string[] };
    timings: Timings;
}

/**
 * Represents the JSON structure returned by the Gemini board feature detection step.
 */
export interface BoardFeatures {
  corners: {
    top_left: [number, number];
    top_right: [number, number];
    bottom_right: [number, number];
    bottom_left: [number, number];
  };
  homography: number[][];
  boundary_confidence: number;
  active_turn: 'w' | 'b' | null;
  turn_confidence: number;
  labels: {
    type: "file" | "rank";
    label: string;
    x: number;
    y: number;
    confidence: number;
  }[];
  reference_map: {
    a1_corner: "bottom_left" | "bottom_right" | "top_left" | "top_right";
    h1_corner: string;
    a8_corner: string;
    h8_corner: string;
  } | null;
  reference_confidence: number;
  auto_detect: boolean;
  notes: string;
}