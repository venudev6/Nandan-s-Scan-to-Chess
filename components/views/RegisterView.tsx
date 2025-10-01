/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../ui/Logo';
import { CloseIcon } from '../ui/Icons';
import './LoginView.css'; // Re-use the same styles as LoginView

interface RegisterViewProps {
    onLoginClick: () => void;
    onCancel: () => void;
    onRegisterSuccess: (email: string) => void;
}

const RegisterView = ({ onLoginClick, onCancel, onRegisterSuccess }: RegisterViewProps) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            await register(email, password);
            // On successful registration, show the pending confirmation view.
            onRegisterSuccess(email);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="card auth-card">
            <button className="modal-close-btn" onClick={onCancel} aria-label="Close">
                <CloseIcon />
            </button>
            <Logo />
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Get started with Scan to Chess.</p>
            
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
                        disabled={isLoading}
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
                        minLength={6}
                        disabled={isLoading}
                    />
                </div>
                 <div className="form-group">
                    <label htmlFor="confirm-password">Confirm Password</label>
                    <input
                        type="password"
                        id="confirm-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        disabled={isLoading}
                    />
                </div>
                <button type="submit" className="btn btn-primary auth-submit-btn" disabled={isLoading}>
                    {isLoading ? <div className="spinner-small"></div> : 'Create Account'}
                </button>
            </form>

            <p className="auth-footer-text">
                Already have an account?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); onLoginClick(); }}>
                    Sign In
                </a>
                <span className="footer-link-separator">·</span>
                <a href="#" onClick={(e) => { e.preventDefault(); onCancel(); }}>Cancel</a>
            </p>
        </div>
    );
};

export default RegisterView;
