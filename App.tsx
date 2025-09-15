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

const AppContent = () => {
    const { user, isLoggedIn, isLoading } = useAuth();
    const [authScreen, setAuthScreen] = useState<'login' | 'register' | 'pending_confirmation'>('login');
    const [isAdminView, setIsAdminView] = useState(false);
    const [showAuthFlow, setShowAuthFlow] = useState(false);
    const [pendingEmail, setPendingEmail] = useState<string | null>(null);
    const [appState, setAppState] = useState<AppState>('initial');

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
        }
        return () => { document.body.className = ''; };
    }, [appState, isLoggedIn]);

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
        setShowAuthFlow(true);
    };

    const handleSavedGamesClick = () => {
        soundManager.play('UI_CLICK');
        setAppState('savedGames');
    };
    
    const handleHistoryClick = () => {
        soundManager.play('UI_CLICK');
        setAppState('history');
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
        
        // Admins can access a special view.
        if (isLoggedIn && user?.role === 'admin' && isAdminView) {
            return <AdminView onBack={() => setIsAdminView(false)} />;
        }
        
        // If the auth flow should be shown (for a guest whose trial is over or user clicked login), show it.
        if (showAuthFlow && !isLoggedIn) {
             switch(authScreen) {
                case 'login':
                    return <LoginView 
                                onRegisterClick={() => setAuthScreen('register')} 
                                onCancel={() => setShowAuthFlow(false)}
                            />;
                case 'register':
                    return <RegisterView 
                                onLoginClick={() => setAuthScreen('login')}
                                onCancel={() => setShowAuthFlow(false)}
                                onRegisterSuccess={handleRegisterSuccess}
                            />;
                case 'pending_confirmation':
                    return <PendingConfirmationView 
                                email={pendingEmail!}
                                onConfirm={handleConfirmEmail}
                                onBackToLogin={() => setAuthScreen('login')}
                            />;
                default:
                    return <LoginView onRegisterClick={() => setAuthScreen('register')} onCancel={() => setShowAuthFlow(false)} />;
             }
        }

        // Otherwise, render the main protected application.
        return <ProtectedApp 
                    onScanComplete={handleScanComplete} 
                    isGuestPastTrial={isGuestPastTrial}
                    onAuthRequired={handleAuthRequired}
                    appState={appState}
                    setAppState={setAppState}
                    appSettings={appSettings}
                    onAdminPanelClick={() => setIsAdminView(true)}
                    onSavedGamesClick={handleSavedGamesClick}
                    onHistoryClick={handleHistoryClick}
                />;
    };
    
    return (
        <div className={`app-container theme-${appSettings.boardTheme}`}>
            <main className="app-main-content">
                {renderContent()}
            </main>
        </div>
    );
};

export default App;