/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef } from 'react';
import { UploadIcon, CameraIcon, PdfIcon, TargetIcon, AdviceIcon, TrashIcon, HistoryIcon } from '../ui/Icons';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import './InitialView.css';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../ui/Logo';
import UserMenu from '../ui/UserMenu';
import { useAppSettings } from '../../hooks/useAppSettings';
import { SAMPLE_FEN, SAMPLE_IMAGE_DATA_URL } from '../../lib/sampleData';
import type { StoredPdf } from '../../lib/types';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';

type AppSettingsHook = ReturnType<typeof useAppSettings>;

interface InitialViewProps {
    onFileSelect: (file: File) => void;
    onPdfSelect: (file: File) => void;
    onCameraSelect: () => void;
    onFenLoad: (fen: string, imageUrl: string) => void;
    onStoredPdfSelect: (id: number) => void;
    onDeletePdf: (id: number) => void;
    onSavedGamesClick: () => void;
    onHistoryClick: () => void;
    storedPdfs: StoredPdf[];
    isProcessingPdf: boolean;
    onAuthRequired: () => void;
    appSettings: AppSettingsHook;
    onAdminPanelClick: () => void;
}

export const InitialView = ({
    onFileSelect, onPdfSelect, onCameraSelect, onFenLoad, onSavedGamesClick, onHistoryClick, storedPdfs,
    isProcessingPdf, onAuthRequired, appSettings, onAdminPanelClick, onStoredPdfSelect, onDeletePdf
}: InitialViewProps) => {
    const { user, isLoggedIn, logout } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pdfInputRef = useRef<HTMLInputElement>(null);
    const [pdfToDelete, setPdfToDelete] = useState<StoredPdf | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, handler: (file: File) => void) => {
        if (e.target.files && e.target.files[0]) {
            handler(e.target.files[0]);
        }
    };

    const { isDragging, ...dragHandlers } = useDragAndDrop({
        onDrop: onFileSelect,
    });
    
    const handleDeletePdfClick = (e: React.MouseEvent, pdf: StoredPdf) => {
        e.stopPropagation(); // Prevent the li's onClick from firing
        setPdfToDelete(pdf);
    };

    const confirmDeletePdf = () => {
        if (pdfToDelete) {
            onDeletePdf(pdfToDelete.id);
            setPdfToDelete(null);
        }
    };

    return (
        <div className="card initial-view-card" {...dragHandlers}>
            <header className="initial-view-header">
                 {isLoggedIn ? (
                    <UserMenu user={user!} onLogout={logout} onAdminPanelClick={onAdminPanelClick} onSavedGamesClick={onSavedGamesClick} onHistoryClick={onHistoryClick} appSettings={appSettings} />
                 ) : (
                    <button className="btn btn-secondary" onClick={onAuthRequired}>Login / Sign Up</button>
                 )}
            </header>

            <div className="logo-container">
                <Logo />
            </div>
            
            <h1 className="main-title">Nandan's - Scan to Play Chess</h1>
            <p className="subtitle">Bring every chess position to life.</p>
            
            <ul className="feature-list">
                <li><CameraIcon /><span>Scan from a book, PDF, photo, or clipboard.</span></li>
                <li><TargetIcon /><span>Instant setup on the board.</span></li>
                <li><AdviceIcon /><span>Analyze, solve, and train with AI guidance.</span></li>
            </ul>

            <div className="button-group">
                <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} title="Upload an image of a chessboard from your device">
                    <UploadIcon /> Upload Image
                </button>
                <button className="btn btn-primary" onClick={() => pdfInputRef.current?.click()} disabled={isProcessingPdf} title="Upload a PDF with chess diagrams from your device">
                    {isProcessingPdf ? <div className="spinner-small"></div> : <PdfIcon />}
                    {isProcessingPdf ? 'Processing...' : 'Upload PDF'}
                </button>
                <button className="btn btn-primary" onClick={onCameraSelect} title="Use your device's camera to scan a board">
                    <CameraIcon /> Use Camera
                </button>
            </div>
            
            <p className="sample-link-container">
                Or, <a href="#" onClick={(e) => { e.preventDefault(); onFenLoad(SAMPLE_FEN, SAMPLE_IMAGE_DATA_URL); }}>try a sample position</a>, or paste an image (Ctrl+V).
            </p>

            <div className="stored-files-section">
                <h2>Recent PDFs</h2>
                {storedPdfs.length > 0 ? (
                    <ul className="stored-files-list">
                        {storedPdfs.map(pdf => (
                            <li key={pdf.id} onClick={() => onStoredPdfSelect(pdf.id)} title={`Open ${pdf.name}`}>
                                <div className="pdf-thumbnail-preview">
                                    {pdf.thumbnail ? (
                                        <img src={pdf.thumbnail} alt={`Thumbnail for ${pdf.name}`} />
                                    ) : (
                                        <div className="pdf-thumbnail-placeholder-icon"><PdfIcon /></div>
                                    )}
                                </div>
                                <div className="pdf-info">
                                    <span>{pdf.name}</span>
                                    <button 
                                        onClick={(e) => handleDeletePdfClick(e, pdf)} 
                                        aria-label={`Delete ${pdf.name}`} 
                                        title={`Delete ${pdf.name}`}>
                                        <TrashIcon />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="empty-state">
                       <PdfIcon />
                       <p>Your uploaded PDFs will appear here.</p>
                       <span>Upload a PDF to get started!</span>
                    </div>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileChange(e, onFileSelect)}
                accept="image/*"
                style={{ display: 'none' }}
            />
             <input
                type="file"
                ref={pdfInputRef}
                onChange={(e) => handleFileChange(e, onPdfSelect)}
                accept=".pdf"
                style={{ display: 'none' }}
            />
            {isDragging && <div className="drag-overlay"></div>}
            
            <ConfirmationDialog
                isOpen={!!pdfToDelete}
                title="Delete PDF"
                message={`Are you sure you want to permanently delete "${pdfToDelete?.name}"? This action cannot be undone.`}
                onConfirm={confirmDeletePdf}
                onClose={() => setPdfToDelete(null)}
            />
        </div>
    );
};
