/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useCallback } from 'react';
import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";
import { db } from '../lib/db';
import { generatePdfThumbnail } from '../lib/utils';
import type { AppState, StoredPdf } from '../lib/types';

// Set up the web worker for pdf.js to avoid blocking the main thread.
pdfjsLib.GlobalWorkerOptions.workerSrc = `pdfjs-dist/build/pdf.worker.mjs`;

type SelectedPdfState = {
    id: number;
    file: File;
    lastPage: number;
    lastZoom: number;
    doc: pdfjsLib.PDFDocumentProxy; // The parsed PDF.js document object.
};

type UsePdfManagerProps = {
    setAppState: (state: AppState) => void;
    setError: (error: string | null) => void;
};

/**
 * A custom hook to manage all interactions with the IndexedDB for storing and retrieving PDFs.
 * It centralizes the state and logic for the list of stored PDFs, the currently selected PDF,
 * and loading indicators. It now caches the parsed PDF document object for performance.
 */
export const usePdfManager = ({ setAppState, setError }: UsePdfManagerProps) => {
    const [storedPdfs, setStoredPdfs] = useState<StoredPdf[]>([]);
    const [isProcessingPdf, setIsProcessingPdf] = useState(false);
    const [selectedPdf, setSelectedPdf] = useState<SelectedPdfState | null>(null);

    const loadStoredPdfs = useCallback(async () => {
        try {
            await db.init();
            const pdfs = await db.getAllPdfs();
            setStoredPdfs(pdfs);
        } catch (e) {
            console.error("Could not load stored PDFs:", e);
        }
    }, []);

    const clearSelectedPdf = useCallback(() => {
        if (selectedPdf?.doc) {
            selectedPdf.doc.destroy();
        }
        setSelectedPdf(null);
    }, [selectedPdf]);

    const handlePdfSelect = async (file: File) => {
        if (selectedPdf?.doc) {
            selectedPdf.doc.destroy(); // Clean up previously opened PDF
        }
        setIsProcessingPdf(true);
        try {
            const thumbnail = await generatePdfThumbnail(file);
            const arrayBuffer = await file.arrayBuffer();
            const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const newId = await db.savePdf(file, thumbnail);
            setSelectedPdf({ id: newId, file, lastPage: 1, lastZoom: 1.0, doc });
            setAppState('pdfViewer');
            await loadStoredPdfs();
        } catch (e) {
            console.error("Error saving PDF:", e);
            setError("Could not save the PDF file.");
            setAppState('error');
        } finally {
            setIsProcessingPdf(false);
        }
    };

    const handleStoredPdfSelect = async (id: number) => {
        if (selectedPdf?.doc) {
            selectedPdf.doc.destroy(); // Clean up previously opened PDF
        }
        setIsProcessingPdf(true);
        try {
            const record = await db.getPdf(id);
            const arrayBuffer = await record.data.arrayBuffer();
            const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            setSelectedPdf({
                id: record.id,
                file: record.data,
                lastPage: record.lastPage || 1,
                lastZoom: record.lastZoom || 1.0,
                doc,
            });
            setAppState('pdfViewer');
        } catch (e) {
            console.error("Error loading stored PDF:", e);
            setError("Could not load the selected PDF file.");
            setAppState('error');
        } finally {
            setIsProcessingPdf(false);
        }
    };
    
    const handleDeletePdf = async (id: number) => {
        try {
            await db.deletePdf(id);
            await loadStoredPdfs();
        } catch(e) {
            console.error("Could not delete PDF:", e);
        }
    };

    const handlePdfStateChange = useCallback(async (id: number, page: number, zoom: number) => {
        setSelectedPdf(prev => {
            if (prev && prev.id === id) {
                return { ...prev, lastPage: page, lastZoom: zoom };
            }
            return prev;
        });
    
        try {
            await db.updatePdfState(id, page, zoom);
        } catch (e) {
            console.error("Failed to update PDF state:", e);
        }
    }, []);

    return {
        storedPdfs,
        isProcessingPdf,
        selectedPdf,
        loadStoredPdfs,
        handlePdfSelect,
        handleStoredPdfSelect,
        handleDeletePdf,
        handlePdfStateChange,
        clearSelectedPdf,
    };
};