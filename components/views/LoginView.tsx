/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../ui/Logo';
import { HumanIcon } from '../ui/Icons';
import './LoginView.css';

interface LoginViewProps {
    onRegisterClick: () => void;
    onCancel: () => void;
}

const LoginView = ({ onRegisterClick, onCancel }: LoginViewProps) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDemoLoading, setIsDemoLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(email, password);
            // On successful login, AuthContext will trigger a re-render in App.tsx
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
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

    return (
        <div className="card auth-card">
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
                        disabled={isLoading || isDemoLoading}
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
                        disabled={isLoading || isDemoLoading}
                    />
                </div>
                <button type="submit" className="btn btn-primary auth-submit-btn" disabled={isLoading || isDemoLoading}>
                    {isLoading ? <div className="spinner-small"></div> : 'Sign In'}
                </button>
            </form>

            <div className="auth-separator"><span>OR</span></div>

            <button type="button" className="btn btn-secondary google-btn" onClick={handleDemoLogin} disabled={isLoading || isDemoLoading}>
                {isDemoLoading ? <div className="spinner-small"></div> : <><HumanIcon /> Log in with Demo Account</>}
            </button>
            
            <button className="btn btn-secondary google-btn" onClick={() => alert('Google Sign-In is not yet connected to a backend.')} disabled={isLoading || isDemoLoading}>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" />
                Sign in with Google
            </button>
            
            <p className="auth-footer-text">
                Don't have an account?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); onRegisterClick(); }}>
                    Sign Up
                </a>
                <span className="footer-link-separator">·</span>
                <a href="#" onClick={(e) => { e.preventDefault(); onCancel(); }}>Back to Home</a>
            </p>
        </div>
    );
};

export default LoginView;
