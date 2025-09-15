/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import type { BoardPiece, PieceColor } from '../../lib/types';
import { PIECE_COMPONENTS, PIECE_NAMES } from '../../lib/chessConstants';
import './CapturedPieces.css';

/**
 * A UI component to display a list of captured pieces for one side,
 * along with the material advantage score for the opponent.
 *
 * @param props - The component's properties.
 * @param props.color - The color of the pieces that have been captured (e.g., 'w' for captured white pieces).
 * @param props.pieces - An array of the captured piece objects.
 * @param props.scoreAdvantage - The material advantage score of the player who captured these pieces.
 */
const CapturedPieces = ({ color, pieces, scoreAdvantage }: {
    color: PieceColor,
    pieces: BoardPiece[],
    scoreAdvantage: number
}) => {
    // Determine the title based on the color of the captured pieces.
    const title = color === 'w' ? 'White pieces captured' : 'Black pieces captured';

    return (
        // The main container div. The class changes based on the color for specific styling.
        // The layout is now a single flex row.
        <div className={`captured-pieces captured-pieces-${color}`}>
            <div className="captured-pieces-display">
                {/* 
                  If there are captured pieces, map over the array and render each piece's SVG component.
                  Otherwise, display the title as a placeholder.
                */}
                {pieces.length > 0 ? pieces.map((p, i) => {
                    const PieceComponent = PIECE_COMPONENTS[p.color][p.type];
                    return (
                        <PieceComponent
                            key={i} 
                            className="piece"
                            aria-label={`${p.color === 'w' ? 'White' : 'Black'} ${PIECE_NAMES[p.type]}`}
                        />
                    );
                }) : <span className="no-pieces">{title}</span>}
            </div>
            {/* The advantage score is now a sibling to the display, pushed to the right with CSS. */}
            {scoreAdvantage > 0 && <span className="advantage">+{scoreAdvantage}</span>}
        </div>
    )
};

export default CapturedPieces;