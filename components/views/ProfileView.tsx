/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BackIcon } from '../ui/Icons';
import './ProfileView.css';

interface ProfileViewProps {
    onBack: () => void;
}

const ProfileView = ({ onBack }: ProfileViewProps) => {
    const { user, updateUser } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [about, setAbout] = useState(user?.about || '');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setAbout(user.about || '');
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            await updateUser({ name, about });
            setSuccessMessage('Profile updated successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="card admin-panel">
                <p>You must be logged in to view this page.</p>
                <button className="btn btn-secondary" onClick={onBack}>Back</button>
            </div>
        );
    }

    return (
        <div className="card admin-panel profile-view">
            <div className="admin-header">
                <h1>My Profile</h1>
                <button className="btn btn-secondary" onClick={onBack}>
                    <BackIcon /> Back to App
                </button>
            </div>

            <form onSubmit={handleSubmit} className="profile-form">
                {error && <div className="auth-error-banner">{error}</div>}
                {successMessage && <div className="auth-success-banner">{successMessage}</div>}

                <div className="form-group">
                    <label htmlFor="profile-email">Email Address</label>
                    <input
                        id="profile-email"
                        type="email"
                        value={user.email}
                        disabled
                        readOnly
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="profile-name">Name</label>
                    <input
                        id="profile-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        required
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="profile-about">About Me</label>
                    <textarea
                        id="profile-about"
                        value={about}
                        onChange={(e) => setAbout(e.target.value)}
                        rows={4}
                        placeholder="Tell us a little about yourself (optional)"
                    />
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                        {isLoading ? <div className="spinner-small"></div> : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfileView;
