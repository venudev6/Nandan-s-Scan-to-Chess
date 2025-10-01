/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';

// Import global and shared stylesheets
import './styles/global.css';
import './styles/components.css';
import './styles/layouts.css';

// Import authentication components
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginView from './components/views/LoginView';
import RegisterView from './components/views/RegisterView';
// FIX: Changed to named import for ProtectedApp as its file was incomplete and causing export issues.
import { ProtectedApp } from './components/auth/ProtectedApp';
import AdminView from './components/views/AdminView';
import { useAppSettings } from './hooks/useAppSettings';
import PendingConfirmationView from './components/views/PendingConfirmationView';
import { authService } from './lib/authService';
import { AppState } from './lib/types';
import { soundManager } from './lib/SoundManager';
import ProfileView from './components/views/ProfileView';

const AppContent = () => {
    const { user, isLoggedIn, isLoading, authFlowVisible, requestAuthFlow, hideAuthFlow } = useAuth();
    const [authScreen, setAuthScreen] = useState<'login' | 'register' | 'pending_confirmation'>('login');
    const [pendingEmail, setPendingEmail] = useState<string | null>(null);
    const [appState, setAppState] = useState<AppState>('initial');
    const [previousAppState, setPreviousAppState] = useState<AppState>('initial');

     // --- CUSTOM HOOKS ---
    const appSettings = useAppSettings();
    
    // Track the number of scans a guest user has performed.
    const [scanCount, setScanCount] = useState(() => {
        return parseInt(localStorage.getItem('scanCount') || '0', 10);
    });

    // Add a class to the body based on the current app state for targeted CSS rules.
    useEffect(() => {
        document.body.className = `app-state-${appState}`;
        if (isLoggedIn) {
            document.body.classList.add('logged-in');
        } else {
            document.body.classList.remove('logged-in');
        }
    }, [appState, isLoggedIn]);

    const handleSetAppState = (newState: AppState) => {
        if (newState !== appState) {
            setPreviousAppState(appState);
            setAppState(newState);
        }
    };

    /**
     * This function is passed down to the main app. It's called when a guest
     * completes a successful analysis, incrementing their scan count.
     */
    const handleScanComplete = () => {
        if (!isLoggedIn) {
            const newCount = scanCount + 1;
            localStorage.setItem('scanCount', String(newCount));
            setScanCount(newCount);
        }
    };
    
    const handleRegisterSuccess = (email: string) => {
        setPendingEmail(email);
        setAuthScreen('pending_confirmation');
    };
    
    const handleConfirmEmail = async () => {
        if (!pendingEmail) return false;
        try {
            const user = await authService.getPendingUserByEmail(pendingEmail);
            if(user && user.confirmationToken){
                await authService.confirmEmail(user.confirmationToken);
                setAuthScreen('login');
                alert("Email confirmed successfully! You can now log in.");
                return true;
            }
        } catch (e) {
            console.error(e);
            alert("Failed to confirm email.");
        }
        return false;
    };

    const handleAuthRequired = () => {
        setAuthScreen('login');
        requestAuthFlow();
    };

    const handleSavedGamesClick = () => {
        soundManager.play('UI_CLICK');
        handleSetAppState('savedGames');
    };
    
    const handleHistoryClick = () => {
        soundManager.play('UI_CLICK');
        handleSetAppState('history');
    };

    const handleProfileClick = () => {
        soundManager.play('UI_CLICK');
        handleSetAppState('profile');
    };

    // A guest's trial is over once they have completed 10 or more scans.
    const isGuestPastTrial = !isLoggedIn && scanCount >= 10;

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="card loading-container">
                    <div className="spinner"></div>
                    <h3>Loading Application...</h3>
                </div>
            );
        }

        // The Admin view replaces the main app flow entirely.
        if (isLoggedIn && user?.role === 'admin' && appState === 'admin') {
            return <AdminView onBack={() => handleSetAppState(previousAppState)} />;
        }
        
        // Determine which auth screen to show in the overlay, if any.
        let authFlowComponent = null;
        if (authFlowVisible && !isLoggedIn) {
            switch(authScreen) {
                case 'login':
                    authFlowComponent = <LoginView 
                                        onRegisterClick={() => setAuthScreen('register')} 
                                        onCancel={hideAuthFlow}
                                    />;
                    break;
                case 'register':
                    authFlowComponent = <RegisterView 
                                        onLoginClick={() => setAuthScreen('login')}
                                        onCancel={hideAuthFlow}
                                        onRegisterSuccess={handleRegisterSuccess}
                                    />;
                    break;
                case 'pending_confirmation':
                    authFlowComponent = <PendingConfirmationView 
                                        email={pendingEmail!}
                                        onConfirm={handleConfirmEmail}
                                        onBackToLogin={() => setAuthScreen('login')}
                                    />;
                    break;
                default:
                    authFlowComponent = <LoginView onRegisterClick={() => setAuthScreen('register')} onCancel={hideAuthFlow} />;
            }
        }

        // Always render the main app, and render the auth flow as an overlay if needed.
        const mainApp = (
            <ProtectedApp 
                onScanComplete={handleScanComplete} 
                isGuestPastTrial={isGuestPastTrial}
                onAuthRequired={handleAuthRequired}
                appState={appState}
                setAppState={handleSetAppState}
                previousAppState={previousAppState}
                appSettings={appSettings}
                onAdminPanelClick={() => handleSetAppState('admin')}
                onSavedGamesClick={handleSavedGamesClick}
                onHistoryClick={handleHistoryClick}
                onProfileClick={handleProfileClick}
            />
        );

        return (
            <>
                {mainApp}
                {authFlowComponent && (
                    <div className="auth-flow-overlay">
                        {authFlowComponent}
                    </div>
                )}
            </>
        );
    };
    
    return (
        <div className={`app-container theme-${appSettings.boardTheme}`}>
            <main className="app-main-content">
                {renderContent()}
            </main>
        </div>
    );
};

/**
 * The main component of the application. It acts as a state machine,
 * managing the current view and passing data between different parts of the app.
 * It is now wrapped with an AuthProvider to manage user sessions.
 */
const App = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;