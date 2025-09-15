/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authService } from '../lib/authService';
import type { User } from '../lib/types';

interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<User | null>;
    register: (email: string, pass: string) => Promise<{ success: boolean; message: string; }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            setIsLoading(true);
            try {
                // This simulates checking for an existing session token on app load
                const sessionUser = await authService.getCurrentUser();
                setUser(sessionUser);
            } catch (error) {
                console.error("No active session found.");
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        initializeAuth();
    }, []);
    
    const login = async (email: string, pass: string) => {
        const loggedInUser = await authService.login(email, pass);
        setUser(loggedInUser);
        return loggedInUser;
    };

    const register = async (email: string, pass: string) => {
        // Registration no longer automatically logs the user in.
        // It returns a status for the UI to handle (e.g., show "confirm email" message).
        return await authService.register(email, pass);
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const value = {
        user,
        isLoggedIn: !!user,
        isLoading,
        login,
        register,
        logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};