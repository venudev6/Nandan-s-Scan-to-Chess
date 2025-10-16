/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// @ts-ignore
import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";
import { fenToBoardState } from './fenUtils';

// Declare cv and cvReady on the window object for global access to OpenCV.js
declare global {
    interface Window {
        cv: any;
        cvReady: Promise<void>;
        onOpenCvReady: () => void;
    }
}

/**
 * Converts an image file to a base64 encoded string, including the data URL prefix.
 * @param file The file to convert.
 * @returns A promise that resolves with the full data URL string (e.g., "data:image/png;base64,...").
 */
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error('Failed to read file as data URL.'));
            }
        };
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
};


/**
 * Converts an image file to a base64 encoded string.
 * This is necessary for embedding the image data directly into the Gemini API request.
 * @param file The image file to convert (e.g., from an <input type="file"> or a Blob).
 * @returns A promise that resolves with the base64 string (without the "data:image/..." prefix).
 */
export const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // The result is a data URL like "data:image/png;base64,iVBORw0KGgo...".
        // We only need the part after the comma for the API.
        const base64 = reader.result.split(',')[1];
        if (base64) {
          resolve(base64);
        } else {
          reject(new Error('Failed to extract base64 from data URL.'));
        }
      } else {
        reject(new Error('Failed to read file as base64 string.'));
      }
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Resizes an image on a canvas to a maximum dimension, then exports it as a File object.
 * @param canvas The source canvas with the cropped image.
 * @param options Configuration for resizing and export.
 * @returns A promise that resolves with the new, optimized File object.
 */
export const resizeAndExportImage = (
    canvas: HTMLCanvasElement,
    options: {
        maxDimension: number,
        type: 'image/webp' | 'image/jpeg' | 'image/png',
        quality: number,
        fileName: string
    }
): Promise<File | null> => {
    return new Promise((resolve) => {
        const { maxDimension, type, quality, fileName } = options;
        const { width: originalWidth, height: originalHeight } = canvas;

        let targetWidth = originalWidth;
        let targetHeight = originalHeight;

        // Calculate new dimensions while maintaining aspect ratio
        if (targetWidth > maxDimension || targetHeight > maxDimension) {
            if (targetWidth > targetHeight) {
                targetHeight = Math.round((targetHeight / targetWidth) * maxDimension);
                targetWidth = maxDimension;
            } else {
                targetWidth = Math.round((targetWidth / targetHeight) * maxDimension);
                targetHeight = maxDimension;
            }
        }

        const resizeCanvas = document.createElement('canvas');
        resizeCanvas.width = targetWidth;
        resizeCanvas.height = targetHeight;
        const ctx = resizeCanvas.getContext('2d');

        if (!ctx) {
            resolve(null);
            return;
        }

        // Draw the original canvas onto the resizing canvas
        ctx.drawImage(canvas, 0, 0, originalWidth, originalHeight, 0, 0, targetWidth, targetHeight);

        resizeCanvas.toBlob(
            (blob) => {
                if (!blob) {
                    resolve(null);
                    return;
                }
                resolve(new File([blob], fileName, { type }));
            },
            type,
            quality
        );
    });
};


/**
 * Converts a data URL (e.g., from a canvas or FileReader) into a Blob object.
 * This implementation uses the modern `fetch` API, which correctly handles
 * different encodings and is more robust than manual base64 decoding.
 * @param dataUrl The data URL string.
 * @returns A promise that resolves with the corresponding Blob.
 */
export const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
    try {
        const response = await fetch(dataUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch data URL: ${response.statusText}`);
        }
        return await response.blob();
    } catch (e) {
        console.error("Failed to convert data URL to blob", e);
        throw new Error("Failed to convert data URL to blob.");
    }
};

/**
 * Converts a data URL into a File object.
 * @param dataUrl The data URL string.
 * @param fileName The desired filename for the resulting File.
 * @returns A promise that resolves with the corresponding File object.
 */
export const dataUrlToFile = async (dataUrl: string, fileName: string): Promise<File> => {
    const blob = await dataUrlToBlob(dataUrl);
    return new File([blob], fileName, { type: blob.type });
};


/**
 * Slices a warped chessboard image into 64 tiles using OpenCV.js. It performs
 * pre-processing to filter out empty tiles, resize piece tiles, and convert
 * them to an efficient format before they are sent to the Gemini API.
 * @param imageFile The warped image file of a chessboard.
 * @returns A promise resolving to an array of 64 objects, each containing the
 *          square name and either a WebP data URL or the string 'empty'.
 */
export const sliceImageToTiles = async (imageFile: File): Promise<{ square: string, dataUrl: string | 'empty' }[]> => {
    await window.cvReady;
    const cv = window.cv;
    const matsToClean: any[] = [];

    try {
        const img = new Image();
        const objectUrl = URL.createObjectURL(imageFile);
        img.src = objectUrl;
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
        });
        URL.revokeObjectURL(objectUrl);

        const srcMat = cv.imread(img);
        matsToClean.push(srcMat);

        // For best results, resize to a consistent, moderately high resolution for slicing.
        const size = 512;
        const resizedMat = new cv.Mat();
        matsToClean.push(resizedMat);
        cv.resize(srcMat, resizedMat, new cv.Size(size, size), 0, 0, cv.INTER_AREA);

        const tiles: { square: string, dataUrl: string | 'empty' }[] = [];
        const tileSize = size / 8;
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
        
        // This canvas is reused for all final 64x64 tiles.
        const tileCanvas = document.createElement('canvas');
        tileCanvas.width = 64; // Target size for Gemini
        tileCanvas.height = 64;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const square = files[c] + ranks[r];
                const rect = new cv.Rect(c * tileSize, r * tileSize, tileSize, tileSize);
                const tileMat = resizedMat.roi(rect);
                matsToClean.push(tileMat);

                // --- Empty Tile Check using Standard Deviation ---
                const grayTile = new cv.Mat();
                matsToClean.push(grayTile);
                cv.cvtColor(tileMat, grayTile, cv.COLOR_RGBA2GRAY, 0);
                
                const mean = new cv.Mat();
                const stdDev = new cv.Mat();
                matsToClean.push(mean, stdDev);
                cv.meanStdDev(grayTile, mean, stdDev);
                
                const stdDevValue = stdDev.data64F[0];
                // This threshold determines if a tile is empty. A lower value is more
                // sensitive and less likely to classify a low-contrast piece as empty.
                const varianceThreshold = 36;
                const stdDevThreshold = Math.sqrt(varianceThreshold); // = 6

                if (stdDevValue < stdDevThreshold) {
                    tiles.push({ square, dataUrl: 'empty' });
                } else {
                    // --- Resize to 64x64 and Convert to WebP ---
                    const finalTileMat = new cv.Mat();
                    matsToClean.push(finalTileMat);
                    cv.resize(tileMat, finalTileMat, new cv.Size(64, 64), 0, 0, cv.INTER_AREA);
                    
                    cv.imshow(tileCanvas, finalTileMat);
                    const dataUrl = tileCanvas.toDataURL('image/webp', 0.8);
                    tiles.push({ square, dataUrl });
                }
            }
        }
        return tiles;
    } finally {
        // Clean up all allocated OpenCV memory.
        matsToClean.forEach(mat => {
            if (mat && !mat.isDeleted()) {
                mat.delete();
            }
        });
    }
};

/**
 * Uses OpenCV.js to perform a perspective warp on an image.
 * @param imageFile The source image file.
 * @param corners The four corner points of the quadrilateral to warp.
 * @param outputSize The width and height of the resulting square image.
 * @returns A promise that resolves with the warped image as a File object.
 */
export const warpImage = async (
    imageFile: File,
    corners: { top_left: [number, number], top_right: [number, number], bottom_right: [number, number], bottom_left: [number, number] },
    outputSize: number
): Promise<File> => {
    await window.cvReady; // Ensure OpenCV is loaded
    const cv = window.cv;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const matsToClean = [];
                try {
                    const src = cv.imread(img);
                    matsToClean.push(src);
                    
                    // Define source and destination corners for the perspective transform
                    const srcCorners = cv.matFromArray(4, 1, cv.CV_32FC2, [
                        ...corners.top_left,
                        ...corners.top_right,
                        ...corners.bottom_right,
                        ...corners.bottom_left
                    ]);
                    matsToClean.push(srcCorners);

                    const dstCorners = cv.matFromArray(4, 1, cv.CV_32FC2, [
                        0, 0,
                        outputSize, 0,
                        outputSize, outputSize,
                        0, outputSize
                    ]);
                    matsToClean.push(dstCorners);

                    const M = cv.getPerspectiveTransform(srcCorners, dstCorners);
                    matsToClean.push(M);
                    const dsize = new cv.Size(outputSize, outputSize);
                    const warped = new cv.Mat();
                    matsToClean.push(warped);
                    cv.warpPerspective(src, warped, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
                    
                    const canvas = document.createElement('canvas');
                    cv.imshow(canvas, warped);

                    canvas.toBlob(blob => {
                        if (blob) {
                            resolve(new File([blob], 'warped.png', { type: 'image/png' }));
                        } else {
                            reject(new Error("Canvas to Blob conversion failed."));
                        }
                    }, 'image/png');
                } catch (e) {
                    reject(e);
                } finally {
                    // Clean up all OpenCV memory
                    matsToClean.forEach(mat => {
                        if (mat && !mat.isDeleted()) {
                            mat.delete();
                        }
                    });
                }
            };
            img.onerror = () => reject(new Error('Failed to load image for warping.'));
            img.src = event.target?.result as string;
        };
        reader.onerror = (e) => reject(new Error(`FileReader error: ${e}`));
        reader.readAsDataURL(imageFile);
    });
};


/**
 * Generates a thumbnail image from the first page of a PDF file.
 * It uses the pdf.js library to render the PDF page onto a canvas and then exports it as a data URL.
 * @param file The PDF file object.
 * @param pageNum The page number to generate the thumbnail from (defaults to 1).
 * @returns A promise that resolves with a data URL (jpeg format) of the thumbnail.
 */
export const generatePdfThumbnail = async (file: File, pageNum = 1): Promise<string> => {
    // Set up the web worker for pdf.js to avoid blocking the main thread.
    // The library and worker versions must match.
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@5.4.149/build/pdf.worker.mjs`;
    
    // Read the file into an ArrayBuffer.
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document from the ArrayBuffer.
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const doc = await loadingTask.promise;
    
    // Get the specified page from the document.
    const page = await doc.getPage(pageNum);
    
    // Create a viewport with a small scale for a low-resolution thumbnail.
    const viewport = page.getViewport({ scale: 0.5 });
    
    // Create a temporary canvas element to render the page onto.
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');
    
    if (context) {
        // Render the page onto the canvas context.
        await page.render({ canvasContext: context, viewport }).promise;
    }
    
    // Clean up pdf.js resources to free up memory.
    page.cleanup();
    doc.destroy();
    
    // Convert the canvas content to a JPEG data URL with 80% quality.
    return canvas.toDataURL('image/jpeg', 0.8);
};

const UNICODE_PIECES: { [color: string]: { [piece: string]: string } } = {
  w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
  b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' },
};

/**
 * Generates a lightweight SVG thumbnail of a chessboard from a FEN string.
 * @param fen The FEN string of the position to render.
 * @returns A base64-encoded data URL for the SVG image.
 */
export const generateBoardThumbnail = (fen: string): string => {
    try {
        const { board } = fenToBoardState(fen);
        const size = 200;
        const squareSize = size / 8;
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">`;

        // Board squares
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const isLight = (r + c) % 2 !== 0;
                svg += `<rect x="${c * squareSize}" y="${r * squareSize}" width="${squareSize}" height="${squareSize}" fill="${isLight ? '#f0d9b5' : '#b58863'}" />`;
            }
        }

        // Pieces
        board.forEach((row, r) => {
            row.forEach((piece, c) => {
                if (piece) {
                    const unicode = UNICODE_PIECES[piece.color][piece.type];
                    const pieceColor = piece.color === 'w' ? '#fff' : '#000';
                    const strokeColor = piece.color === 'w' ? '#000' : '#fff';
                    svg += `<text x="${c * squareSize + squareSize / 2}" y="${r * squareSize + squareSize / 2}" font-size="${squareSize * 0.8}" text-anchor="middle" dominant-baseline="central" fill="${pieceColor}" stroke="${strokeColor}" stroke-width="1" style="paint-order: stroke;">${unicode}</text>`;
                }
            });
        });

        svg += '</svg>';
        // Correctly handle unicode characters for base64 encoding.
        const base64Svg = btoa(unescape(encodeURIComponent(svg)));
        return `data:image/svg+xml;base64,${base64Svg}`;
    } catch (e) {
        console.error("Failed to generate board thumbnail for FEN:", fen, e);
        // Return a transparent placeholder on error
        return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    }
};

/**
 * Generates a lightweight SVG representation of a chessboard from a FEN string.
 * This function is designed to be used for generating downloadable images.
 * @param fen The FEN string of the position to render.
 * @param pieceTheme This parameter is currently ignored, but is kept for future compatibility. Unicode pieces are used.
 * @returns An SVG string.
 */
export const generateBoardImageSVGString = (fen: string, pieceTheme: string): string => {
    try {
        const { board } = fenToBoardState(fen);
        const size = 512; // Larger size for better quality download
        const squareSize = size / 8;
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">`;

        // Board squares
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const isLight = (r + c) % 2 !== 0;
                svg += `<rect x="${c * squareSize}" y="${r * squareSize}" width="${squareSize}" height="${squareSize}" fill="${isLight ? '#f0d9b5' : '#b58863'}" />`;
            }
        }

        // Pieces
        board.forEach((row, r) => {
            row.forEach((piece, c) => {
                if (piece) {
                    const unicode = UNICODE_PIECES[piece.color][piece.type];
                    const pieceColor = piece.color === 'w' ? '#fff' : '#000';
                    const strokeColor = piece.color === 'w' ? '#000' : '#fff';
                    svg += `<text x="${c * squareSize + squareSize / 2}" y="${r * squareSize + squareSize / 2}" font-size="${squareSize * 0.8}" text-anchor="middle" dominant-baseline="central" fill="${pieceColor}" stroke="${strokeColor}" stroke-width="1" style="paint-order: stroke;">${unicode}</text>`;
                }
            });
        });

        svg += '</svg>';
        return svg;
    } catch (e) {
        console.error("Failed to generate board image SVG for FEN:", fen, e);
        // Return a simple error SVG
        return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#cc0000" /><text x="50%" y="50%" font-size="48" fill="white" text-anchor="middle" dominant-baseline="middle">Error</text></svg>`;
    }
};

/**
 * Converts an SVG string to a PNG data URL.
 * @param svgString The raw SVG string.
 * @param width The desired width of the output PNG.
 * @param height The desired height of the output PNG.
 * @returns A promise that resolves with the PNG data URL.
 */
export const svgToPngDataUrl = (svgString: string, width: number, height: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Draw a white background first to handle transparent SVGs
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                const pngDataUrl = canvas.toDataURL('image/png');
                URL.revokeObjectURL(url);
                resolve(pngDataUrl);
            } else {
                URL.revokeObjectURL(url);
                reject(new Error('Could not get 2D context from canvas.'));
            }
        };

        img.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(new Error(`Failed to load SVG into image element.`));
        };

        img.src = url;
    });
};

/**
 * Converts an ArrayBuffer to a hex string.
 * @param buffer The ArrayBuffer to convert.
 * @returns A string representing the buffer in hexadecimal.
 */
const bufferToHex = (buffer: ArrayBuffer): string => {
  return [...new Uint8Array(buffer)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Computes a SHA-1 hash of an image file for duplicate detection.
 * @param file The image file to hash.
 * @returns A promise that resolves with the SHA-1 hash as a hex string.
 */
export const computeImageHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
  return bufferToHex(hashBuffer);
};