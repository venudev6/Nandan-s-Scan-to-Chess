/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import type * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";

const generateThumbnail = async (doc: pdfjsLib.PDFDocumentProxy, pageNum: number): Promise<string> => {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 0.3 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');
    if (context) {
        await page.render({ canvasContext: context, viewport }).promise;
    }
    page.cleanup();
    return canvas.toDataURL('image/jpeg', 0.8);
};

/**
 * Custom hook to manage the state and logic for the PDF thumbnail sidebar.
 * It handles thumbnail generation, lazy loading with IntersectionObserver, and
 * scrolling the active thumbnail into view.
 */
export const usePdfThumbnails = (pdfDoc: pdfjsLib.PDFDocumentProxy | null, currentPage: number, isPageRendering: boolean) => {
    const [thumbnails, setThumbnails] = useState<(string | null)[]>([]);
    const thumbnailsListRef = useRef<HTMLUListElement>(null);
    const thumbnailsRef = useRef<(string | null)[]>([]);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadingThumbnailsRef = useRef(new Set<number>());

    const loadThumbnail = useCallback(async (pageNum: number) => {
        if (!pdfDoc || pageNum < 1 || pageNum > pdfDoc.numPages || thumbnailsRef.current[pageNum - 1] || loadingThumbnailsRef.current.has(pageNum)) {
            return;
        }

        try {
            loadingThumbnailsRef.current.add(pageNum);
            const thumbSrc = await generateThumbnail(pdfDoc, pageNum);
            setThumbnails(prev => {
                const newThumbs = [...prev];
                if (pageNum - 1 < newThumbs.length) {
                    newThumbs[pageNum - 1] = thumbSrc;
                    thumbnailsRef.current = newThumbs;
                }
                return newThumbs;
            });
        } catch (err) {
            console.error(`Error generating thumbnail for page ${pageNum}:`, err);
        } finally {
            loadingThumbnailsRef.current.delete(pageNum);
        }
    }, [pdfDoc]);

    useEffect(() => {
        if (pdfDoc) {
            const initialThumbs = Array(pdfDoc.numPages).fill(null);
            setThumbnails(initialThumbs);
            thumbnailsRef.current = initialThumbs;
        }
    }, [pdfDoc]);

    useEffect(() => {
        // Only start loading thumbnails once the main page has finished rendering.
        if (!pdfDoc || isPageRendering) return;

        loadThumbnail(currentPage);

        for (let i = 1; i <= 5; i++) {
            if (currentPage + i <= pdfDoc.numPages) loadThumbnail(currentPage + i);
            if (currentPage - i >= 1) loadThumbnail(currentPage - i);
        }

        const handleIntersect: IntersectionObserverCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const pageNum = parseInt((entry.target as HTMLElement).dataset.pageNumber || '0', 10);
                    if (pageNum) loadThumbnail(pageNum);
                    observer.unobserve(entry.target);
                }
            });
        };

        observerRef.current = new IntersectionObserver(handleIntersect, {
            root: thumbnailsListRef.current,
            rootMargin: '200px 0px'
        });
        
        return () => observerRef.current?.disconnect();
    }, [pdfDoc, currentPage, loadThumbnail, isPageRendering]);
    
    const thumbnailRefCallback = useCallback((node: HTMLLIElement | null) => {
        if (node && observerRef.current) {
            observerRef.current.observe(node);
        }
    }, []);

    useLayoutEffect(() => {
        // Don't scroll while the main page is rendering, as the thumbnail list might not be visible or sized correctly.
        if (isPageRendering) return;

        const list = thumbnailsListRef.current;
        if (!list) return;

        const activeItem = list.querySelector('.pdf-thumbnail-item.active') as HTMLElement;
        if (activeItem) {
            activeItem.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center'
            });
        }
    }, [currentPage, isPageRendering]);

    return { thumbnails, thumbnailsListRef, thumbnailRefCallback };
};
