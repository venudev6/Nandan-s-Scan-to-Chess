/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
// FIX: Add a declaration for the 'process' object to satisfy TypeScript in a non-Node.js environment,
// as the build system is expected to replace `process.env.API_KEY`.
declare var process: any;

import { GoogleGenAI, Type } from "@google/genai";
import { imageToBase64 } from "./utils";
import { completeFen } from "./fenUtils";
import type { PieceColor, AnalysisDetails } from "./types";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Sends a cropped image to the Gemini API for analysis.
 * @param fileToAnalyze The final cropped image file.
 * @param isRetry If true, modifies the prompt and model parameters for re-analysis.
 * @returns A promise that resolves with the analysis result, including FEN, turn, and details.
 */
export const analyzeImagePosition = async (
    fileToAnalyze: File, 
    isRetry: boolean = false
): Promise<{ fen: string, turn: PieceColor, details: AnalysisDetails }> => {
    const base64Image = await imageToBase64(fileToAnalyze);

    let promptText = "Analyze this chessboard image. Return a JSON object with the FEN string, whose turn it is ('w' or 'b'), a confidence score (0.0 to 1.0) for the scan, and brief reasoning for your confidence. You MUST provide an 'uncertainSquares' array containing the algebraic notation of any squares where the piece identification is ambiguous or has low confidence, regardless of the overall confidence score.";

    if (isRetry) {
        promptText = "This is a re-analysis of a chessboard image where the previous scan may have contained errors. Please re-evaluate the position carefully, paying close attention to piece placement and types. " + promptText;
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
            parts: [
                { inlineData: { mimeType: 'image/png', data: base64Image } },
                { text: promptText }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    fen: { type: Type.STRING },
                    turn: { type: Type.STRING },
                    confidence: { type: Type.NUMBER },
                    reasoning: { type: Type.STRING },
                    uncertainSquares: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.STRING
                        }
                    }
                }
            },
            // Add temperature on retry to encourage a different result
            temperature: isRetry ? 0.5 : undefined,
        }
    });
    
    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    const turnColor = (result.turn === 'w' || result.turn === 'b') ? result.turn : 'w';

    if (result.fen) {
        const completedFen = completeFen(result.fen, turnColor);
        return {
            fen: completedFen,
            turn: turnColor,
            details: { 
                confidence: result.confidence ?? 1.0, 
                reasoning: result.reasoning ?? null,
                uncertainSquares: result.uncertainSquares ?? [],
            }
        };
    } else {
        throw new Error("Invalid response format from API.");
    }
};
