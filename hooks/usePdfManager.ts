/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useCallback, useRef, useEffect } from 'react';
import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";
import { db } from '../lib/db';
import { generatePdfThumbnail, dataUrlToFile } from '../lib/utils';
import type { AppState, StoredPdf, User } from '../lib/types';
import { authService } from '../lib/authService';

// Set up the web worker for pdf.js to avoid blocking the main thread.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@5.4.149/build/pdf.worker.mjs`;

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
    user: User | null;
};

/**
 * A custom hook to manage all interactions with the IndexedDB for storing and retrieving PDFs.
 * It centralizes the state and logic for the list of stored PDFs, the currently selected PDF,
 * and loading indicators. It now caches the parsed PDF document object for performance.
 */
export const usePdfManager = ({ setAppState, setError, user }: UsePdfManagerProps) => {
    const [storedPdfs, setStoredPdfs] = useState<StoredPdf[]>([]);
    const [isProcessingPdf, setIsProcessingPdf] = useState(false);
    const [selectedPdf, setSelectedPdf] = useState<SelectedPdfState | null>(null);
    const docCache = useRef(new Map<number, pdfjsLib.PDFDocumentProxy>());

    // This effect cleans up all cached PDF documents when the hook is unmounted.
    useEffect(() => {
        return () => {
            docCache.current.forEach(doc => doc.destroy());
            docCache.current.clear();
        };
    }, []);

    const loadStoredPdfs = useCallback(async () => {
        try {
            await db.init();
            const pdfs = await db.getAllPdfs();
            setStoredPdfs(pdfs);
        } catch (e) {
            console.error("Could not load stored PDFs:", e);
        }
    }, []);
    
    // On initial mount, just load any existing PDFs from the database.
    useEffect(() => {
        loadStoredPdfs();
    }, [loadStoredPdfs]);


    const clearSelectedPdf = useCallback(() => {
        // Don't destroy the doc here, as it's cached.
        setSelectedPdf(null);
    }, []);

    const handlePdfSelect = async (file: File): Promise<number | undefined> => {
        setIsProcessingPdf(true);
        try {
            const thumbnail = await generatePdfThumbnail(file);
            const arrayBuffer = await file.arrayBuffer();
            const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const newId = await db.savePdf(file, thumbnail);
            
            await loadStoredPdfs();

            // Cache the newly loaded document
            docCache.current.set(newId, doc);

            setSelectedPdf({ id: newId, file, lastPage: 1, lastZoom: 1.0, doc });
            setAppState('pdfViewer');
            return newId;
        } catch (e) {
            console.error("Error saving PDF:", e);
            setError("Could not save the PDF file.");
            setAppState('error');
        } finally {
            setIsProcessingPdf(false);
        }
    };

    const handleStoredPdfSelect = async (id: number) => {
        setIsProcessingPdf(true);
        try {
            let doc: pdfjsLib.PDFDocumentProxy;
            const record = await db.getPdf(id);
            
            const pageToOpen = record.lastPage || 1;


            // Check the cache first to improve loading times for recent PDFs
            if (docCache.current.has(id)) {
                doc = docCache.current.get(id)!;
            } else {
                const arrayBuffer = await record.data.arrayBuffer();
                doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                docCache.current.set(id, doc); // Add to cache
            }

            setSelectedPdf({
                id: record.id,
                file: record.data,
                lastPage: pageToOpen,
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
            // If the document is in the cache, destroy it and remove it
            if (docCache.current.has(id)) {
                docCache.current.get(id)?.destroy();
                docCache.current.delete(id);
            }
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