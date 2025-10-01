/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../ui/Logo';
import { HumanIcon, CloseIcon } from '../ui/Icons';
import { GOOGLE_CLIENT_ID } from '../../lib/config';
import './LoginView.css';

// TypeScript declarations for external libraries/environment variables
declare var google: any; // Google Identity Services library

interface LoginViewProps {
    onRegisterClick: () => void;
    onCancel: () => void;
}

const LoginView = ({ onRegisterClick, onCancel }: LoginViewProps) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isFormLoading, setIsFormLoading] = useState(false);
    const [isDemoLoading, setIsDemoLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(true);
    const { login } = useAuth();
    const googleButtonRef = useRef<HTMLDivElement>(null);

    
    useEffect(() => {
        setIsGoogleLoading(true);
        let buttonRendered = false;

        // The GSI library is loaded and initialized asynchronously by the script in index.html.
        // We need to poll for it to be ready before we can render the button.
        const renderInterval = setInterval(() => {
            if (typeof google !== 'undefined' && google.accounts && google.accounts.id && googleButtonRef.current) {
                // Check if a button is already there to prevent re-rendering which GSI dislikes.
                if (googleButtonRef.current.childElementCount === 0) {
                     try {
                        // The library is already initialized. We just need to render the button.
                        google.accounts.id.renderButton(
                            googleButtonRef.current,
                            { theme: "outline", size: "large", type: "standard", text: "signin_with", width: "320" }
                        );
                        buttonRendered = true;
                    } catch (error) {
                        console.error("Error rendering Google Sign-In button:", error);
                        setError("Could not render Google Sign-In button.");
                    }
                }
                
                // Once the library is found (and button rendered or failed), stop polling and loading.
                setIsGoogleLoading(false);
                clearInterval(renderInterval);
            }
        }, 100); // Check every 100ms

        // Set a timeout to stop loading if the GSI library fails to load.
        const timeoutId = setTimeout(() => {
            clearInterval(renderInterval);
            if (!buttonRendered) {
                setIsGoogleLoading(false);
                setError("Google Sign-In could not be loaded. Please try again later.");
            }
        }, 5000); // 5-second timeout

        // Cleanup function to clear intervals and timeouts.
        return () => {
            clearInterval(renderInterval);
            clearTimeout(timeoutId);
            if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
                // This is good practice to close any prompts if the component unmounts
                // while a GSI flow is active (e.g., user navigates away).
                google.accounts.id.cancel();
            }
        };
    }, []);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsFormLoading(true);
        try {
            await login(email, password);
            // On successful login, AuthContext will trigger a re-render in App.tsx
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsFormLoading(false);
        }
    };
    
    const handleDemoLogin = async () => {
        setError('');
        setIsDemoLoading(true);
        try {
            await login('user@example.com', 'password123');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to log in with demo account.');
        } finally {
            setIsDemoLoading(false);
        }
    };

    const anyLoading = isFormLoading || isDemoLoading || isGoogleLoading;

    return (
        <div className="card auth-card">
            <button className="modal-close-btn" onClick={onCancel} aria-label="Close">
                <CloseIcon />
            </button>
            <Logo />
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to continue to Scan to Chess.</p>
            
            <form onSubmit={handleSubmit} className="auth-form">
                {error && <div className="auth-error-banner">{error}</div>}
                <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={anyLoading}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={anyLoading}
                    />
                </div>
                <button type="submit" className="btn btn-primary auth-submit-btn" disabled={anyLoading}>
                    {isFormLoading ? <div className="spinner-small"></div> : 'Sign In'}
                </button>
            </form>

            <div className="auth-separator"><span>OR</span></div>
            
            <div className="google-btn-container">
                {isGoogleLoading && (
                    <div className="auth-loading-overlay">
                        <div className="spinner"></div>
                    </div>
                )}
                <div ref={googleButtonRef} id="googleSignInButton"></div>
            </div>


            <button type="button" className="btn btn-secondary auth-submit-btn" onClick={handleDemoLogin} disabled={anyLoading}>
                {isDemoLoading ? <div className="spinner-small"></div> : <HumanIcon />}
                {isDemoLoading ? 'Logging In...' : 'Log in with Demo Account'}
            </button>
            
            <p className="auth-footer-text">
                Don't have an account?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); onRegisterClick(); }}>
                    Sign Up
                </a>
                <span className="footer-link-separator">·</span>
                <a href="#" onClick={(e) => { e.preventDefault(); onCancel(); }}>Cancel</a>
            </p>
        </div>
    );
};

export default LoginView;