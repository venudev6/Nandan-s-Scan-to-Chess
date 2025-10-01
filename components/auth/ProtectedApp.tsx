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
import { fenToBoardState } from '../../lib/fenUtils';
import { dataUrlToBlob, imageToBase64 } from '../../lib/utils';
import { db } from '../../lib/db';
import type { AppState, PieceColor, AnalysisDetails, HistoryEntry, User } from '../../lib/types';

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
}


/**
 * This component contains the entire application logic that is only accessible
 * to logged-in users or guest users in their trial session.
 */
export const ProtectedApp = ({
    onScanComplete, isGuestPastTrial, onAuthRequired,
    appState, setAppState, previousAppState, appSettings, onAdminPanelClick,
    onSavedGamesClick, onHistoryClick, onProfileClick
}: ProtectedAppProps) => {
    // --- STATE MANAGEMENT ---
    const { user, isLoggedIn, logout, driveAccessToken, authorizeDrive } = useAuth();
    const analysisCache = useRef(new Map<string, AnalysisResult>());

    const [imageData, setImageData] = useState<File | null>(null);
    const [croppedImageDataUrl, setCroppedImageDataUrl] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pdfContext, setPdfContext] = useState<{ page: number, totalPages: number } | null>(null);
    const [isRescanning, setIsRescanning] = useState(false);
    const [rescanCounter, setRescanCounter] = useState(0);
    const [initialGameHistory, setInitialGameHistory] = useState<HistoryEntry[] | null>(null);
    const [loadedGameId, setLoadedGameId] = useState<number | undefined>(undefined);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [pdfToSync, setPdfToSync] = useState<number | null>(null);
    const [isCameraAvailable, setIsCameraAvailable] = useState<boolean>(true);


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

    // --- NAVIGATION & STATE RESET ---
    const resetToInitial = useCallback(() => {
        setImageData(null);
        setAnalysisResult(null);
        setError(null);
        setPdfContext(null);
        clearSelectedPdf();
        setInitialGameHistory(null);
        setLoadedGameId(undefined);
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
    
    const handleFenLoad = (fen: string, imageUrl: string) => {
        if (isGuestPastTrial) return onAuthRequired();
        try {
            const blob = dataUrlToBlob(imageUrl);
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
        // 1. Check cache first
        const base64Image = await imageToBase64(file);
        if (analysisCache.current.has(base64Image)) {
            const cachedResult = analysisCache.current.get(base64Image)!;
            setAnalysisResult(cachedResult);
            // We still need to set the image URL for the result view
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                setCroppedImageDataUrl(reader.result as string);
            };
            setAppState('result');
            return;
        }
    
        setAnalysisResult(null);
        setIsAnalyzing(true);
        setAppState('loading');
    
        const startTime = performance.now();
    
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            setCroppedImageDataUrl(reader.result as string);
        };
    
        try {
            let result;
            // Tier 1: High accuracy pass
            try {
                console.log("Attempting high-accuracy analysis...");
                result = await analyzeImagePosition(file, false);
                // Validate FEN from first pass
                new Chess(result.fen); // This will throw if invalid
            } catch (e) {
                console.warn("High-accuracy analysis failed or returned invalid FEN. Retrying...", e);
                // Tier 2: Retry pass on failure
                result = await analyzeImagePosition(file, true);
                new Chess(result.fen); // Validate FEN from retry pass too
            }
    
            const endTime = performance.now();
            const duration = (endTime - startTime) / 1000;
    
            const finalResult = { ...result, scanDuration: duration };
            setAnalysisResult(finalResult);
            analysisCache.current.set(base64Image, finalResult); // Cache successful result
            onScanComplete();
            setAppState('result');
        } catch (e) {
            console.error("Analysis failed on both tiers:", e);
            setAppState('loading');
        } finally {
            setIsAnalyzing(false);
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
            const blob = dataUrlToBlob(croppedImageDataUrl);
            const file = new File([blob], 'rescan.webp', { type: 'image/webp' });
            const startTime = performance.now();
            // Force a retry analysis on rescan
            const result = await analyzeImagePosition(file, true); 
            const endTime = performance.now();
            const duration = (endTime - startTime) / 1000;
            setAnalysisResult({ ...result, scanDuration: duration });
            setRescanCounter(c => c + 1); // Increment counter to trigger effect in ResultView
        } catch(e) {
            console.error("Rescan failed", e);
            alert("Rescan failed. Please try starting over.");
        } finally {
            setIsRescanning(false);
        }
    };

    const handleAnalyze = (fen: string) => {
        setAnalysisResult({ ...analysisResult!, fen });
        // When moving from Result to Solve, clear any loaded game history
        // to ensure it's treated as a new game to be saved.
        setInitialGameHistory(null);
        setLoadedGameId(undefined);
        setAppState('solve');
    };
    
    const handleNextPuzzle = () => {
        // If the puzzle came from a PDF, go back to the PDF viewer on the same page.
        if (pdfContext && selectedPdf) {
            // The `selectedPdf` state already holds the correct page number.
            // Just switch the view back to the PDF viewer.
            setAppState('pdfViewer');
        } else {
            // If it wasn't from a PDF (e.g., image upload, camera), go back to the initial screen.
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
        soundManager.play('UI_CLICK');
        setAppState(previousAppState);
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
                // Pass a boolean to indicate whether the analysis failed. analysisResult will be null on first scan, and not null on subsequent successful scans.
                return <LoadingView onCancel={resetToInitial} scanFailed={!isAnalyzing && !analysisResult} onRetry={handleRescan} />;
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
                        onBack={() => setAppState(previousAppState)}
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

    return renderContent();
};