/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

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

import { soundManager } from '../../lib/SoundManager';
import { analyzeImagePosition } from '../../lib/gemini';
import { useAppSettings } from '../../hooks/useAppSettings';
import { usePdfManager } from '../../hooks/usePdfManager';
import { fenToBoardState } from '../../lib/fenUtils';
import { dataUrlToBlob } from '../../lib/utils';
import { db } from '../../lib/db';
import type { AppState, PieceColor, AnalysisDetails, HistoryEntry, User } from '../../lib/types';

type AnalysisResult = {
    fen: string;
    turn: PieceColor;
    details: AnalysisDetails;
};

type AppSettingsHook = ReturnType<typeof useAppSettings>;

interface ProtectedAppProps {
    onScanComplete: () => void;
    isGuestPastTrial: boolean;
    onAuthRequired: () => void;
    appState: AppState;
    setAppState: (state: AppState) => void;
    appSettings: AppSettingsHook;
    onAdminPanelClick: () => void;
    onSavedGamesClick: () => void;
    onHistoryClick: () => void;
}


/**
 * This component contains the entire application logic that is only accessible
 * to logged-in users or guest users in their trial session.
 */
export const ProtectedApp = ({
    onScanComplete, isGuestPastTrial, onAuthRequired,
    appState, setAppState, appSettings, onAdminPanelClick,
    onSavedGamesClick, onHistoryClick
}: ProtectedAppProps) => {
    // --- STATE MANAGEMENT ---
    const { user, isLoggedIn, logout } = useAuth();

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
    const [previousAppState, setPreviousAppState] = useState<AppState>('initial');

    // --- CUSTOM HOOKS ---
    const {
        storedPdfs, isProcessingPdf, selectedPdf,
        loadStoredPdfs, handlePdfSelect, handleStoredPdfSelect, handleDeletePdf, handlePdfStateChange, clearSelectedPdf
    } = usePdfManager({ setAppState, setError });
    
    // --- DATA LOADING & INITIALIZATION ---
    useEffect(() => {
        loadStoredPdfs();

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
        setPreviousAppState('initial');
        setAppState('initial');
    }, [setAppState, clearSelectedPdf]);

    // --- IMAGE & ANALYSIS WORKFLOW ---
    const handleFileSelect = (file: File) => {
        if (isGuestPastTrial) return onAuthRequired();
        setImageData(file);
        setAppState('preview');
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
            setAnalysisResult({ fen, turn: fenToBoardState(fen).turn, details: { confidence: null, reasoning: null, uncertainSquares: [] } });
            setAppState('result');
        } catch (e) {
            console.error("Failed to load sample image", e);
            setError("Could not load the sample image.");
            setAppState('error');
        }
    };

    const handleCropConfirm = async (file: File) => {
        setAnalysisResult(null); // Clear previous result to ensure scanFailed is false initially
        setIsAnalyzing(true);
        setAppState('loading');
        
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            setCroppedImageDataUrl(reader.result as string);
        };
        
        try {
            const result = await analyzeImagePosition(file);
            setAnalysisResult(result);
            onScanComplete();
            setAppState('result');
        } catch (e) {
            console.error("Analysis failed:", e);
            setAppState('loading'); // Stay on loading but show failure message
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
            const file = new File([blob], 'rescan.png', { type: 'image/png' });
            const result = await analyzeImagePosition(file, true); // Pass true for retry
            setAnalysisResult(result);
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
        setPreviousAppState('result');
        setAppState('solve');
    };
    
    const handleNextPuzzle = () => {
        if (pdfContext && selectedPdf && pdfContext.page < pdfContext.totalPages) {
            handlePdfStateChange(selectedPdf.id, pdfContext.page + 1, selectedPdf.lastZoom);
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
                details: { confidence: 1, reasoning: 'Loaded from saved games.', uncertainSquares: [] }
            });
            setInitialGameHistory(game.moveHistory);
            setLoadedGameId(id);
            setPreviousAppState('savedGames');
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
                details: { confidence: 1, reasoning: 'Loaded from history.', uncertainSquares: [] }
            });
            setInitialGameHistory(game.moveHistory);
            setLoadedGameId(id);
            setPreviousAppState('history');
            setAppState('solve');
        } catch (e) {
            console.error("Failed to load game from history:", e);
            setError("Could not load the selected game from history.");
            setAppState('error');
        }
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
                        // FIX: Pass missing props to InitialView component.
                        storedPdfs={storedPdfs}
                        isProcessingPdf={isProcessingPdf}
                        onAuthRequired={onAuthRequired}
                        appSettings={appSettings}
                        onAdminPanelClick={onAdminPanelClick}
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
                        onRescan={handleRescan}
                        isRescanning={isRescanning}
                        onRescanComplete={rescanCounter}
                        user={user}
                        isLoggedIn={isLoggedIn}
                        onLogout={logout}
                        onAdminPanelClick={onAdminPanelClick}
                        onSavedGamesClick={onSavedGamesClick}
                        onHistoryClick={onHistoryClick}
                    />
                );
            case 'solve':
                return analysisResult && (
                    <SolveView 
                        initialFen={analysisResult.fen}
                        onBack={() => setAppState(previousAppState)}
                        onHome={resetToInitial}
                        analysisCooldown={appSettings.analysisCooldown}
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
                    />
                );
            case 'savedGames':
                return <SavedGamesView onGameSelect={handleSavedGameSelect} onBack={resetToInitial} />;
             case 'history':
                return <HistoryView onGameSelect={handleHistorySelect} onBack={resetToInitial} />;
            case 'error':
                return <ErrorView message={error || 'An unknown error occurred.'} onRetry={resetToInitial} />;
            default:
                return <div>Invalid state</div>;
        }
    };

    // FIX: Add return statement to the functional component.
    return renderContent();
};
