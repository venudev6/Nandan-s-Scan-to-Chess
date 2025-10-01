/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Type } from "@google/genai";
import { imageToBase64 } from "./utils";
import { completeFen, arrayToFen } from "./fenUtils";
import type { PieceColor, AnalysisDetails, BoundingBox } from "./types";

// FIX: Per coding guidelines, API key must be sourced from process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Sends a cropped image to the Gemini API for analysis using a high-accuracy pipeline.
 * Supports a retry flag for an even more meticulous re-analysis if the first attempt fails.
 * @param fileToAnalyze The final cropped image file (expected to be webp).
 * @param isRetry A boolean to indicate if this is a second attempt after a failure.
 * @returns A promise that resolves with the analysis result.
 */
export const analyzeImagePosition = async (
    fileToAnalyze: File,
    isRetry: boolean = false
): Promise<{ fen: string, turn: PieceColor, details: AnalysisDetails }> => {
    const base64Image = await imageToBase64(fileToAnalyze);

    const prompt = isRetry 
        ? `Re-analyzing chess board image due to a prior failure. Be extremely meticulous. Double-check piece placement and color. Return a JSON object with "board" (8x8 array of pieces like "P", "n", ""), "turn" ("w" or "b"), "confidence" (0.0-1.0), "reasoning", and an optional "uncertainSquares" array.`
        : `Analyze the chess board image with very high accuracy. Be meticulous. If you are uncertain about any squares, list them. Return a JSON object with "board" (8x8 array of pieces like "P", "n", "p", ""), "turn" ("w" or "b"), "confidence" (0.0-1.0), a "reasoning" string for your confidence score, and an optional "uncertainSquares" array (e.g., ["e4", "d5"]).`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            board: {
                type: Type.ARRAY,
                items: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            turn: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            uncertainSquares: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
            },
        },
        required: ["board", "turn", "confidence", "reasoning"],
    };

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
            parts: [
                { inlineData: { mimeType: 'image/webp', data: base64Image } },
                { text: prompt }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 0.2,
            topK: 1,
            // Omit thinkingConfig to enable default (high-quality) thinking
        }
    });

    const analysisJsonText = response.text;
    if (!analysisJsonText) {
        throw new Error("Analysis API returned an empty response. This may be due to content safety filters.");
    }
    const result = JSON.parse(analysisJsonText.trim());
    const turnColor = (result.turn === 'w' || result.turn === 'b') ? result.turn : 'w';
    
    if (result.board && Array.isArray(result.board) && result.board.length === 8) {
        const boardFen = arrayToFen(result.board);
        const completedFen = completeFen(boardFen, turnColor);
        return {
            fen: completedFen,
            turn: turnColor,
            details: {
                confidence: result.confidence ?? null,
                reasoning: result.reasoning ?? `Analysis complete.`,
                uncertainSquares: result.uncertainSquares ?? [],
            }
        };
    } else {
        throw new Error("Invalid response format from analysis API.");
    }
};


/**
 * Sends an image of a PDF page to the Gemini API to find all chessboard diagrams.
 * This is a fast-pass that only identifies board locations.
 * @param pageImageBase64 The base64 encoded image of the page.
 * @returns A promise that resolves with an array of BoundingBox objects.
 */
export const findChessboardsInPage = async (pageImageBase64: string): Promise<BoundingBox[]> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
            parts: [
                { inlineData: { mimeType: 'image/png', data: pageImageBase64 } },
                { text: `Your task is to identify all 8x8 chessboard diagrams in the image.

For each chessboard, provide a bounding box that follows these rules precisely:
1.  **Full Coverage:** The box must enclose the entire 8x8 grid, including all pieces, the outer border of the board, and any coordinate labels (like 'a'-'h' and '1'-'8') that are part of the diagram.
2.  **No Cropping:** It is critical that you do not cut off any part of the board. If text like a puzzle number is very close to the board, the bounding box must still start at the absolute top edge of the board itself. For example, if a puzzle number '530' is just above the top-left corner of the board, the 'y' coordinate of the bounding box should start at the top of the board, not below the number '530'. It is better for the box to be slightly too large than to cut off any squares.
3.  **Exclude External Text:** Do not include text that is clearly separate from the diagram, such as player names, game information, or chapter titles that are not part of the board's immediate frame.

Return a JSON object with a key "boards". This key should contain an array of bounding box objects, where each object has "x", "y", "width", and "height" as float values between 0.0 and 1.0.

If no chessboards are found, return an empty "boards" array.` }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    boards: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                x: { type: Type.NUMBER },
                                y: { type: Type.NUMBER },
                                width: { type: Type.NUMBER },
                                height: { type: Type.NUMBER },
                            },
                            required: ["x", "y", "width", "height"],
                        },
                    },
                },
                required: ["boards"],
            },
        },
    });

    const jsonText = response.text;
    if (!jsonText) {
        console.warn("Deep scan API returned an empty response. This could be due to content safety filters.");
        return [];
    }
    const result = JSON.parse(jsonText.trim());
    return result.boards || [];
};