/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import type * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";
import { BackIcon, NextMoveIcon, PrevMoveIcon, CheckIcon, ZoomInIcon, ZoomOutIcon, DeepScanIcon } from '../ui/Icons';
import { usePdfPageRenderer } from '../../hooks/usePdfPageRenderer';
import { usePdfThumbnails } from '../../hooks/usePdfThumbnails';
import { usePdfDeepScan } from '../../hooks/usePdfDeepScan';
import { db } from '../../lib/db';
import { resizeAndExportImage } from '../../lib/utils';
import type { BoundingBox } from '../../lib/types';
import './PdfView.css';

/**
 * A comprehensive view for displaying PDFs, navigating pages, zooming,
 * and selecting a region (a puzzle) to crop and analyze.
 */
const PdfView = ({ 
    pdfId, pdfDoc, isDocLoading, initialPage, initialZoom,
    onCropConfirm, onBack, onStateChange 
}: {
    pdfId: number;
    pdfDoc: pdfjsLib.PDFDocumentProxy;
    isDocLoading: boolean;
    initialPage: number;
    initialZoom: number;
    onCropConfirm: (file: File, context: { page: number, totalPages: number }) => void;
    onBack: () => void;
    onStateChange: (id: number, page: number, zoom: number) => void;
}) => {
    // --- STATE MANAGEMENT ---
    const [pageInput, setPageInput] = useState(String(initialPage || 1));
    const [zoom, setZoom] = useState(initialZoom || 1.0);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<Crop>();
    const [sidebarWidth, setSidebarWidth] = useState(150);
    const [isResizing, setIsResizing] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [boundingBoxesForCurrentPage, setBoundingBoxesForCurrentPage] = useState<BoundingBox[]>([]);
    
    // --- REFS ---
    const imgRef = useRef<HTMLImageElement>(null);
    const pageViewRef = useRef<HTMLDivElement>(null);

    // --- CUSTOM HOOKS ---
    const { imgSrc, isPageRendering, imgNaturalSize } = usePdfPageRenderer(pdfDoc, initialPage);
    const { thumbnails, thumbnailsListRef, thumbnailRefCallback } = usePdfThumbnails(pdfDoc, initialPage, isPageRendering);
    const { isDeepScanning, startDeepScan, cancelDeepScan } = usePdfDeepScan(pdfDoc, pdfId);

    // --- STATE CHANGE HANDLERS ---
    const changePage = (newPage: number) => {
        const numPages = pdfDoc?.numPages || newPage;
        const pageNum = Math.max(1, Math.min(newPage, numPages));
        if (pageNum !== initialPage) {
            onStateChange(pdfId, pageNum, zoom);
        }
    };

    const changeZoom = (zoomCallback: (currentZoom: number) => number) => {
        const newZoom = zoomCallback(zoom);
        setZoom(newZoom);
        onStateChange(pdfId, initialPage, newZoom);
    };

    // --- EFFECTS ---
    
    // This effect updates the page number input field when the page changes via props.
    useEffect(() => { setPageInput(String(initialPage)); }, [initialPage]);
    
    // This effect ensures the local zoom state is synced with the prop from the parent.
    useEffect(() => { setZoom(initialZoom || 1.0); }, [initialZoom]);

    // This effect clears the crop selection when the page changes.
    useEffect(() => { setCrop(undefined); setCompletedCrop(undefined); }, [initialPage]);

    // Effect to fetch puzzles for the current page from DB
    useEffect(() => {
        const fetchBoards = async () => {
            const data = await db.getPdfPuzzles(pdfId, initialPage);
            setBoundingBoxesForCurrentPage(data?.boundingBoxes || []);
        };
        fetchBoards();
    }, [pdfId, initialPage]);

    // Handle sidebar resizing for desktop view.
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizing) {
                const newWidth = Math.max(120, Math.min(e.clientX, 400));
                setSidebarWidth(newWidth);
            }
        };
        const handleMouseUp = () => setIsResizing(false);

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    // --- EVENT HANDLERS ---
    const handleConfirmCrop = async () => {
        setIsConfirming(true);
        const image = imgRef.current;
        if (!image || !completedCrop) {
            setIsConfirming(false);
            return;
        }
        
        const canvas = document.createElement("canvas");
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = Math.floor(completedCrop.width * scaleX);
        canvas.height = Math.floor(completedCrop.height * scaleY);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            setIsConfirming(false);
            return;
        }
        const cropX = completedCrop.x * scaleX;
        const cropY = completedCrop.y * scaleY;
        
        ctx.drawImage(image, cropX, cropY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);

        const optimizedFile = await resizeAndExportImage(canvas, {
            maxDimension: 1024,
            type: 'image/webp',
            quality: 0.7,
            fileName: 'cropped_puzzle.webp'
        });

        if (optimizedFile) {
            onCropConfirm(
                optimizedFile,
                { page: initialPage, totalPages: pdfDoc?.numPages || initialPage }
            );
        } else {
            setIsConfirming(false);
        }
    };
    
    const handlePuzzleClick = async (bbox: BoundingBox) => {
        setIsConfirming(true);
        const image = imgRef.current;
        if (!image) {
            setIsConfirming(false);
            return;
        }

        const sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = image.naturalWidth;
        sourceCanvas.height = image.naturalHeight;
        sourceCanvas.getContext('2d')?.drawImage(image, 0, 0);

        const canvas = document.createElement("canvas");
        const sx = sourceCanvas.width * bbox.x;
        const sy = sourceCanvas.height * bbox.y;
        const sWidth = sourceCanvas.width * bbox.width;
        const sHeight = sourceCanvas.height * bbox.height;
        canvas.width = sWidth;
        canvas.height = sHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            setIsConfirming(false);
            return;
        }

        ctx.drawImage(sourceCanvas, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
        
        const optimizedFile = await resizeAndExportImage(canvas, {
            maxDimension: 1024,
            type: 'image/webp',
            quality: 0.7,
            fileName: 'puzzle_from_pdf.webp'
        });

        if (optimizedFile) {
            onCropConfirm(
                optimizedFile,
                { page: initialPage, totalPages: pdfDoc?.numPages || initialPage }
            );
        } else {
            setIsConfirming(false);
        }
    };

    const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setPageInput(e.target.value);

    const handleJumpToPage = () => {
        const pageNum = parseInt(pageInput, 10);
        if (!isNaN(pageNum) && pdfDoc) {
            changePage(pageNum);
        } else {
            setPageInput(String(initialPage)); // Revert if input is invalid
        }
    };

    const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleJumpToPage();
            (e.target as HTMLInputElement).blur();
        }
    };
    
    const handleResizeMouseDown = (e: React.MouseEvent) => { e.preventDefault(); setIsResizing(true); };

    return (
        <div className="pdf-viewer-container">
            {(isDocLoading || isPageRendering || isDeepScanning) && (
                <div className="pdf-loading-overlay">
                    <div className="spinner"></div>
                    <p>
                        {isDocLoading ? 'Loading PDF Document...' : 
                         isDeepScanning ? `Scanning page for puzzles...` : 
                         'Rendering Page...'}
                    </p>
                    {isDeepScanning && (
                        <>
                            <button onClick={cancelDeepScan} className="btn btn-secondary btn-cancel-scan">Cancel</button>
                        </>
                    )}
                </div>
            )}
            <aside className="pdf-sidebar" style={{ width: `${sidebarWidth}px` }}>
                {isDocLoading ? <div className="loading-container"><div className="spinner"></div></div> : (
                    <>
                        <ul ref={thumbnailsListRef} className="pdf-thumbnail-list">
                            {thumbnails.map((thumbSrc, index) => (
                                <li key={index} 
                                    ref={thumbnailRefCallback}
                                    data-page-number={index + 1}
                                    className={`pdf-thumbnail-item ${index + 1 === initialPage ? 'active' : ''}`} 
                                    onClick={() => changePage(index + 1)}>
                                    {thumbSrc ? <img src={thumbSrc} alt={`Page ${index + 1}`} /> : <div className="pdf-thumbnail-placeholder"><div className="spinner"></div></div>}
                                    <span className="pdf-thumbnail-page-number">{index + 1}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="sidebar-controls">
                            <label htmlFor="thumbnail-size-slider">Thumbnail Size</label>
                            <input type="range" id="thumbnail-size-slider" min="100" max="300" value={sidebarWidth} onChange={(e) => setSidebarWidth(Number(e.target.value))} />
                        </div>
                    </>
                )}
            </aside>
            <div className={`pdf-sidebar-resizer ${isResizing ? 'is-resizing' : ''}`} onMouseDown={handleResizeMouseDown} />
            <main className="pdf-main">
                <div className="pdf-toolbar">
                    <button onClick={onBack} className="btn btn-secondary" aria-label="Go Back" title="Go back to the home screen" disabled={isConfirming}><BackIcon/> Back</button>
                    <div className="pdf-toolbar-center">
                        <button onClick={() => startDeepScan(initialPage, () => {
                            db.getPdfPuzzles(pdfId, initialPage).then(data => {
                                setBoundingBoxesForCurrentPage(data?.boundingBoxes || []);
                            });
                        })} className="btn-icon btn-deep-scan" title="Scan Page for Puzzles"><DeepScanIcon /></button>
                        <div className="pdf-zoom-controls">
                            <button onClick={() => changeZoom(z => Math.max(0.25, z - 0.25))} disabled={zoom <= 0.25} className="btn-icon" title="Zoom out"><ZoomOutIcon /></button>
                            <button onClick={() => changeZoom(z => Math.min(4.0, z + 0.25))} disabled={zoom >= 4.0} className="btn-icon" title="Zoom in"><ZoomInIcon /></button>
                        </div>
                        <div className="pdf-page-nav">
                            <button onClick={() => changePage(initialPage - 1)} disabled={initialPage <= 1} className="btn-icon" title="Previous page"><PrevMoveIcon /></button>
                             <div className="page-input-container">
                                <input type="text" inputMode="numeric" value={pageInput} onChange={handlePageInputChange} onBlur={handleJumpToPage} onKeyDown={handlePageInputKeyDown} className="page-input" />
                                <span className="page-total">/ {pdfDoc?.numPages || '...'}</span>
                            </div>
                            <button onClick={() => changePage(initialPage + 1)} disabled={initialPage >= (pdfDoc?.numPages || Infinity)} className="btn-icon" title="Next page"><NextMoveIcon /></button>
                        </div>
                    </div>
                    <button className="btn-icon btn-confirm" onClick={handleConfirmCrop} disabled={!completedCrop?.width || !completedCrop?.height || isConfirming} title="Confirm selection and start analysis">
                        {isConfirming ? <div className="spinner-small" style={{ borderColor: 'rgba(255,255,255,0.3)', borderBottomColor: '#fff' }}></div> : <CheckIcon />}
                    </button>
                </div>
                 <div className="pdf-page-view" ref={pageViewRef}>
                    {imgSrc && (
                        <div className="pdf-page-wrapper">
                            <ReactCrop
                                crop={crop}
                                onChange={c => setCrop(c)}
                                onComplete={c => setCompletedCrop(c)}
                            >
                                <img
                                    ref={imgRef}
                                    src={imgSrc}
                                    alt={`Page ${initialPage}`}
                                    style={{
                                        display: 'block',
                                        width: imgNaturalSize.width ? `${imgNaturalSize.width * zoom}px` : 'auto',
                                        height: 'auto',
                                    }}
                                />
                            </ReactCrop>
                            <div className="puzzle-overlay-container">
                                {boundingBoxesForCurrentPage.map((bbox, index) => (
                                    <div
                                        key={index}
                                        className="puzzle-overlay"
                                        style={{
                                            left: `${bbox.x * 100}%`,
                                            top: `${bbox.y * 100}%`,
                                            width: `${bbox.width * 100}%`,
                                            height: `${bbox.height * 100}%`,
                                        }}
                                        onClick={() => handlePuzzleClick(bbox)}
                                        title="Click to load this puzzle"
                                    >
                                        <div className="puzzle-overlay-text">{index + 1}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PdfView;