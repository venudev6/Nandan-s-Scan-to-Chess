/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import type { PieceColor, PieceSymbol } from './types';
import {
    WhitePawn, WhiteKnight, WhiteBishop, WhiteRook, WhiteQueen, WhiteKing,
    BlackPawn, BlackKnight, BlackBishop, BlackRook, BlackQueen, BlackKing,
} from '../components/ui/PieceIcons';

// This file contains static constants for chess-related logic and rendering.

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export const PIECE_NAMES: { [key in PieceSymbol]: string } = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };

export const PIECE_VALUES: { [key in PieceSymbol]: number } = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

export const STANDARD_PIECE_COUNT: { [key in PieceSymbol]: number } = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };

export const PIECE_COMPONENTS: { [key in PieceColor]: { [key in PieceSymbol]: (props: React.SVGProps<SVGSVGElement>) => JSX.Element } } = {
    w: { p: WhitePawn, r: WhiteRook, n: WhiteKnight, b: WhiteBishop, q: WhiteQueen, k: WhiteKing },
    b: { p: BlackPawn, r: BlackRook, n: BlackKnight, b: BlackBishop, q: BlackQueen, k: BlackKing },
};

export const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
