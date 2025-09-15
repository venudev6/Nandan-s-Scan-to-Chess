/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect } from 'react';
import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = `pdfjs-dist/build/pdf.worker.mjs`;

/**
 * Custom hook to manage loading a PDF document from a File object.
 * @param file The PDF file to load.
 * @param onError Callback to handle loading errors.
 * @returns An object containing the loaded PDF document object and its loading state.
 */
export const usePdfDocument = (file: File | null, onError: () => void) => {
    const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [isDocLoading, setIsDocLoading] = useState(true);

    useEffect(() => {
        if (!file) {
            setIsDocLoading(false);
            return;
        }

        let docToClean: pdfjsLib.PDFDocumentProxy | null = null;
        const loadPdf = async () => {
            setIsDocLoading(true);
            try {
                const arrayBuffer = await file.arrayBuffer();
                const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                docToClean = doc;
                setPdfDoc(doc);
            } catch (error) {
                console.error("Failed to load PDF", error);
                alert("Could not load the PDF file.");
                onError();
            } finally {
                setIsDocLoading(false);
            }
        };

        loadPdf();

        return () => {
            docToClean?.destroy();
        };
    }, [file, onError]);

    return { pdfDoc, isDocLoading };
};