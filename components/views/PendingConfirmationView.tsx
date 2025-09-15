/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { Logo } from '../ui/Logo';
import './LoginView.css'; // Re-use the same styles as LoginView

interface PendingConfirmationViewProps {
    email: string;
    onConfirm: () => Promise<boolean>;
    onBackToLogin: () => void;
}

const PendingConfirmationView = ({ email, onConfirm, onBackToLogin }: PendingConfirmationViewProps) => {
    const [isLoading, setIsLoading] = useState(false);
    
    const handleConfirmClick = async () => {
        setIsLoading(true);
        await onConfirm();
        setIsLoading(false);
    };

    return (
        <div className="card auth-card">
            <Logo />
            <h1 className="auth-title">Confirm Your Email</h1>
            <p className="auth-subtitle">
                We've sent a confirmation link to <strong>{email}</strong>. Please check your inbox and spam folder.
            </p>
            
            <div className="auth-form">
                <p className="mock-info">
                    (This is a mock environment. In a real app, you would click the link in your email. For now, just click the button below to simulate confirmation.)
                </p>
                <button 
                    onClick={handleConfirmClick}
                    className="btn btn-primary auth-submit-btn" 
                    disabled={isLoading}
                >
                    {isLoading ? <div className="spinner-small"></div> : 'Simulate Email Confirmation'}
                </button>
            </div>
            
            <p className="auth-footer-text">
                <a href="#" onClick={(e) => { e.preventDefault(); onBackToLogin(); }}>
                    Back to Sign In
                </a>
            </p>
        </div>
    );
};

export default PendingConfirmationView;