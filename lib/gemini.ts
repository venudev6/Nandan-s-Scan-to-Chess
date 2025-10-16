/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Type } from "@google/genai";
import { sliceImageToTiles, fileToBase64, warpImage } from "./utils";
import { completeFen, tilesToFen, flipSquare } from "./fenUtils";
import type { PieceColor, AnalysisDetails, PostProcessDetails, BoardFeatures, BoundingBox } from "./types";
import { detectBoardFeaturesCV } from './vision';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Runs an array of promise-returning functions with a specified concurrency limit,
 * ensuring all tasks complete before returning results in the correct order.
 * This implementation fixes a race condition where the function would return prematurely.
 * @param tasks An array of functions that each return a Promise.
 * @param limit The maximum number of promises to run concurrently.
 * @returns A promise that resolves with an array containing the results of all tasks in their original order.
 */
async function runWithConcurrency<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
    // This will hold the promise for each task's result, maintaining the original order.
    const resultsPromises: Promise<T>[] = [];
    
    // A Set to keep track of the promises that are currently executing.
    const executing = new Set<Promise<any>>();

    for (const task of tasks) {
        // Start the task immediately. The `Promise.resolve().then()` wrapper ensures
        // that the task is queued for execution on the microtask queue.
        const p = Promise.resolve().then(() => task());
        
        resultsPromises.push(p);
        executing.add(p);

        // When the promise is settled (either resolved or rejected), it should be
        // removed from the `executing` set so a new task can be started.
        const clean = () => executing.delete(p);
        p.then(clean, clean); // handles both fulfillment and rejection

        // If the number of concurrently executing promises has reached our limit,
        // we wait for *at least one* of them to finish before adding another.
        // `Promise.race` resolves as soon as the first promise in the set settles.
        if (executing.size >= limit) {
            await Promise.race(executing);
        }
    }

    // After all tasks have been started, `Promise.all` waits for every single one
    // to complete, then returns an array of their results, preserving the initial order.
    return Promise.all(resultsPromises);
}


/**
 * Sends a cropped image to the a client-side vision pipeline to detect board boundaries.
 * @param imageFile The user-cropped image file.
 * @returns A promise that resolves with the detected board features.
 */
export const detectBoardFeatures = async (imageFile: File): Promise<BoardFeatures> => {
    const cvResult = await detectBoardFeaturesCV(imageFile);
    if (!cvResult.auto_detect) {
        throw new Error(cvResult.notes || "Client-side boundary detection failed.");
    }
    return cvResult;
};

/**
 * Sends an image of a page to Gemini to find all chessboards.
 * @param imageBase64 The base64 encoded image of the page.
 * @returns A promise that resolves with an array of bounding boxes for detected chessboards.
 */
export const findChessboardsInPage = async (imageBase64: string): Promise<BoundingBox[]> => {
    const prompt = "Find all chessboards in the image and return their bounding boxes as an array of objects. Each object should have x, y, width, and height properties as percentages (0.0 to 1.0) of the image dimensions. If no boards are found, return an empty array.";
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            boards: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        x: { type: Type.NUMBER, description: "The top-left x-coordinate as a percentage." },
                        y: { type: Type.NUMBER, description: "The top-left y-coordinate as a percentage." },
                        width: { type: Type.NUMBER, description: "The width as a percentage." },
                        height: { type: Type.NUMBER, description: "The height as a percentage." },
                    },
                    required: ["x", "y", "width", "height"],
                }
            }
        },
        required: ["boards"],
    };

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
            parts: [
                { text: prompt },
                { inlineData: { mimeType: 'image/png', data: imageBase64 } }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
        },
    });

    const jsonText = response.text;
    if (!jsonText) {
        return [];
    }
    try {
        const result = JSON.parse(jsonText.trim());
        return result.boards || [];
    } catch (e) {
        console.error("Failed to parse chessboard detection response:", e);
        return [];
    }
};

const PIECE_NAMES: { [key: string]: string } = { K: 'King', Q: 'Queen', R: 'Rook', B: 'Bishop', N: 'Knight', P: 'Pawn' };
const pieceToDisplay = (code: string) => `${code.startsWith('w') ? 'White' : 'Black'} ${PIECE_NAMES[code.charAt(1)]}`;


/**
 * Performs a series of chess-specific rule-based validations and corrections
 * on the classified tiles from the AI.
 * @param tiles The array of 64 classified tiles.
 * @param detectionResult The original board detection features.
 * @returns An object with the processed tiles and detailed post-processing info.
 */
export const postProcessAnalysis = (
  tiles: { square: string; piece: string; confidence: number }[],
  detectionResult: BoardFeatures
): {
  processedTiles: { square: string; piece: string; confidence: number }[];
  details: PostProcessDetails;
} => {
  let processedTiles = JSON.parse(JSON.stringify(tiles));
  const autoFixes: { message: string, type: 'fix' | 'warning' }[] = [];
  
  const countPieces = (pieceCode: string) => processedTiles.filter(t => t.piece === pieceCode).length;

  // --- King Validation: A two-step process to guarantee exactly one king per side ---

  // 1. Handle TOO MANY KINGS first. Demote the less confident ones to queens.
  const handleExtraKings = (color: 'w' | 'b') => {
      const kingCode = `${color}K`;
      const queenCode = `${color}Q`;
      const kingTiles = processedTiles.filter(t => t.piece === kingCode);

      if (kingTiles.length > 1) {
          // Sort by confidence, highest first
          kingTiles.sort((a, b) => b.confidence - a.confidence);
          
          // Keep the most confident king, change the rest to queens
          const kingsToChange = kingTiles.slice(1);
          kingsToChange.forEach(tileToFix => {
              const originalTileInArray = processedTiles.find(t => t.square === tileToFix.square)!;
              autoFixes.push({ 
                  message: `Found ${kingTiles.length} ${color === 'w' ? 'White' : 'Black'} Kings. Changed the one on ${originalTileInArray.square} to a Queen.`, 
                  type: 'fix' 
              });
              originalTileInArray.piece = queenCode;
          });
      }
  };

  handleExtraKings('w');
  handleExtraKings('b');

  // 2. Handle MISSING KINGS (runs after extra kings are demoted). Promote the best candidate.
  const handleMissingKing = (color: 'w' | 'b') => {
      const kingCode = `${color}K`;
      if (processedTiles.some(t => t.piece.startsWith(color)) && countPieces(kingCode) === 0) {
          const piecesOfColor = processedTiles.filter(t => t.piece.startsWith(color));
          if (piecesOfColor.length > 0) {
              // Prioritize changing a Queen, then other major/minor pieces, then a pawn.
              const piecePriority = [`${color}Q`, `${color}R`, `${color}B`, `${color}N`, `${color}P`];
              let tileToChange: { square: string; piece: string; confidence: number } | null = null;

              for (const pieceCode of piecePriority) {
                  const candidates = piecesOfColor.filter(p => p.piece === pieceCode);
                  if (candidates.length > 0) {
                      candidates.sort((a, b) => b.confidence - a.confidence);
                      tileToChange = candidates[0];
                      break;
                  }
              }
              
              // Fallback to highest confidence piece if no specific types were found (unlikely).
              if (!tileToChange) {
                   piecesOfColor.sort((a, b) => b.confidence - a.confidence);
                   tileToChange = piecesOfColor[0];
              }

              const tileToFix = processedTiles.find(t => t.square === tileToChange!.square)!;
              autoFixes.push({ message: `Changed ${pieceToDisplay(tileToFix.piece)} on ${tileToFix.square} to ${color === 'w' ? 'White' : 'Black'} King (was missing).`, type: 'fix' });
              tileToFix.piece = kingCode;
          }
      }
  };

  handleMissingKing('w');
  handleMissingKing('b');
  
  // --- Pawn Promotion Correction ---
  processedTiles.forEach(tile => {
      const rank = tile.square[1];
      if ((tile.piece === 'wP' && (rank === '8' || rank === '1')) || (tile.piece === 'bP' && (rank === '1' || rank === '8'))) {
          const newPiece = tile.piece.startsWith('w') ? 'wQ' : 'bQ';
          autoFixes.push({ message: `Promoted ${pieceToDisplay(tile.piece)} on ${tile.square} to a Queen.`, type: 'fix' });
          tile.piece = newPiece;
      }
  });

    // --- Piece Count Validation ---
    const pieceCounts: { [key: string]: number } = {};
    processedTiles.forEach(t => {
        if (t.piece !== 'empty') pieceCounts[t.piece] = (pieceCounts[t.piece] || 0) + 1;
    });

    const pieceTypeToName: { [key: string]: string } = { 'P': 'Pawns', 'N': 'Knights', 'B': 'Bishops', 'R': 'Rooks', 'Q': 'Queens' };
    const pieceLimits: { [key: string]: number } = { 'P': 8, 'N': 2, 'B': 2, 'R': 2, 'Q': 1 };

    (['w', 'b'] as const).forEach(color => {
        Object.keys(pieceLimits).forEach(pieceSymbol => {
            const pieceCode = `${color}${pieceSymbol}`;
            const count = pieceCounts[pieceCode] || 0;
            const limit = pieceLimits[pieceSymbol as keyof typeof pieceLimits];
            if (count > limit) {
                 const pawnCount = pieceCounts[`${color}P`] || 0;
                 if (pieceSymbol !== 'P' && pawnCount < 8) {
                      autoFixes.push({
                        message: `Found ${count} ${color === 'w' ? 'White' : 'Black'} ${pieceTypeToName[pieceSymbol as keyof typeof pieceTypeToName]}. This may be due to pawn promotion.`,
                        type: 'warning',
                    });
                 } else if (pieceSymbol === 'P' || pawnCount === 8) {
                     autoFixes.push({
                        message: `Found ${count} ${color === 'w' ? 'White' : 'Black'} ${pieceTypeToName[pieceSymbol as keyof typeof pieceTypeToName]} (max ${limit} expected).`,
                        type: 'warning',
                    });
                 }
            }
        });
    });

  // --- Orientation Fallback (if OCR failed) ---
  let orientationCorrected = false;
  let orientationScore: number | null = null;
  if (!detectionResult.reference_map) {
      let whitePiecesOnTopRanks = 0;
      let totalWhitePieces = 0;
      for (const tile of processedTiles) {
          if (tile.piece.startsWith('w')) {
              totalWhitePieces++;
              if (tile.square.endsWith('7') || tile.square.endsWith('8')) {
                  whitePiecesOnTopRanks++;
              }
          }
      }
      orientationScore = totalWhitePieces > 0 ? (whitePiecesOnTopRanks / totalWhitePieces) : null;
      orientationCorrected = orientationScore !== null && orientationScore > 0.6;
      if (orientationCorrected) {
          processedTiles.forEach(tile => { tile.square = flipSquare(tile.square); });
          autoFixes.push({ message: "Board orientation was automatically flipped 180 degrees.", type: 'fix' });
      }
  }

  const allConfidences = processedTiles.map(t => t.confidence).filter(c => c !== null) as number[];
  const minimumConfidence = allConfidences.length > 0 ? Math.min(...allConfidences) : null;

  return {
    processedTiles,
    details: {
      orientationCorrected,
      autoFixes,
      minimumConfidence,
      orientationScore,
    }
  };
};

/**
 * Sends board tiles to Gemini for classification in concurrent batches and performs post-processing.
 * @param tiles The array of 64 tiles, which can be a data URL or 'empty'.
 * @param boardHash A SHA-1 hash of the warped image file.
 * @param detectionResult The result from the initial `detectBoardFeatures` step.
 * @param isRetry A boolean to indicate if this is a second attempt after a failure.
 * @returns A promise resolving with the final analysis, including FEN and details.
 */
export const classifyAndValidate = async (
    tiles: { square: string; dataUrl: string | 'empty' }[],
    boardHash: string,
    detectionResult: BoardFeatures,
    isRetry: boolean = false,
): Promise<{ fen: string, turn: PieceColor, details: Omit<AnalysisDetails, 'timingSummary'>, post_processing_ms: number }> => {
    
    const nonEmptyTiles = tiles.filter(t => t.dataUrl !== 'empty') as { square: string, dataUrl: string }[];
    const emptyTiles = tiles.filter(t => t.dataUrl === 'empty');

    const BATCH_SIZE = 8;
    const MAX_CONCURRENCY = 4;
    const batches = [];
    for (let i = 0; i < nonEmptyTiles.length; i += BATCH_SIZE) {
        batches.push(nonEmptyTiles.slice(i, i + BATCH_SIZE));
    }
    
    const retryInstruction = isRetry ? "Pay extra attention to detail on this re-analysis." : "";
    
    const schema = {
        type: Type.OBJECT,
        properties: {
          tiles: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                square: { type: Type.STRING },
                piece: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
              },
              required: ["square", "piece", "confidence"],
            },
          },
        },
        required: ["tiles"],
    };

    const tasks = batches.map(batch => async () => {
        const prompt = `You are a world-class chess expert. You will receive a batch of images, each representing a single square of a chessboard.
        For each square, identify the piece. ${retryInstruction}
        Return a single JSON object that contains a "tiles" array.
        Each object in the "tiles" array must have:
        - "square": The algebraic notation (e.g., "e4").
        - "piece": The piece identifier. Use 'wK' for White King, 'bK' for Black King, etc. Use 'empty' for an empty square.
        - "confidence": A float from 0.0 to 1.0.`;

        const parts: any[] = [{ text: prompt }];
        batch.forEach(tile => {
            parts.push({ text: `Square: ${tile.square}` });
            parts.push({
                inlineData: {
                    mimeType: 'image/webp',
                    data: tile.dataUrl.split(',')[1],
                },
            });
        });

        // Simple retry logic: try up to 2 times
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: { parts },
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: schema,
                        temperature: 0.1,
                    }
                });
                const jsonText = response.text;
                if (!jsonText) throw new Error("API returned empty response on attempt " + attempt);
                const result = JSON.parse(jsonText.trim());
                const returnedTiles = result.tiles || [];
                
                // Validate the batch response to ensure all requested tiles are present.
                const resultMap = new Map(returnedTiles.map((t: any) => [t.square, t]));
                const validatedBatchResults = batch.map(inputTile => {
                    const returnedTile = resultMap.get(inputTile.square);
                    if (returnedTile) {
                        return returnedTile;
                    } else {
                        // API dropped this tile. Log it and default to empty with low confidence.
                        console.warn(`Gemini API did not return a classification for square ${inputTile.square} in batch. Defaulting to empty.`);
                        return { square: inputTile.square, piece: 'empty', confidence: 0.1 };
                    }
                });
                return validatedBatchResults; // Success
            } catch (e) {
                console.warn(`Batch classification attempt ${attempt} failed.`, e);
                if (attempt === 2) {
                    // After the final attempt, we must return a result for this batch to avoid crashing.
                    // Mark all tiles in this failed batch as empty with very low confidence.
                    console.error("Batch failed after 2 attempts. Defaulting all tiles in batch to empty.");
                    return batch.map(inputTile => ({
                        square: inputTile.square,
                        piece: 'empty',
                        confidence: 0.0, // Use 0 confidence to indicate total failure
                    }));
                }
            }
        }
        // This should be unreachable, but as a fallback, return the failed batch.
        return batch.map(inputTile => ({ square: inputTile.square, piece: 'empty', confidence: 0.0 }));
    });

    const batchResults = await runWithConcurrency(tasks, MAX_CONCURRENCY);
    const classifiedTilesFromApi = batchResults.flat();
    
    // Combine API results with pre-filtered empty tiles.
    const allClassifiedTiles: { square: string, piece: string, confidence: number }[] = [
        ...classifiedTilesFromApi,
        ...emptyTiles.map(t => ({ square: t.square, piece: 'empty', confidence: 1.0 }))
    ];

    if (allClassifiedTiles.length !== 64) {
        // This check is now very unlikely to fail, but remains as a safeguard.
        throw new Error(`CRITICAL ERROR: Mismatch after assembling tiles. Expected 64, got ${allClassifiedTiles.length}`);
    }
    
    const postProcessStart = performance.now();
    const { processedTiles, details: postProcessDetails } = postProcessAnalysis(allClassifiedTiles, detectionResult);
    const post_processing_ms = performance.now() - postProcessStart;
    
    // --- Token & Cost Estimation ---
    const PROMPT_CHARS_PER_BATCH = 400; // Estimated characters in the prompt
    const OUTPUT_CHARS_PER_BATCH = 500; // Estimated characters in the JSON output
    const TOKENS_PER_CHAR = 1 / 4; // Rule of thumb
    const TOKENS_PER_IMAGE = 258; // From Gemini 1.5 Flash documentation
    
    const numBatches = batches.length;
    const numImages = nonEmptyTiles.length;

    const textInputTokens = numBatches * PROMPT_CHARS_PER_BATCH * TOKENS_PER_CHAR;
    const textOutputTokens = numBatches * OUTPUT_CHARS_PER_BATCH * TOKENS_PER_CHAR;
    const imageTokens = numImages * TOKENS_PER_IMAGE;
    const totalTokens = Math.round(textInputTokens + textOutputTokens + imageTokens);

    const COST_PER_INPUT_CHAR_USD = 0.00000035; // gemini-2.5-flash prices
    const COST_PER_OUTPUT_CHAR_USD = 0.00000070;
    const COST_PER_IMAGE_USD = 0.000125;
    const USD_TO_INR_RATE = 83.5; // Approximate rate

    const textInputCostUSD = numBatches * PROMPT_CHARS_PER_BATCH * COST_PER_INPUT_CHAR_USD;
    const textOutputCostUSD = numBatches * OUTPUT_CHARS_PER_BATCH * COST_PER_OUTPUT_CHAR_USD;
    const imageCostUSD = numImages * COST_PER_IMAGE_USD;
    const totalCostUSD = textInputCostUSD + textOutputCostUSD + imageCostUSD;
    const costEstimateINR = totalCostUSD * USD_TO_INR_RATE;


    // --- Assemble FEN and final details ---
    const piecePlacementFen = tilesToFen(processedTiles);
    let turnColor: PieceColor = 'w';
    if (detectionResult.active_turn && detectionResult.active_turn.toLowerCase().startsWith('b')) {
        turnColor = 'b';
    }
    const completedFen = completeFen(piecePlacementFen, turnColor);

    const allConfidences = processedTiles.map(t => t.confidence).filter(c => c !== null) as number[];
    const averageConfidence = allConfidences.length > 0 ? allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length : null;
    
    const uncertainSquaresFromAI = processedTiles.filter((t: any) => t.confidence < 0.95).map((t: any) => t.square);
    const allUncertainSquares = new Set([...uncertainSquaresFromAI, ...postProcessDetails.autoFixes.map(f => f.message)]);

    return {
        fen: completedFen,
        turn: turnColor,
        details: {
            confidence: averageConfidence,
            reasoning: `Classification based on ${nonEmptyTiles.length} non-empty tiles.`,
            uncertainSquares: Array.from(allUncertainSquares),
            postProcess: postProcessDetails,
            meta: { boardHash },
            tokenUsage: { totalTokens },
            costEstimateINR,
            geminiScans: allClassifiedTiles
        },
        post_processing_ms
    };
};

/**
 * Orchestrates the full image analysis pipeline: detection, warping, slicing, and classification.
 * @param imageFile The user-cropped image file.
 * @param boardHash A SHA-1 hash of the image file.
 * @param isRetry A boolean to indicate if this is a second attempt after a failure.
 * @param onProgress A callback to update the UI with sliced tiles before classification.
 * @returns A promise resolving with the full analysis result, including FEN, turn, and detailed metadata.
 */
export const analyzeImagePosition = async (
    imageFile: File,
    boardHash: string,
    isRetry: boolean = false,
    onProgress?: (slicedTiles: { square: string, dataUrl: string | 'empty' }[]) => void
): Promise<{ 
    fen: string, 
    turn: PieceColor, 
    details: Omit<AnalysisDetails, 'timingSummary'>, 
    timings: {
        board_detection_ms: number;
        perspective_warp_ms: number;
        tile_slicing_ms: number;
        gemini_classification_ms: number;
        post_processing_ms: number;
    }
}> => {
    const timings = {
        board_detection_ms: 0,
        perspective_warp_ms: 0,
        tile_slicing_ms: 0,
        gemini_classification_ms: 0,
        post_processing_ms: 0,
    };

    const detectionStart = performance.now();
    const detectionResult = await detectBoardFeatures(imageFile);
    timings.board_detection_ms = performance.now() - detectionStart;

    const warpStart = performance.now();
    const warpedImageFile = await warpImage(imageFile, detectionResult.corners, 512);
    timings.perspective_warp_ms = performance.now() - warpStart;

    const slicingStart = performance.now();
    const slicedTiles = await sliceImageToTiles(warpedImageFile);
    timings.tile_slicing_ms = performance.now() - slicingStart;

    if (onProgress) {
        onProgress(slicedTiles);
    }

    const classifyStart = performance.now();
    const { fen, turn, details, post_processing_ms } = await classifyAndValidate(
        slicedTiles,
        boardHash,
        detectionResult,
        isRetry
    );
    const classifyEnd = performance.now();
    
    timings.gemini_classification_ms = classifyEnd - classifyStart - post_processing_ms;
    timings.post_processing_ms = post_processing_ms;

    return { fen, turn, details, timings };
};