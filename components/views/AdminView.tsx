/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { authService } from '../../lib/authService';
import { BackIcon } from '../ui/Icons';
import type { User } from '../../lib/types';
import './AdminView.css';

interface AdminViewProps {
    onBack: () => void;
}

const AdminView = ({ onBack }: AdminViewProps) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            try {
                const userList = await authService.getAllUsers();
                setUsers(userList);
            } catch (err) {
                setError('Failed to fetch users.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, []);

    return (
        <div className="card admin-panel">
            <div className="admin-header">
                <h1>Admin Panel - Registered Users</h1>
                <button className="btn btn-secondary" onClick={onBack}>
                    <BackIcon /> Back to App
                </button>
            </div>

            {isLoading ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                </div>
            ) : error ? (
                <p className="auth-error-banner">{error}</p>
            ) : (
                <div className="user-table-container">
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>User ID</th>
                                <th>Email Address</th>
                                <th>Role</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`role-badge role-${user.role}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`role-badge status-badge status-${user.status}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminView;