/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useCallback, useRef } from 'react';
import type * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";
import { findChessboardsInPage } from '../lib/gemini';
import { db } from '../lib/db';
import type { BoundingBox, StoredPdfPuzzles } from '../lib/types';

// Helper to render a page to a canvas, which we still need to get the image data.
const renderPageToCanvas = async (page: pdfjsLib.PDFPageProxy): Promise<HTMLCanvasElement> => {
    const viewport = page.getViewport({ scale: 1.5 }); // Use high resolution for better detection
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');
    if (context) {
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: context, viewport }).promise;
    }
    return canvas;
};

export const usePdfDeepScan = (pdfDoc: pdfjsLib.PDFDocumentProxy | null, pdfId: number) => {
    const [isDeepScanning, setIsDeepScanning] = useState(false);
    const isCancelledRef = useRef(false);

    const cancelDeepScan = useCallback(() => {
        isCancelledRef.current = true;
        setIsDeepScanning(false); // Immediately update UI
    }, []);

    const startDeepScan = useCallback(async (pageNum: number, onScanComplete: () => void) => {
        if (!pdfDoc || isDeepScanning) return;

        setIsDeepScanning(true);
        isCancelledRef.current = false;

        try {
            const page = await pdfDoc.getPage(pageNum);
            const pageCanvas = await renderPageToCanvas(page);
            // Check for cancellation after potentially long render
            if (isCancelledRef.current) {
                page.cleanup();
                return;
            }

            const pageImageBase64 = pageCanvas.toDataURL('image/png').split(',')[1];
            page.cleanup();
            
            // Check for cancellation before API call
            if (isCancelledRef.current) return;

            const detectedBoards: BoundingBox[] = await findChessboardsInPage(pageImageBase64);
            
            // Check for cancellation after API call
            if (isCancelledRef.current) return;
            
            // If boards are found, save them. If not, save an empty array to mark page as scanned.
            const puzzleData: StoredPdfPuzzles = { pdfId, page: pageNum, boundingBoxes: detectedBoards };
            await db.savePdfPuzzles(puzzleData);
            
            onScanComplete();

        } catch (error) {
            console.error(`Failed to scan page ${pageNum}:`, error);
            // Optionally set an error state here to show to the user
        } finally {
            if (!isCancelledRef.current) {
                setIsDeepScanning(false);
            }
        }
    }, [pdfDoc, pdfId, isDeepScanning]);

    return {
        isDeepScanning,
        startDeepScan,
        cancelDeepScan,
    };
};