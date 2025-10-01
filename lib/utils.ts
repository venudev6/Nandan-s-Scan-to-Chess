/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// @ts-ignore
import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";
import { fenToBoardState } from './fenUtils';

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
 * This implementation manually decodes the base64 string to avoid issues with
 * the fetch() API on very large data URLs.
 * @param dataUrl The data URL string.
 * @returns The corresponding Blob.
 */
export const dataUrlToBlob = (dataUrl: string): Blob => {
    const parts = dataUrl.split(',');
    if (parts.length !== 2) {
        throw new Error('Invalid data URL.');
    }
    const mimeMatch = parts[0].match(/:(.*?);/);
    if (!mimeMatch || mimeMatch.length < 2) {
        throw new Error('Invalid data URL: mime type not found.');
    }
    const mimeType = mimeMatch[1];
    const base64Data = parts[1];

    try {
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    } catch (e) {
        console.error("Failed to decode base64 string", e);
        throw new Error("Failed to decode base64 string.");
    }
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
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@^5.4.149/build/pdf.worker.mjs`;
    
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