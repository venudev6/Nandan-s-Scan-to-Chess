/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect } from 'react';
import { UploadIcon, CameraIcon, PdfIcon, TargetIcon, AdviceIcon, TrashIcon, HistoryIcon, CloudIcon, CloudCheckIcon, CloudErrorIcon } from '../ui/Icons';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import './InitialView.css';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../ui/Logo';
import UserMenu from '../ui/UserMenu';
import { useAppSettings } from '../../hooks/useAppSettings';
import { SAMPLE_FEN, SAMPLE_IMAGE_DATA_URL } from '../../lib/sampleData';
import type { StoredPdf } from '../../lib/types';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import { authService } from '../../lib/authService';

type AppSettingsHook = ReturnType<typeof useAppSettings>;

const DriveStatusIcon = ({ status, onRetry, disabled }: { status: StoredPdf['syncStatus'], onRetry: (e: React.MouseEvent) => void, disabled: boolean }) => {
    const handleClick = (e: React.MouseEvent) => {
        if (!disabled) {
            onRetry(e);
        }
    };
    
    const isClickable = !disabled && (status === 'local' || status === 'error');
    
    switch (status) {
        case 'syncing':
            return <div className="drive-status-icon syncing"><div className="spinner-small"></div></div>;
        case 'synced':
            return <div className="drive-status-icon synced"><CloudCheckIcon /></div>;
        case 'error':
            return <div className={`drive-status-icon error ${!isClickable ? 'disabled' : ''}`} onClick={handleClick}><CloudErrorIcon /></div>;
        case 'local':
        default:
            return <div className={`drive-status-icon local ${!isClickable ? 'disabled' : ''}`} onClick={handleClick}><CloudIcon /></div>;
    }
};

const getTooltipTextForStatus = (status: StoredPdf['syncStatus'], isGoogleUser: boolean) => {
    if (!isGoogleUser) {
        return "Log in with Google to enable Drive sync.";
    }
    switch (status) {
        case 'syncing': return "Syncing to Google Drive...";
        case 'synced': return "Synced to 'AAA Chess to Scan' folder in your Google Drive.";
        case 'error': return "Sync failed. Click to retry.";
        case 'local':
        default: return "Click to sync to Google Drive.";
    }
};


interface InitialViewProps {
    onFileSelect: (file: File) => void;
    onPdfSelect: (file: File) => void;
    onCameraSelect: () => void;
    onFenLoad: (fen: string, imageUrl: string) => void;
    onStoredPdfSelect: (id: number) => void;
    onDeletePdf: (id: number) => void;
    onSyncRetry: (id: number) => void;
    onSavedGamesClick: () => void;
    onHistoryClick: () => void;
    onProfileClick: () => void;
    storedPdfs: StoredPdf[];
    isProcessingPdf: boolean;
    onAuthRequired: () => void;
    appSettings: AppSettingsHook;
    onAdminPanelClick: () => void;
    isCameraAvailable: boolean;
}

export const InitialView = ({
    onFileSelect, onPdfSelect, onCameraSelect, onFenLoad, onSavedGamesClick, onHistoryClick, onProfileClick, storedPdfs,
    isProcessingPdf, onAuthRequired, appSettings, onAdminPanelClick, onStoredPdfSelect, onDeletePdf, onSyncRetry,
    isCameraAvailable
}: InitialViewProps) => {
    const { user, isLoggedIn, logout } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pdfInputRef = useRef<HTMLInputElement>(null);
    const [pdfToDelete, setPdfToDelete] = useState<StoredPdf | null>(null);
    const [isUserGoogle, setIsUserGoogle] = useState(false);
    const version = "1.3.0";
    const build = "20240923.1";

    useEffect(() => {
        if (user) {
            authService.isGoogleUser(user).then(setIsUserGoogle);
        } else {
            setIsUserGoogle(false);
        }
    }, [user]);

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
    
    const handleRetryClick = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        onSyncRetry(id);
    };

    return (
        <div className="card initial-view-card" {...dragHandlers}>
            <header className="initial-view-header">
                 {isLoggedIn ? (
                    <UserMenu user={user!} onLogout={logout} onAdminPanelClick={onAdminPanelClick} onSavedGamesClick={onSavedGamesClick} onHistoryClick={onHistoryClick} onProfileClick={onProfileClick} appSettings={appSettings} />
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
                <button 
                    className="btn btn-primary" 
                    onClick={onCameraSelect} 
                    disabled={!isCameraAvailable}
                    title={isCameraAvailable ? "Use your device's camera to scan a board" : "No camera detected on this device"}
                >
                    <CameraIcon /> Use Camera
                </button>
            </div>

            {!isCameraAvailable && (
                <p className="camera-unavailable-message">
                    Camera support is not available on this device.
                </p>
            )}
            
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
                                    {isLoggedIn && user && (
                                        <div className="tooltip-container">
                                            <DriveStatusIcon status={pdf.syncStatus} onRetry={(e) => handleRetryClick(e, pdf.id)} disabled={!isUserGoogle} />
                                            <span className="tooltip-text">{getTooltipTextForStatus(pdf.syncStatus, isUserGoogle)}</span>
                                        </div>
                                    )}
                                    <span>{pdf.name}</span>
                                    <div className="tooltip-container">
                                        <button 
                                            onClick={(e) => handleDeletePdfClick(e, pdf)} 
                                            aria-label={`Delete ${pdf.name}`}>
                                            <TrashIcon />
                                        </button>
                                        <span className="tooltip-text">Delete PDF</span>
                                    </div>
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

            <footer className="initial-view-footer">
                Version {version} (Build {build})
            </footer>
        </div>
    );
};