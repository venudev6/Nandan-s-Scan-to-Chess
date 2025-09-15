/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import type * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";
import { BackIcon, NextMoveIcon, PrevMoveIcon, CheckIcon, ZoomInIcon, ZoomOutIcon } from '../ui/Icons';
import { usePdfPageRenderer } from '../../hooks/usePdfPageRenderer';
import { usePdfThumbnails } from '../../hooks/usePdfThumbnails';
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
    
    // --- REFS ---
    const imgRef = useRef<HTMLImageElement>(null);
    const pageViewRef = useRef<HTMLDivElement>(null);

    // --- CUSTOM HOOKS ---
    const { imgSrc, isPageRendering, imgNaturalSize } = usePdfPageRenderer(pdfDoc, initialPage);
    const { thumbnails, thumbnailsListRef, thumbnailRefCallback } = usePdfThumbnails(pdfDoc, initialPage, isPageRendering);

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

        canvas.toBlob(blob => {
            if (blob) {
                onCropConfirm(
                    new File([blob], "cropped_puzzle.png", { type: "image/png" }),
                    { page: initialPage, totalPages: pdfDoc?.numPages || initialPage }
                );
            }
        }, "image/png");
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
            {(isDocLoading || isPageRendering) && (
                <div className="pdf-loading-overlay">
                    <div className="spinner"></div>
                    <p>{isDocLoading ? 'Loading PDF Document...' : 'Rendering Page...'}</p>
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
                    <button onClick={onBack} className="btn-icon" aria-label="Go Back" title="Go back to the home screen" disabled={isConfirming}><BackIcon/></button>
                    <div className="pdf-toolbar-center">
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
                    )}
                </div>
            </main>
        </div>
    );
};

export default PdfView;