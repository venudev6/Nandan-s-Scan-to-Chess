/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import type { User, UserStatus } from './types';

// This is a MOCK authentication service. It uses localStorage to simulate a user database
// and session management. In a real application, this would be replaced with actual API
// calls to a secure backend server.

const MOCK_DB_USERS_KEY = 'mock_db_users';
const MOCK_SESSION_KEY = 'mock_session';

// A more complete user record for the mock database, including password.
interface MockDbUser extends User {
    password?: string;
}

// --- Initialize Mock Database with a default admin user ---
const initializeMockDB = () => {
    if (!localStorage.getItem(MOCK_DB_USERS_KEY)) {
        const defaultAdmin: MockDbUser = { id: 1, email: 'admin@example.com', role: 'admin', status: 'active', password: 'admin123' };
        const defaultUser: MockDbUser = { id: 2, email: 'user@example.com', role: 'user', status: 'active', password: 'password123' };
        const users = {
            [defaultAdmin.email]: defaultAdmin,
            [defaultUser.email]: defaultUser,
        };
        localStorage.setItem(MOCK_DB_USERS_KEY, JSON.stringify(users));
    }
};

initializeMockDB();

// --- Helper Functions ---
const getUsersFromDB = (): { [email: string]: MockDbUser } => {
    return JSON.parse(localStorage.getItem(MOCK_DB_USERS_KEY) || '{}');
};
const saveUsersToDB = (users: any) => {
    localStorage.setItem(MOCK_DB_USERS_KEY, JSON.stringify(users));
};
const generateToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Simulate network latency
const simulateDelay = (ms: number) => new Promise(res => setTimeout(res, ms));


// --- Exported Auth Service ---
export const authService = {
    /**
     * Attempts to log in a user with an email and password.
     */
    login: async (email: string, password: string): Promise<User> => {
        await simulateDelay(500);
        const users = getUsersFromDB();
        const userData = users[email];
        
        if (userData && userData.password === password) {
            if (userData.status === 'pending') {
                 throw new Error('Please confirm your email address before logging in.');
            }
            const user: User = { id: userData.id, email: userData.email, role: userData.role, status: userData.status };
            localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(user));
            return user;
        } else {
            throw new Error('Invalid email or password.');
        }
    },

    /**
     * Registers a new user. Does NOT log them in.
     */
    register: async (email: string, password: string): Promise<{ success: boolean, message: string }> => {
        await simulateDelay(700);
        const users = getUsersFromDB();

        if (users[email]) {
            throw new Error('An account with this email already exists.');
        }

        const newId = Math.max(0, ...Object.values(users).map(u => u.id)) + 1;
        const confirmationToken = generateToken();
        const newUser: MockDbUser = { 
            id: newId, 
            email, 
            role: 'user', 
            status: 'pending', 
            password,
            confirmationToken
        };
        users[email] = newUser;
        saveUsersToDB(users);
        
        // --- MOCK EMAIL SENDING ---
        // In a real app, you would send an email with a link like:
        // `https://yourapp.com/confirm-email?token=${confirmationToken}`
        console.log(`
            --- SIMULATED EMAIL ---
            To: ${email}
            Subject: Confirm your Scan to Chess Account

            Please confirm your account by using the following token: ${confirmationToken}
            (In a real app, this would be a clickable link)
            -----------------------
        `);
        // -------------------------

        return { success: true, message: 'Registration successful. Please check your email for a confirmation link.' };
    },
    
    /**
     * Finds a user by their confirmation token and activates their account.
     */
    confirmEmail: async (token: string): Promise<User> => {
        await simulateDelay(300);
        const users = getUsersFromDB();
        const userEmail = Object.keys(users).find(email => users[email].confirmationToken === token);
        
        if (userEmail) {
            const userData = users[userEmail];
            userData.status = 'active';
            delete userData.confirmationToken; // Token is single-use
            saveUsersToDB(users);
            const confirmedUser: User = { id: userData.id, email: userData.email, role: userData.role, status: 'active' };
            return confirmedUser;
        } else {
            throw new Error('Invalid or expired confirmation token.');
        }
    },
    
    /**
     * MOCK ONLY: Helper to get a user's token for simulation purposes.
     */
    getPendingUserByEmail: async (email: string): Promise<MockDbUser | null> => {
        await simulateDelay(100);
        const users = getUsersFromDB();
        const user = users[email];
        return (user && user.status === 'pending') ? user : null;
    },

    /**
     * Logs out the current user by clearing the session.
     */
    logout: () => {
        localStorage.removeItem(MOCK_SESSION_KEY);
    },

    /**
     * Checks for an active session and returns the user if found.
     */
    getCurrentUser: async (): Promise<User | null> => {
        await simulateDelay(200); // Simulate checking a session token
        const sessionData = localStorage.getItem(MOCK_SESSION_KEY);
        if (sessionData) {
            const user = JSON.parse(sessionData);
            // Ensure the user is active (could have been deactivated by an admin)
            const dbUsers = getUsersFromDB();
            if (dbUsers[user.email] && dbUsers[user.email].status === 'active') {
                return user;
            }
        }
        authService.logout(); // Clear invalid session
        return null;
    },
    
    /**
     * (Admin Only) Fetches a list of all registered users.
     */
    getAllUsers: async (): Promise<User[]> => {
        await simulateDelay(400);
        const users = getUsersFromDB();
        // Return a list of users without their passwords
        return Object.values(users).map((u: any) => ({
            id: u.id,
            email: u.email,
            role: u.role,
            status: u.status,
        }));
    },
};
