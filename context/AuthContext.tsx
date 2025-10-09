/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { createContext, useState, useContext, useEffect, ReactNode, PropsWithChildren } from 'react';
import { authService } from '../lib/authService';
import { GOOGLE_CLIENT_ID, GOOGLE_DRIVE_SCOPE } from '../lib/config';
import type { User } from '../lib/types';

declare var google: any;
declare global {
    interface Window {
        onGoogleSignIn: (credential: string) => void;
    }
}


const MOCK_SESSION_KEY = 'mock_session';

interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<User | null>;
    loginWithGoogle: (credential: string) => Promise<User | null>;
    register: (email: string, pass: string) => Promise<{ success: boolean; message: string; }>;
    logout: () => void;
    updateUser: (updatedDetails: { name?: string, about?: string, photoUrl?: string }) => Promise<User>;
    authFlowVisible: boolean;
    requestAuthFlow: () => void;
    hideAuthFlow: () => void;
    driveAccessToken: string | null;
    authorizeDrive: () => void;
    setPin: (pin: string) => Promise<User>;
    verifyPin: (pin: string) => Promise<boolean>;
    requestPinReset: () => Promise<string>;
    resetPin: (token: string, newPin: string) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple, dependency-free JWT decoder
const jwtDecode = (token: string) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
};


// FIX: Updated component props to use PropsWithChildren to fix type error in App.tsx.
export const AuthProvider = ({ children }: PropsWithChildren) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authFlowVisible, setAuthFlowVisible] = useState(false);
    const [driveAccessToken, setDriveAccessToken] = useState<string | null>(null);
    const [tokenClient, setTokenClient] = useState<any>(null);

    useEffect(() => {
        const initializeAuth = async () => {
            setIsLoading(true);
            try {
                const sessionUser = await authService.getCurrentUser();
                if (sessionUser) {
                    setUser(sessionUser);
                } else {
                    // Automatically log in with demo account if no user is logged in
                    const demoUser = await authService.login('user@example.com', 'password123');
                    setUser(demoUser);
                }
            } catch (error) {
                console.error("Error during auth initialization or demo login:", error);
                authService.logout(); // Ensure clean state
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        initializeAuth();
    }, []);
    
    useEffect(() => {
        // This check ensures we don't crash if the google scripts fail to load.
        const initializeGapi = () => {
            if (typeof google !== 'undefined' && google.accounts) {
                const client = google.accounts.oauth2.initTokenClient({
                    client_id: GOOGLE_CLIENT_ID,
                    scope: GOOGLE_DRIVE_SCOPE,
                    callback: (tokenResponse: any) => {
                        if (tokenResponse && tokenResponse.access_token) {
                            setDriveAccessToken(tokenResponse.access_token);
                        }
                    },
                });
                setTokenClient(client);
            }
        }
        // The GSI script is loaded asynchronously, so we poll for it.
        const intervalId = setInterval(() => {
            if (typeof google !== 'undefined' && google.accounts) {
                initializeGapi();
                clearInterval(intervalId);
            }
        }, 100);

        return () => clearInterval(intervalId);
    }, []);

    const login = async (email: string, pass: string) => {
        const loggedInUser = await authService.login(email, pass);
        setUser(loggedInUser);
        setAuthFlowVisible(false); // Hide auth flow on successful login
        return loggedInUser;
    };

    const loginWithGoogle = async (credential: string) => {
        const decoded: { email: string, name: string, sub: string } | null = jwtDecode(credential);
        if (!decoded) throw new Error("Invalid Google credential.");

        const loggedInUser = await authService.loginWithGoogle(decoded);
        setUser(loggedInUser);
        setAuthFlowVisible(false); // Hide auth flow on successful login
        return loggedInUser;
    };

    // This effect connects our React app's login logic to the global GSI callback.
    useEffect(() => {
        window.onGoogleSignIn = loginWithGoogle;
        // Clean up the global function when the component unmounts.
        return () => {
            if (window.onGoogleSignIn === loginWithGoogle) {
                // @ts-ignore
                delete window.onGoogleSignIn;
            }
        }
    }, [loginWithGoogle]);


    const register = async (email: string, pass: string) => {
        // Registration no longer automatically logs the user in.
        // It returns a status for the UI to handle (e.g., show "confirm email" message).
        return await authService.register(email, pass);
    };

    const logout = () => {
        // Prevent Google's One Tap from automatically showing on the next page load.
        // This is the most reliable way to prevent the "double login" issue for logged-out users.
        if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
            google.accounts.id.disableAutoSelect();
        }

        const sessionData = localStorage.getItem(MOCK_SESSION_KEY);
        if (sessionData) {
            try {
                const sessionUser = JSON.parse(sessionData);
                // If the user was a Google user, revoke their token for security.
                authService.isGoogleUser(sessionUser).then(isGoogle => {
                    if (isGoogle && typeof google !== 'undefined' && google.accounts && google.accounts.id) {
                        google.accounts.id.revoke(sessionUser.email, (done: any) => {
                            console.log('Google token revoked.');
                        });
                    }
                });
            } catch (e) {
                console.error("Could not parse session data on logout:", e);
            }
        }
        
        authService.logout();
        setUser(null);
        setAuthFlowVisible(false); // Ensure auth modal is hidden on logout
        setDriveAccessToken(null); // Clear drive token on logout
    };

    const authorizeDrive = () => {
        if (tokenClient) {
            tokenClient.requestAccessToken();
        } else {
            console.error("Google API client not initialized. Cannot authorize Drive.");
        }
    };

    const updateUser = async (updatedDetails: { name?: string, about?: string, photoUrl?: string }): Promise<User> => {
        if (!user) {
            throw new Error("Cannot update profile when not logged in.");
        }
        const updatedUser = await authService.updateUser({ ...updatedDetails, id: user.id });
        setUser(updatedUser);
        return updatedUser;
    };

    const setPin = async (pin: string) => {
        if (!user) throw new Error("Not logged in");
        const updatedUser = await authService.setPin(user.id, pin);
        setUser(updatedUser);
        return updatedUser;
    };

    const verifyPin = async (pin: string) => {
        if (!user) throw new Error("Not logged in");
        return await authService.verifyPin(user.id, pin);
    };

    const requestPinReset = async () => {
        if (!user) throw new Error("Not logged in");
        return await authService.requestPinReset(user.id);
    };

    const resetPin = async (token: string, newPin: string) => {
        if (!user) throw new Error("Not logged in");
        const updatedUser = await authService.resetPin(token, newPin);
        setUser(updatedUser);
        return updatedUser;
    };

    const value = {
        user,
        isLoggedIn: !!user,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        updateUser,
        authFlowVisible,
        requestAuthFlow: () => setAuthFlowVisible(true),
        hideAuthFlow: () => setAuthFlowVisible(false),
        driveAccessToken,
        authorizeDrive,
        setPin,
        verifyPin,
        requestPinReset,
        resetPin,
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