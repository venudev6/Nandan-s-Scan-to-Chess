/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Chess } from 'chess.js';

// Import all the different "views" or "screens" of the application.
import { InitialView } from '../views/InitialView';
import CameraView from '../views/CameraView';
import ImagePreview from '../views/ImagePreview';
import PdfView from '../views/PdfView';
import LoadingView from '../views/LoadingView';
import ResultView from '../views/ResultView';
import SolveView from '../views/SolveView';
import ErrorView from '../views/ErrorView';
import SavedGamesView from '../views/SavedGamesView';
import HistoryView from '../views/HistoryView';
import ProfileView from '../views/ProfileView';


import { soundManager } from '../../lib/SoundManager';
import { analyzeImagePosition } from '../../lib/gemini';
import { authService, googleDriveService } from '../../lib/authService';
import { useAppSettings } from '../../hooks/useAppSettings';
import { usePdfManager } from '../../hooks/usePdfManager';
// FIX: 'generateBoardThumbnail' is exported from 'lib/utils', not 'lib/fenUtils'.
import { fenToBoardState } from '../../lib/fenUtils';
import { dataUrlToBlob, computeImageHash, generateBoardThumbnail } from '../../lib/utils';
import { db } from '../../lib/db';
import type { AppState, PieceColor, AnalysisDetails, HistoryEntry, User } from '../../lib/types';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';

type AnalysisResult = {
    fen: string;
    turn: PieceColor;
    details: AnalysisDetails;
    scanDuration: number | null;
};

type AppSettingsHook = ReturnType<typeof useAppSettings>;

interface ProtectedAppProps {
    onScanComplete: () => void;
    isGuestPastTrial: boolean;
    onAuthRequired: () => void;
    appState: AppState;
    setAppState: (state: AppState) => void;
    previousAppState: AppState;
    appSettings: AppSettingsHook;
    onAdminPanelClick: () => void;
    onSavedGamesClick: () => void;
    onHistoryClick: () => void;
    onProfileClick: () => void;
    triggerUpload: boolean;
    onUploadTriggered: () => void;
}


/**
 * This component contains the entire application logic that is only accessible
 * to logged-in users or guest users in their trial session.
 */
export const ProtectedApp = ({
    onScanComplete, isGuestPastTrial, onAuthRequired,
    appState, setAppState, previousAppState, appSettings, onAdminPanelClick,
    onSavedGamesClick, onHistoryClick, onProfileClick, triggerUpload, onUploadTriggered
}: ProtectedAppProps) => {
    // --- STATE MANAGEMENT ---
    const { user, isLoggedIn, logout, driveAccessToken, authorizeDrive } = useAuth();

    const [imageData, setImageData] = useState<File | null>(null);
    const [croppedImageDataUrl, setCroppedImageDataUrl] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pdfContext, setPdfContext] = useState<{ page: number, totalPages: number } | null>(null);
    const [isRescanning, setIsRescanning] = useState(false);
    const [rescanCounter, setRescanCounter] = useState(0);
    const [initialGameHistory, setInitialGameHistory] = useState<HistoryEntry[] | null>(null);
    const [loadedGameId, setLoadedGameId] = useState<number | undefined>(undefined);
    const [scanFailed, setScanFailed] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("Initializing...");
    const [loadingTiles, setLoadingTiles] = useState<string[]>([]);
    const [pdfToSync, setPdfToSync] = useState<number | null>(null);
    const [isCameraAvailable, setIsCameraAvailable] = useState<boolean>(true);
    const [recoveryScan, setRecoveryScan] = useState<{ fen: string, timestamp: number } | null>(null);
    const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);


    // FIX: Refactored to fix "used before declaration" error. The sync logic is now handled in this component.
    const {
        storedPdfs, isProcessingPdf, selectedPdf,
        loadStoredPdfs, handlePdfSelect: baseHandlePdfSelect, handleStoredPdfSelect, handleDeletePdf, handlePdfStateChange, clearSelectedPdf
    } = usePdfManager({ setAppState, setError, user });
    
     // --- GOOGLE DRIVE SYNC LOGIC ---
    const syncPdfToDriveWithAuth = useCallback(async (pdfId: number) => {
        if (!user) { 
            return;
        }

        const isGoogle = await authService.isGoogleUser(user);
        if (!isGoogle) {
            // Silently fail for non-google users, the UI should prevent this.
            console.log("Drive sync is only available for Google users.");
            return;
        }


        const performSync = async (token: string) => {
            try {
                await db.updatePdfDriveInfo(pdfId, 'syncing');
                await loadStoredPdfs();
                const pdfRecord = await db.getPdf(pdfId);
                const driveId = await googleDriveService.uploadFile(pdfRecord.data, token);
                await db.updatePdfDriveInfo(pdfId, 'synced', driveId);
                await loadStoredPdfs();
            } catch (error) {
                console.error(`Failed to sync PDF ${pdfId}:`, error);
                await db.updatePdfDriveInfo(pdfId, 'error');
                await loadStoredPdfs();
            }
        };

        if (driveAccessToken) {
            await performSync(driveAccessToken);
        } else {
            setPdfToSync(pdfId);
            //authorizeDrive();
        }
    }, [user, driveAccessToken, authorizeDrive, loadStoredPdfs]);

    useEffect(() => {
        if (driveAccessToken && pdfToSync !== null) {
            syncPdfToDriveWithAuth(pdfToSync);
            setPdfToSync(null);
        }
    }, [driveAccessToken, pdfToSync, syncPdfToDriveWithAuth]);

    // Effect to sync any unsynced local files when a user logs in (moved from usePdfManager).
    useEffect(() => {
        const syncLocalFiles = async () => {
            if (user) {
                const isGoogle = await authService.isGoogleUser(user);
                if (isGoogle) {
                    await db.init();
                    const pdfsToSync = await db.getAllPdfs();
                    for (const pdf of pdfsToSync) {
                        if (pdf.syncStatus === 'local' || pdf.syncStatus === 'error') {
                            syncPdfToDriveWithAuth(pdf.id);
                        }
                    }
                }
            }
        };
        syncLocalFiles();
    }, [user, syncPdfToDriveWithAuth]);


    // --- DATA LOADING & INITIALIZATION ---
    useEffect(() => {
        loadStoredPdfs();

        // Check for camera availability
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            navigator.mediaDevices.enumerateDevices()
                .then(devices => {
                    const hasCamera = devices.some(device => device.kind === 'videoinput');
                    setIsCameraAvailable(hasCamera);
                })
                .catch(err => {
                    console.error("Error enumerating devices:", err);
                    setIsCameraAvailable(false);
                });
        } else {
            setIsCameraAvailable(false);
        }

        let soundInitialized = false;
        const initializeSoundOnInteraction = () => {
            if (!soundInitialized) {
                soundManager.init();
                soundInitialized = true;
            }
            window.removeEventListener('pointerdown', initializeSoundOnInteraction);
        };
        window.addEventListener('pointerdown', initializeSoundOnInteraction);

        return () => window.removeEventListener('pointerdown', initializeSoundOnInteraction);
    }, [loadStoredPdfs]);
    
    // Play an error sound whenever an error is set.
    useEffect(() => {
        if (error) {
            soundManager.play('ERROR');
        }
    }, [error]);

    // --- NAVIGATION & STATE RESET ---
    const resetToInitial = useCallback(() => {
        setImageData(null);
        setAnalysisResult(null);
        setError(null);
        setPdfContext(null);
        clearSelectedPdf();
        setInitialGameHistory(null);
        setLoadedGameId(undefined);
        setLoadingTiles([]);
        setAppState('initial');
    }, [setAppState, clearSelectedPdf]);

    // --- IMAGE & ANALYSIS WORKFLOW ---
    const handleFileSelect = (file: File) => {
        if (isGuestPastTrial) return onAuthRequired();
        setImageData(file);
        setAppState('preview');
    };

    // Wrapper for handlePdfSelect to trigger Drive sync after a PDF is saved.
    const handlePdfSelect = async (file: File) => {
        const newId = await baseHandlePdfSelect(file);
        if (newId && user) {
            syncPdfToDriveWithAuth(newId);
        }
    };

    const handleCameraSelect = () => {
        if (isGuestPastTrial) return onAuthRequired();
        setAppState('camera');
    };
    
    const handleFenLoad = async (fen: string, imageUrl: string) => {
        if (isGuestPastTrial) return onAuthRequired();
        try {
            const blob = await dataUrlToBlob(imageUrl);
            const file = new File([blob], 'sample.png', { type: 'image/png' });
            setImageData(file);
            setCroppedImageDataUrl(imageUrl);
            setAnalysisResult({ fen, turn: fenToBoardState(fen).turn, details: { confidence: null, reasoning: null, uncertainSquares: [] }, scanDuration: null });
            setAppState('result');
        } catch (e) {
            console.error("Failed to load sample image", e);
            setError("Could not load the sample image.");
            setAppState('error');
        }
    };

    const handleCropConfirm = async (file: File) => {
        setScanFailed(false);
        setLoadingTiles([]);
        setLoadingMessage("Slicing image...");
        setAppState('loading');
        
        const totalStartTime = performance.now();
        let timings: any = { image_hashing_ms: 0 };
    
        try {
            const hashStart = performance.now();
            const boardHash = await computeImageHash(file);
            timings.image_hashing_ms = performance.now() - hashStart;

            // --- CACHE CHECK ---
            const cachedResult: AnalysisResult | null = await db.getKeyValue(`fen_cache_${boardHash}`);
            if (cachedResult) {
                console.log("CACHE HIT:", boardHash);
                setAnalysisResult(cachedResult);
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onloadend = () => {
                    setCroppedImageDataUrl(reader.result as string);
                };
                onScanComplete();
                setAppState('result');
                return; // Exit early
            }
            console.log("CACHE MISS:", boardHash);
            // --- END CACHE CHECK ---
            
            setLoadingMessage("Detecting board...");
            
            const result = await analyzeImagePosition(file, boardHash, false, (slicedTiles) => {
                // Create a placeholder for empty squares to show in the loading preview.
                const placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/%3E';
                const displayTiles = slicedTiles.map(tile =>
                    tile.dataUrl === 'empty' ? placeholder : (tile.dataUrl as string)
                );
                setLoadingTiles(displayTiles);
                setLoadingMessage("Analyzing with Gemini...");
            });
            
            const validationStartTime = performance.now();
            try {
                new Chess(result.fen);
            } catch (chessError) {
                throw new Error(`chessjs_validation_failed: ${chessError instanceof Error ? chessError.message : String(chessError)}`);
            }
    
            timings.total_scan_ms = performance.now() - totalStartTime;

            const timingSummary = {
                image_hashing_ms: Math.round(timings.image_hashing_ms),
                board_detection_ms: Math.round(result.timings.board_detection_ms),
                perspective_warp_ms: Math.round(result.timings.perspective_warp_ms),
                tile_slicing_ms: Math.round(result.timings.tile_slicing_ms),
                gemini_classification_ms: Math.round(result.timings.gemini_classification_ms),
                post_processing_ms: Math.round(result.timings.post_processing_ms),
                total_scan_ms: Math.round(timings.total_scan_ms),
            };
            
            const finalAnalysisResult: AnalysisResult = {
                fen: result.fen,
                turn: result.turn,
                details: {
                    ...result.details,
                    timingSummary,
                },
                scanDuration: timings.total_scan_ms / 1000,
            };

            // --- SAVE TO CACHE ---
            await db.saveKeyValue(`fen_cache_${boardHash}`, finalAnalysisResult);
            await db.saveKeyValue('lastValidScan', { fen: result.fen, timestamp: Date.now() });
            // --- END SAVE TO CACHE ---
    
            setAnalysisResult(finalAnalysisResult);
    
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                setCroppedImageDataUrl(reader.result as string);
            };
            
            onScanComplete();
            setAppState('result');
        } catch (e) {
            let failureReason = 'unknown_error';
            if (e instanceof Error) {
                 if (e.message.includes('chessjs_validation_failed')) {
                    failureReason = 'chessjs_validation_failed';
                } else if (e.message.includes('Scan validation failed')) {
                    failureReason = 'illegal_piece_count';
                } else {
                    failureReason = 'gemini_api_error';
                }
            }

            console.error("Analysis Pipeline Failed. Reason:", failureReason, "Error:", e);
            setLoadingMessage(""); 

            const lastScan = await db.getKeyValue<{ fen: string, timestamp: number }>('lastValidScan');
            if (lastScan) {
                setRecoveryScan(lastScan);
                setShowRecoveryDialog(true);
            } else {
                setScanFailed(true);
            }
        }
    };
    
    const handlePdfCropConfirm = async (file: File, context: { page: number, totalPages: number }) => {
        setPdfContext(context);
        await handleCropConfirm(file);
    };

    const handleRescan = async () => {
        if (!croppedImageDataUrl) return;
        setIsRescanning(true);
        try {
            const blob = await dataUrlToBlob(croppedImageDataUrl);
            const file = new File([blob], 'rescan.webp', { type: 'image/webp' });
            
            const startTime = performance.now();
            const boardHash = await computeImageHash(file);
            const result = await analyzeImagePosition(file, boardHash, true); // Use the retry flag
            const scanDuration = (performance.now() - startTime) / 1000;

            setAnalysisResult({
                fen: result.fen,
                turn: result.turn,
                details: result.details,
                scanDuration: scanDuration,
            });
            setRescanCounter(c => c + 1);
        } catch(e) {
            console.error("Rescan failed", e);
            alert("Rescan failed. Please try starting over.");
        } finally {
            setIsRescanning(false);
        }
    };

    const handleAnalyze = (fen: string) => {
        setAnalysisResult({ ...analysisResult!, fen });
        setInitialGameHistory(null);
        setLoadedGameId(undefined);
        setAppState('solve');
    };
    
    const handleNextPuzzle = () => {
        if (pdfContext && selectedPdf) {
            setAppState('pdfViewer');
        } else {
            resetToInitial();
        }
    };

    const handleSavedGameSelect = async (id: number) => {
        try {
            const game = await db.getGame(id);
            setAnalysisResult({
                fen: game.initialFen,
                turn: fenToBoardState(game.initialFen).turn,
                details: { confidence: null, reasoning: 'Loaded from saved games.', uncertainSquares: [] },
                scanDuration: null,
            });
            setInitialGameHistory(game.moveHistory);
            setLoadedGameId(id);
            setAppState('solve');
        } catch (e) {
            console.error("Failed to load saved game:", e);
            setError("Could not load the selected game.");
            setAppState('error');
        }
    };

    const handleHistorySelect = async (id: number) => {
        try {
            const game = await db.getHistory(id);
            setAnalysisResult({
                fen: game.initialFen,
                turn: fenToBoardState(game.initialFen).turn,
                details: { confidence: null, reasoning: 'Loaded from history.', uncertainSquares: [] },
                scanDuration: null,
            });
            setInitialGameHistory(game.moveHistory);
            setLoadedGameId(id);
            setAppState('solve');
        } catch (e) {
            console.error("Failed to load game from history:", e);
            setError("Could not load the selected game from history.");
            setAppState('error');
        }
    };
    
    const handleBack = () => {
        setAppState(previousAppState);
    };

    const handleConfirmRecovery = () => {
        if (recoveryScan) {
            const thumb = generateBoardThumbnail(recoveryScan.fen);
            handleFenLoad(recoveryScan.fen, thumb);
        }
        setShowRecoveryDialog(false);
        setRecoveryScan(null);
    };

    const handleDeclineRecovery = () => {
        setShowRecoveryDialog(false);
        setRecoveryScan(null);
        setScanFailed(true);
    };


    // Render logic for different application states
    const renderContent = () => {
        switch (appState) {
            case 'initial':
                return (
                    <InitialView
                        onFileSelect={handleFileSelect}
                        onPdfSelect={handlePdfSelect}
                        onCameraSelect={handleCameraSelect}
                        onFenLoad={handleFenLoad}
                        onStoredPdfSelect={handleStoredPdfSelect}
                        onDeletePdf={handleDeletePdf}
                        onSavedGamesClick={onSavedGamesClick}
                        onHistoryClick={onHistoryClick}
                        onSyncRetry={syncPdfToDriveWithAuth}
                        storedPdfs={storedPdfs}
                        isProcessingPdf={isProcessingPdf}
                        onAuthRequired={onAuthRequired}
                        appSettings={appSettings}
                        onAdminPanelClick={onAdminPanelClick}
                        isCameraAvailable={isCameraAvailable}
                        onProfileClick={onProfileClick}
                        triggerUpload={triggerUpload}
                        onUploadTriggered={onUploadTriggered}
                    />
                );
            case 'camera':
                return <CameraView onCapture={handleFileSelect} onBack={resetToInitial} />;
            case 'preview':
                return imageData && <ImagePreview imageFile={imageData} onConfirm={handleCropConfirm} onBack={resetToInitial} />;
            case 'pdfViewer':
                return selectedPdf && <PdfView 
                    pdfId={selectedPdf.id}
                    pdfDoc={selectedPdf.doc} 
                    isDocLoading={isProcessingPdf}
                    initialPage={selectedPdf.lastPage}
                    initialZoom={selectedPdf.lastZoom}
                    onCropConfirm={handlePdfCropConfirm} 
                    onBack={resetToInitial} 
                    onStateChange={handlePdfStateChange}
                />;
            case 'loading':
                return <LoadingView onCancel={resetToInitial} scanFailed={scanFailed} onRetry={() => imageData && handleCropConfirm(imageData)} message={loadingMessage} imageFile={imageData} tiles={loadingTiles} />;
            case 'result':
                return analysisResult && (
                    <ResultView 
                        initialFen={analysisResult.fen} 
                        initialTurn={analysisResult.turn} 
                        originalImage={croppedImageDataUrl} 
                        onBack={resetToInitial} 
                        onAnalyze={handleAnalyze} 
                        analysisDetails={analysisResult.details}
                        scanDuration={analysisResult.scanDuration}
                        onRescan={handleRescan}
                        isRescanning={isRescanning}
                        onRescanComplete={rescanCounter}
                        user={user}
                        isLoggedIn={isLoggedIn}
                        onLogout={logout}
                        onAdminPanelClick={onAdminPanelClick}
                        onSavedGamesClick={onSavedGamesClick}
                        onHistoryClick={onHistoryClick}
                        onAuthRequired={onAuthRequired}
                        appSettings={appSettings}
                        onProfileClick={onProfileClick}
                    />
                );
            case 'solve':
                return analysisResult && (
                    <SolveView 
                        initialFen={analysisResult.fen}
                        scanDuration={analysisResult.scanDuration}
                        analysisDetails={analysisResult.details}
                        onBack={() => {
                            setInitialGameHistory(null);
                            setLoadedGameId(undefined);
                            setAppState('result');
                        }}
                        onHome={resetToInitial}
                        appSettings={appSettings}
                        onNextPuzzle={handleNextPuzzle}
                        source={pdfContext ? 'pdf' : 'image'}
                        initialHistory={initialGameHistory}
                        sourceView={previousAppState}
                        initialGameId={loadedGameId}
                        user={user}
                        isLoggedIn={isLoggedIn}
                        onLogout={logout}
                        onAdminPanelClick={onAdminPanelClick}
                        onSavedGamesClick={onSavedGamesClick}
                        onHistoryClick={onHistoryClick}
                        onAuthRequired={onAuthRequired}
                        onProfileClick={onProfileClick}
                    />
                );
            case 'savedGames':
                return <SavedGamesView onGameSelect={handleSavedGameSelect} onBack={handleBack} />;
             case 'history':
                return <HistoryView onGameSelect={handleHistorySelect} onBack={handleBack} />;
            case 'profile':
                return <ProfileView onBack={() => setAppState(previousAppState)} />;
            case 'error':
                return <ErrorView message={error || 'An unknown error occurred.'} onRetry={resetToInitial} />;
            default:
                return <div>Invalid state</div>;
        }
    };

    return (
        <>
            {renderContent()}
            <ConfirmationDialog
                isOpen={showRecoveryDialog}
                title="Scan Failed"
                message={`Analysis of the new image failed. Would you like to load the last successful scan from ${recoveryScan ? new Date(recoveryScan.timestamp).toLocaleString() : ''}?`}
                onConfirm={handleConfirmRecovery}
                onClose={handleDeclineRecovery}
                confirmText="Load Last Scan"
                cancelText="Show Failure Details"
            />
        </>
    );
};