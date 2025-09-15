/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

// This file contains the standard "Merida" chess piece SVG set from Wikimedia Commons.
// Source: https://commons.wikimedia.org/wiki/Category:SVG_chess_pieces_(Merida)
// This set uses clean, solid shapes which are excellent for clear visuals and reliable event handling.

type PieceProps = React.SVGProps<SVGSVGElement>;

// --- WHITE PIECES ---

export const WhitePawn = (props: PieceProps) => (
<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg" {...props}>
  <g
    fill="#fff"
    fillRule="nonzero"
    stroke="#000"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="miter"
    strokeMiterlimit={4}
    strokeDasharray="none"
    strokeOpacity={1}
  >
    <path d="m22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03C15.41 27.09 11 31.58 11 39.5h23c0-7.92-4.41-12.41-7.41-13.47C28.06 24.84 29 23.03 29 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" />
  </g>
</svg>

);

export const WhiteKnight = (props: PieceProps) => (
<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg" {...props}>
  <g
    fill="none"
    fillRule="evenodd"
    stroke="#000"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeMiterlimit={4}
    strokeDasharray="none"
    strokeOpacity={1}
    transform="translate(0,0.3)"
  >
    <path
      d="M22 10 C32.5 11 38.5 18 38 39 L15 39 C15 30 25 32.5 23 18"
      fill="#fff"
      stroke="#000"
    />
    <path
      d="M24 18 C24.38 20.91 18.45 25.37 16 27 C13 29 13.18 31.34 11 31 C9.958 30.06 12.41 27.96 11 28 C10 28 11.19 29.23 10 30 C9 30 5.997 31 6 26 C6 24 12 14 12 14 C12 14 13.89 12.1 14 10.5 C13.27 9.506 13.5 8.5 13.5 7.5 C14.5 6.5 16.5 10 16.5 10 L18.5 10 C18.5 10 19.28 8.008 21 7 C22 7 22 10 22 10"
      fill="#fff"
      stroke="#000"
    />
    <path
      d="M9.5 25.5 A0.5 0.5 0 1 1 8.5 25.5 A0.5 0.5 0 1 1 9.5 25.5 z"
      fill="#000"
      stroke="#000"
    />
    <path
      d="M15 15.5 A0.5 1.5 0 1 1 14 15.5 A0.5 1.5 0 1 1 15 15.5 z"
      transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)"
      fill="#000"
      stroke="#000"
    />
  </g>
</svg>

);

export const WhiteBishop = (props: PieceProps) => (
<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg" {...props}>
  <g
    fill="none"
    fillRule="evenodd"
    stroke="#000"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeMiterlimit={4}
    strokeDasharray="none"
    strokeOpacity={1}
    transform="translate(0,0.6)"
  >
    <g fill="#fff" stroke="#000" strokeLinecap="butt">
      <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11 1.46-13.5 0-3.39 1.46-10.11-.97-13.5 0-1.35.49-2.32.47-3-.5 1.35-1.46 3-2 3-2z" />
      <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
      <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z" />
    </g>
    <path
      d="M17.5 26L27.5 26M15 30L30 30M22.5 15.5L22.5 20.5M20 18L25 18"
      fill="none"
      stroke="#000"
      strokeLinejoin="miter"
    />
  </g>
</svg>

);

export const WhiteRook = (props: PieceProps) => (
<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg" {...props}>
  <g
    fill="#fff"
    fillRule="evenodd"
    stroke="#000"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeMiterlimit={4}
    strokeDasharray="none"
    strokeOpacity={1}
    transform="translate(0,0.3)"
  >
    <path d="M9 39 L36 39 L36 36 L9 36 L9 39 z" strokeLinecap="butt" />
    <path d="M12 36 L12 32 L33 32 L33 36 L12 36 z" strokeLinecap="butt" />
    <path
      d="M11 14 L11 9 L15 9 L15 11 L20 11 L20 9 L25 9 L25 11 L30 11 L30 9 L34 9 L34 14"
      strokeLinecap="butt"
    />
    <path d="M34 14 L31 17 L14 17 L11 14" />
    <path d="M31 17 L31 29.5 L14 29.5 L14 17" strokeLinecap="butt" strokeLinejoin="miter" />
    <path d="M31 29.5 L32.5 32 L12.5 32 L14 29.5" />
    <path d="M11 14 L34 14" fill="none" stroke="#000" strokeLinejoin="miter" />
  </g>
</svg>

);

export const WhiteQueen = (props: PieceProps) => (
<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg" {...props}>
  <g
    fill="#fff"
    fillRule="evenodd"
    stroke="#000"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 26C17.5 24.5 30 24.5 36 26L38.5 13.5 31 25 30.7 10.9 25.5 24.5 22.5 10 19.5 24.5 14.3 10.9 14 25 6.5 13.5 9 26z" />
    <path d="M9 26C9 28 10.5 28 11.5 30C12.5 31.5 12.5 31 12 33.5C10.5 34.5 11 36 11 36C9.5 37.5 11 38.5 11 38.5C17.5 39.5 27.5 39.5 34 38.5C34 38.5 35.5 37.5 34 36C34 36 34.5 34.5 33 33.5C32.5 31 32.5 31.5 33.5 30C34.5 28 36 28 36 26C27.5 24.5 17.5 24.5 9 26z" />
    <path d="M11.5 30C15 29 30 29 33.5 30" fill="none" />
    <path d="M12 33.5C18 32.5 27 32.5 33 33.5" fill="none" />
    <circle cx="6" cy="12" r="2" />
    <circle cx="14" cy="9" r="2" />
    <circle cx="22.5" cy="8" r="2" />
    <circle cx="31" cy="9" r="2" />
    <circle cx="39" cy="12" r="2" />
  </g>
</svg>

);

export const WhiteKing = (props: PieceProps) => (
<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg" {...props}>
  <g
    fill="none"
    fillRule="evenodd"
    stroke="#000"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22.5 11.63V6M20 8h5" strokeLinejoin="miter" />
    <path
      d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"
      fill="#fff"
      strokeLinecap="butt"
      strokeLinejoin="miter"
    />
    <path
      d="M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7"
      fill="#fff"
    />
    <path d="M12.5 30c5.5-3 14.5-3 20 0m-20 3.5c5.5-3 14.5-3 20 0m-20 3.5c5.5-3 14.5-3 20 0" />
  </g>
</svg>

);


// --- BLACK PIECES ---

export const BlackPawn = (props: PieceProps) => (
  <svg viewBox="0 0 45 45" {...props}>
    <g fill="#000" fillRule="nonzero" stroke="#000" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="miter">
      <path d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 H 34 C 34,31.58 29.59,27.09 26.59,26.03 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z" />
    </g>
  </svg>

);

export const BlackKnight = (props: PieceProps) => (
<svg viewBox="0 0 45 45" {...props}>
    <g
      fill="none"
      fillRule="evenodd"
      stroke="#000"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 38.5v-10" strokeLinejoin="miter" />
      <path
        d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18"
        fill="#000"
        stroke="#000"
      />
      <path
        d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10"
        fill="#000"
        stroke="#000"
      />
      <path
        d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z"
        fill="#fff"
        stroke="#fff"
      />
      <path
        d="M 15 15.5 A 0.5 1.5 0 1 1  14,15.5 A 0.5 1.5 0 1 1  15 15.5 z"
        transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)"
        fill="#fff"
        stroke="#fff"
      />
      <path
        d="M 24.55,10.4 L 24.1,11.85 L 24.6,12 C 27.75,13 30.25,14.49 32.5,18.75 C 34.75,23.01 35.75,29.06 35.25,39 L 35.2,39.5 L 37.45,39.5 L 37.5,39 C 38,28.94 36.62,22.15 34.25,17.66 C 31.88,13.17 28.46,11.02 25.06,10.5 L 24.55,10.4 z"
        fill="#fff"
        stroke="none"
      />
    </g>
  </svg>
);

export const BlackBishop = (props: PieceProps) => (
 <svg viewBox="0 0 45 45" {...props}>
    <g
      fill="none"
      fillRule="evenodd"
      stroke="#000"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      transform="translate(0,0.6)"
    >
      <g fill="#000" stroke="#000" strokeLinecap="butt">
        <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.65,38.99 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 z" />
        <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
        <path d="M 25 8 A 2.5 2.5 0 1 1  20,8 A 2.5 2.5 0 1 1  25 8 z" />
      </g>

      <path
        d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18"
        fill="none"
        stroke="#fff"
        strokeLinejoin="miter"
      />
    </g>
  </svg>
);

export const BlackRook = (props: PieceProps) => (
<svg viewBox="0 0 45 45" {...props}>
  <g fill="#000" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(0,0.3)">
    <path d="M9 39h27v-3H9v3z" strokeLinecap="butt"/>
    <path d="M12.5 32l1.5-2.5h17l1.5 2.5h-20z" strokeLinecap="butt"/>
    <path d="M12 36v-4h21v4H12z" strokeLinecap="butt"/>
    <path d="M14 29.5v-13h17v13H14z" strokeLinecap="butt" strokeLinejoin="miter"/>
    <path d="M14 16.5L11 14h23l-3 2.5H14z" strokeLinecap="butt"/>
    <path d="M11 14V9h4v2h5V9h5v2h5V9h4v5H11z" strokeLinecap="butt"/>
    <path d="M12 35.5h21" fill="none" stroke="#fff" strokeWidth="1" strokeLinejoin="miter"/>
    <path d="M13 31.5h19" fill="none" stroke="#fff" strokeWidth="1" strokeLinejoin="miter"/>
    <path d="M14 29.5h17" fill="none" stroke="#fff" strokeWidth="1" strokeLinejoin="miter"/>
    <path d="M14 16.5h17" fill="none" stroke="#fff" strokeWidth="1" strokeLinejoin="miter"/>
    <path d="M11 14h23" fill="none" stroke="#fff" strokeWidth="1" strokeLinejoin="miter"/>
  </g>
</svg>

);

export const BlackQueen = (props: PieceProps) => (
<svg viewBox="0 0 45 45" {...props}>
    <g
      fill="#000"
      fillRule="evenodd"
      stroke="#000"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M9 26c8.5-1.5 19.5-1.5 27 0l2.5-12.5L31 25l-.3-14.1L25.5 24.5 22.5 10 19.5 24.5 14.3 10.9 14 25 6.5 13.5 9 26z"
        strokeLinecap="butt"
      />
      <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1 2.5-1 2.5-1.5 1.5 0 2.5 0 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" />
      <path d="M11.5 30C15 29 30 29 33.5 30" />
      <path d="M12 33.5c6-1 15-1 21 0" />
      <circle cx="6" cy="12" r="2" />
      <circle cx="14" cy="9" r="2" />
      <circle cx="22.5" cy="8" r="2" />
      <circle cx="31" cy="9" r="2" />
      <circle cx="39" cy="12" r="2" />
      <path
        d="M11 38.5A35 35 1 0 0 34 38.5"
        fill="none"
        stroke="#000"
        strokeLinecap="butt"
      />

      {/* white detail strokes */}
      <g fill="none" stroke="#fff" strokeWidth={1}>
        <path d="M11 29A35 35 1 0 1 34 29" />
        <path d="M12.5 31.5h20" />
        <path d="M11.5 34.5A35 35 1 0 0 33.5 34.5" />
        <path d="M10.5 37.5A35 35 1 0 0 34.5 37.5" />
      </g>
    </g>
  </svg>
);

export const BlackKing = (props: PieceProps) => (
<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg" {...props}>
  <g
    fill="none"
    fillRule="evenodd"
    stroke="#000"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeMiterlimit={4}
    strokeDasharray="none"
    strokeOpacity={1}
  >
    <path
      id="path6570"
      d="M22.5 11.63 L22.5 6"
      fill="none"
      stroke="#000"
      strokeLinejoin="miter"
    />
    <path
      d="M22.5 25 C22.5 25 27 17.5 25.5 14.5 C25.5 14.5 24.5 12 22.5 12 C20.5 12 19.5 14.5 19.5 14.5 C18 17.5 22.5 25 22.5 25"
      fill="#000"
      fillOpacity={1}
      stroke="none"
      strokeLinecap="butt"
      strokeLinejoin="miter"
    />
    <path
      d="M12.5 37 C18 40.5 27 40.5 32.5 37 L32.5 30 C32.5 30 41.5 25.5 38.5 19.5 C34.5 13 25 16 22.5 23.5 L22.5 27 L22.5 23.5 C20 16 10.5 13 6.5 19.5 C3.5 25.5 12.5 30 12.5 30 L12.5 37"
      fill="#000"
      stroke="#000"
    />
    <path
      d="M20 8 L25 8"
      fill="none"
      stroke="#000"
      strokeLinejoin="miter"
    />
    <path
      d="M32 29.5 C32 29.5 40.5 25.5 38.03 19.85 C34.15 14 25 18 22.5 24.5 L22.5 26.6 L22.5 24.5 C20 18 10.85 14 6.97 19.85 C4.5 25.5 13 29.5 13 29.5"
      fill="none"
      stroke="#fff"
    />
    <path
      d="M12.5 30 C18 27 27 27 32.5 30 M12.5 33.5 C18 30.5 27 30.5 32.5 33.5 M12.5 37 C18 34 27 34 32.5 37"
      fill="none"
      stroke="#fff"
    />
  </g>
</svg>

);
