/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect } from 'react';
import type * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";

/**
 * Custom hook to render a specific page of a PDF document to an image data URL.
 * @param pdfDoc The loaded PDF document object.
 * @param currentPage The page number to render.
 * @returns State variables for the image source, rendering status, and natural image dimensions.
 */
export const usePdfPageRenderer = (pdfDoc: pdfjsLib.PDFDocumentProxy | null, currentPage: number) => {
    const [imgSrc, setImgSrc] = useState('');
    const [isPageRendering, setIsPageRendering] = useState(true);
    const [imgNaturalSize, setImgNaturalSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (!pdfDoc) return;

        let isCancelled = false;
        const render = async () => {
            setIsPageRendering(true);
            
            try {
                const page = await pdfDoc.getPage(currentPage);
                if (isCancelled) {
                    page.cleanup();
                    return;
                }
                
                const viewport = page.getViewport({ scale: 2.0 }); 
                setImgNaturalSize({ width: viewport.width, height: viewport.height });

                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const context = canvas.getContext('2d');
                
                if (context) {
                    // Fill the canvas with a white background before rendering the PDF page.
                    // This prevents issues with PDFs that have transparent backgrounds,
                    // ensuring they are always readable regardless of the container's background color.
                    context.fillStyle = '#FFFFFF';
                    context.fillRect(0, 0, canvas.width, canvas.height);

                    await page.render({ canvasContext: context, viewport }).promise;
                    if (!isCancelled) {
                        setImgSrc(canvas.toDataURL());
                    }
                }
                page.cleanup();
            } catch (e) {
                if (!(e instanceof Error && e.name === 'RenderingCancelledException')) {
                     console.error("Failed to render page", e);
                }
            } finally {
                if (!isCancelled) {
                    setIsPageRendering(false);
                }
            }
        };

        render();
        return () => { isCancelled = true; };
    }, [pdfDoc, currentPage]);

    return { imgSrc, isPageRendering, imgNaturalSize };
};