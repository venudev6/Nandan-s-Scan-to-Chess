/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import type { PieceColor, PieceSymbol } from './types';
import {
    MeridaWhitePawn, MeridaWhiteKnight, MeridaWhiteBishop, MeridaWhiteRook, MeridaWhiteQueen, MeridaWhiteKing,
    MeridaBlackPawn, MeridaBlackKnight, MeridaBlackBishop, MeridaBlackRook, MeridaBlackQueen, MeridaBlackKing
} from '../components/ui/piece-sets/Merida';
import {
    CalienteWhitePawn, CalienteWhiteKnight, CalienteWhiteBishop, CalienteWhiteRook, CalienteWhiteQueen, CalienteWhiteKing,
    CalienteBlackPawn, CalienteBlackKnight, CalienteBlackBishop, CalienteBlackRook, CalienteBlackQueen, CalienteBlackKing
} from '../components/ui/piece-sets/Caliente';
import {
    MaestroWhitePawn, MaestroWhiteKnight, MaestroWhiteBishop, MaestroWhiteRook, MaestroWhiteQueen, MaestroWhiteKing,
    MaestroBlackPawn, MaestroBlackKnight, MaestroBlackBishop, MaestroBlackRook, MaestroBlackQueen, MaestroBlackKing
} from '../components/ui/piece-sets/Maestro';
import {
    GovernorWhitePawn, GovernorWhiteKnight, GovernorWhiteBishop, GovernorWhiteRook, GovernorWhiteQueen, GovernorWhiteKing,
    GovernorBlackPawn, GovernorBlackKnight, GovernorBlackBishop, GovernorBlackRook, GovernorBlackQueen, GovernorBlackKing
} from '../components/ui/piece-sets/Governor';
import {
    IcpiecesWhitePawn, IcpiecesWhiteKnight, IcpiecesWhiteBishop, IcpiecesWhiteRook, IcpiecesWhiteQueen, IcpiecesWhiteKing,
    IcpiecesBlackPawn, IcpiecesBlackKnight, IcpiecesBlackBishop, IcpiecesBlackRook, IcpiecesBlackQueen, IcpiecesBlackKing
} from '../components/ui/piece-sets/Icpieces';
// FIX: Correctly import all piece set components.
import {
    MonarchyWhitePawn, MonarchyWhiteKnight, MonarchyWhiteBishop, MonarchyWhiteRook, MonarchyWhiteQueen, MonarchyWhiteKing,
    MonarchyBlackPawn, MonarchyBlackKnight, MonarchyBlackBishop, MonarchyBlackRook, MonarchyBlackQueen, MonarchyBlackKing
} from '../components/ui/piece-sets/Monarchy';
import {
    PirouettiWhitePawn, PirouettiWhiteKnight, PirouettiWhiteBishop, PirouettiWhiteRook, PirouettiWhiteQueen, PirouettiWhiteKing,
    PirouettiBlackPawn, PirouettiBlackKnight, PirouettiBlackBishop, PirouettiBlackRook, PirouettiBlackQueen, PirouettiBlackKing
} from '../components/ui/piece-sets/Pirouetti';
import {
    RhosgfxWhitePawn, RhosgfxWhiteKnight, RhosgfxWhiteBishop, RhosgfxWhiteRook, RhosgfxWhiteQueen, RhosgfxWhiteKing,
    RhosgfxBlackPawn, RhosgfxBlackKnight, RhosgfxBlackBishop, RhosgfxBlackRook, RhosgfxBlackQueen, RhosgfxBlackKing
} from '../components/ui/piece-sets/Rhosgfx';
import {
    StauntyWhitePawn, StauntyWhiteKnight, StauntyWhiteBishop, StauntyWhiteRook, StauntyWhiteQueen, StauntyWhiteKing,
    StauntyBlackPawn, StauntyBlackKnight, StauntyBlackBishop, StauntyBlackRook, StauntyBlackQueen, StauntyBlackKing
} from '../components/ui/piece-sets/Staunty';
import {
    TatianaWhitePawn, TatianaWhiteKnight, TatianaWhiteBishop, TatianaWhiteRook, TatianaWhiteQueen, TatianaWhiteKing,
    TatianaBlackPawn, TatianaBlackKnight, TatianaBlackBishop, TatianaBlackRook, TatianaBlackQueen, TatianaBlackKing
} from '../components/ui/piece-sets/Tatiana';


// This file contains static constants for chess-related logic and rendering.

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export const PIECE_NAMES: { [key in PieceSymbol]: string } = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };

export const PIECE_VALUES: { [key in PieceSymbol]: number } = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

export const STANDARD_PIECE_COUNT: { [key in PieceSymbol]: number } = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };

type PieceComponentSet = { [key in PieceColor]: { [key in PieceSymbol]: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement } };

export const PIECE_SETS = {
    merida: {
        w: { p: MeridaWhitePawn, r: MeridaWhiteRook, n: MeridaWhiteKnight, b: MeridaWhiteBishop, q: MeridaWhiteQueen, k: MeridaWhiteKing },
        b: { p: MeridaBlackPawn, r: MeridaBlackRook, n: MeridaBlackKnight, b: MeridaBlackBishop, q: MeridaBlackQueen, k: MeridaBlackKing },
    },
    caliente: {
        w: { p: CalienteWhitePawn, r: CalienteWhiteRook, n: CalienteWhiteKnight, b: CalienteWhiteBishop, q: CalienteWhiteQueen, k: CalienteWhiteKing },
        b: { p: CalienteBlackPawn, r: CalienteBlackRook, n: CalienteBlackKnight, b: CalienteBlackBishop, q: CalienteBlackQueen, k: CalienteBlackKing },
    },
    maestro: {
        w: { p: MaestroWhitePawn, r: MaestroWhiteRook, n: MaestroWhiteKnight, b: MaestroWhiteBishop, q: MaestroWhiteQueen, k: MaestroWhiteKing },
        b: { p: MaestroBlackPawn, r: MaestroBlackRook, n: MaestroBlackKnight, b: MaestroBlackBishop, q: MaestroBlackQueen, k: MaestroBlackKing },
    },
    governor: {
        w: { p: GovernorWhitePawn, r: GovernorWhiteRook, n: GovernorWhiteKnight, b: GovernorWhiteBishop, q: GovernorWhiteQueen, k: GovernorWhiteKing },
        b: { p: GovernorBlackPawn, r: GovernorBlackRook, n: GovernorBlackKnight, b: GovernorBlackBishop, q: GovernorBlackQueen, k: GovernorBlackKing },
    },
    icpieces: {
        w: { p: IcpiecesWhitePawn, r: IcpiecesWhiteRook, n: IcpiecesWhiteKnight, b: IcpiecesWhiteBishop, q: IcpiecesWhiteQueen, k: IcpiecesWhiteKing },
        b: { p: IcpiecesBlackPawn, r: IcpiecesBlackRook, n: IcpiecesBlackKnight, b: IcpiecesBlackBishop, q: IcpiecesBlackQueen, k: IcpiecesBlackKing },
    },
    monarchy: {
        w: { p: MonarchyWhitePawn, r: MonarchyWhiteRook, n: MonarchyWhiteKnight, b: MonarchyWhiteBishop, q: MonarchyWhiteQueen, k: MonarchyWhiteKing },
        b: { p: MonarchyBlackPawn, r: MonarchyBlackRook, n: MonarchyBlackKnight, b: MonarchyBlackBishop, q: MonarchyBlackQueen, k: MonarchyBlackKing },
    },
    pirouetti: {
        w: { p: PirouettiWhitePawn, r: PirouettiWhiteRook, n: PirouettiWhiteKnight, b: PirouettiWhiteBishop, q: PirouettiWhiteQueen, k: PirouettiWhiteKing },
        b: { p: PirouettiBlackPawn, r: PirouettiBlackRook, n: PirouettiBlackKnight, b: PirouettiBlackBishop, q: PirouettiBlackQueen, k: PirouettiBlackKing },
    },
    rhosgfx: {
        w: { p: RhosgfxWhitePawn, r: RhosgfxWhiteRook, n: RhosgfxWhiteKnight, b: RhosgfxWhiteBishop, q: RhosgfxWhiteQueen, k: RhosgfxWhiteKing },
        b: { p: RhosgfxBlackPawn, r: RhosgfxBlackRook, n: RhosgfxBlackKnight, b: RhosgfxBlackBishop, q: RhosgfxBlackQueen, k: RhosgfxBlackKing },
    },
    staunty: {
        w: { p: StauntyWhitePawn, r: StauntyWhiteRook, n: StauntyWhiteKnight, b: StauntyWhiteBishop, q: StauntyWhiteQueen, k: StauntyWhiteKing },
        b: { p: StauntyBlackPawn, r: StauntyBlackRook, n: StauntyBlackKnight, b: StauntyBlackBishop, q: StauntyBlackQueen, k: StauntyBlackKing },
    },
    tatiana: {
        w: { p: TatianaWhitePawn, r: TatianaWhiteRook, n: TatianaWhiteKnight, b: TatianaWhiteBishop, q: TatianaWhiteQueen, k: TatianaWhiteKing },
        b: { p: TatianaBlackPawn, r: TatianaBlackRook, n: TatianaBlackKnight, b: TatianaBlackBishop, q: TatianaBlackQueen, k: TatianaBlackKing },
    }
} as const;

export const PIECE_SET_NAMES = Object.keys(PIECE_SETS);

export type PieceTheme = keyof typeof PIECE_SETS;

export const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";