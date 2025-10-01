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
    isGoogle?: boolean; // Flag for Google users
}

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

// --- Service Method Implementations ---

/**
 * Logs out the current user by clearing the session.
 */
const logout = () => {
    localStorage.removeItem(MOCK_SESSION_KEY);
};


/**
 * Attempts to log in a user with an email and password.
 */
const login = async (email: string, password: string): Promise<User> => {
    await simulateDelay(500);
    const users = getUsersFromDB();
    const userData = users[email];
    
    if (userData && userData.password === password) {
        if (userData.status === 'pending') {
             throw new Error('Please confirm your email address before logging in.');
        }
        const user: User = { id: userData.id, email: userData.email, role: userData.role, status: userData.status, name: userData.name, about: userData.about };
        localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(user));
        return user;
    } else {
        throw new Error('Invalid email or password.');
    }
};

/**
 * Simulates logging in or registering a user via a Google credential.
 * @param credential The decoded JWT credential from Google.
 * @returns The logged-in User object.
 */
const loginWithGoogle = async (credential: { email: string, name: string, sub: string }): Promise<User> => {
    await simulateDelay(500);
    const users = getUsersFromDB();
    let userData = users[credential.email];

    // If user doesn't exist, create a new one.
    if (!userData) {
        const newId = Math.max(0, ...Object.values(users).map(u => u.id)) + 1;
        userData = {
            id: newId,
            email: credential.email,
            name: credential.name,
            role: 'user',
            status: 'active',
            isGoogle: true,
        };
        users[credential.email] = userData;
        saveUsersToDB(users);
    }
    
    // Mark the user as a Google user for Drive sync purposes.
    userData.isGoogle = true;
    saveUsersToDB(users);
    
    const user: User = { id: userData.id, email: userData.email, role: userData.role, status: userData.status, name: userData.name, about: userData.about };
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(user));
    return user;
};

/**
 * Checks if a user is a Google-authenticated user.
 * This is a mock function that relies on the isGoogle flag.
 * @param user The user object.
 * @returns True if the user is a Google user.
 */
const isGoogleUser = async (user: User): Promise<boolean> => {
    if (!user) return false;
    const users = getUsersFromDB();
    const dbUser = users[user.email];
    return !!dbUser?.isGoogle;
};


/**
 * Registers a new user. Does NOT log them in.
 */
const register = async (email: string, password: string): Promise<{ success: boolean, message: string }> => {
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
        name: email.split('@')[0],
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
};

/**
 * Finds a user by their confirmation token and activates their account.
 */
const confirmEmail = async (token: string): Promise<User> => {
    await simulateDelay(300);
    const users = getUsersFromDB();
    const userEmail = Object.keys(users).find(email => users[email].confirmationToken === token);
    
    if (userEmail) {
        const userData = users[userEmail];
        userData.status = 'active';
        delete userData.confirmationToken; // Token is single-use
        saveUsersToDB(users);
        const confirmedUser: User = { id: userData.id, email: userData.email, role: userData.role, status: 'active', name: userData.name, about: userData.about };
        return confirmedUser;
    } else {
        throw new Error('Invalid or expired confirmation token.');
    }
};

/**
 * MOCK ONLY: Helper to get a user's token for simulation purposes.
 */
const getPendingUserByEmail = async (email: string): Promise<MockDbUser | null> => {
    await simulateDelay(100);
    const users = getUsersFromDB();
    const user = users[email];
    return (user && user.status === 'pending') ? user : null;
};


/**
 * Checks for an active session and returns the user if found.
 */
const getCurrentUser = async (): Promise<User | null> => {
    await simulateDelay(200); // Simulate checking a session token
    const sessionData = localStorage.getItem(MOCK_SESSION_KEY);
    if (sessionData) {
        try {
            const user: User = JSON.parse(sessionData);
            const dbUsers = getUsersFromDB();
            if (dbUsers[user.email] && dbUsers[user.email].status === 'active') {
                const dbUser = dbUsers[user.email];
                const syncedUser: User = { ...user, name: dbUser.name, about: dbUser.about };
                if (JSON.stringify(user) !== JSON.stringify(syncedUser)) {
                    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(syncedUser));
                }
                return syncedUser;
            }
        } catch (e) {
            console.error("Corrupted session data. Clearing session.", e);
            logout(); // Clear corrupted session immediately
        }
    }
    return null; // Return null if no session, session is invalid, or user is inactive
};

/**
 * (Admin Only) Fetches a list of all registered users.
 */
const getAllUsers = async (): Promise<User[]> => {
    await simulateDelay(400);
    const users = getUsersFromDB();
    // Return a list of users without their passwords
    return Object.values(users).map((u: any) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        status: u.status,
        name: u.name,
    }));
};

/**
 * Updates a user's profile information.
 */
const updateUser = async (updatedDetails: Partial<User> & { id: number }): Promise<User> => {
    await simulateDelay(300);
    const users = getUsersFromDB();
    const userEmail = Object.keys(users).find(email => users[email].id === updatedDetails.id);

    if (!userEmail) {
        throw new Error('User to update not found in mock DB.');
    }

    const dbUser = users[userEmail];
    if (updatedDetails.name !== undefined) {
        dbUser.name = updatedDetails.name;
    }
    if (updatedDetails.about !== undefined) {
        dbUser.about = updatedDetails.about;
    }
    users[userEmail] = dbUser;
    saveUsersToDB(users);

    // Update session if it's the current user
    const sessionData = localStorage.getItem(MOCK_SESSION_KEY);
    if (sessionData) {
        const sessionUser = JSON.parse(sessionData);
        if (sessionUser.id === updatedDetails.id) {
            const updatedSessionUser: User = { ...sessionUser, name: dbUser.name, about: dbUser.about };
            localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(updatedSessionUser));
            return updatedSessionUser;
        }
    }
    
    // This return is for cases where another user (e.g. admin) updates a profile
    return { id: dbUser.id, email: dbUser.email, role: dbUser.role, status: dbUser.status, name: dbUser.name, about: dbUser.about };
};

// --- Initialize Mock Database with a default admin user ---
const initializeMockDB = () => {
    if (!localStorage.getItem(MOCK_DB_USERS_KEY)) {
        const defaultAdmin: MockDbUser = { id: 1, email: 'admin@example.com', role: 'admin', status: 'active', password: 'admin123', name: 'Admin User' };
        const defaultUser: MockDbUser = { id: 2, email: 'user@example.com', role: 'user', status: 'active', password: 'password123', name: 'Demo User' };
        const users = {
            [defaultAdmin.email]: defaultAdmin,
            [defaultUser.email]: defaultUser,
        };
        localStorage.setItem(MOCK_DB_USERS_KEY, JSON.stringify(users));
    }
};

initializeMockDB();


// --- Exported Auth Service Object ---
export const authService = {
    login,
    loginWithGoogle,
    isGoogleUser,
    register,
    confirmEmail,
    getPendingUserByEmail,
    logout,
    getCurrentUser,
    getAllUsers,
    updateUser,
};


const APP_FOLDER_NAME = "AAA Chess to Scan";
const DRIVE_FOLDER_ID_KEY = 'drive_visibleFolder_id';


export const googleDriveService = {
    /**
     * Finds the app's folder in Google Drive, or creates it if it doesn't exist.
     * This version first searches for the folder by name, making it robust against
     * the user deleting the locally stored folder ID.
     * @param accessToken The user's Google API access token.
     * @returns The ID of the folder.
     */
    async findOrCreateAppFolder(accessToken: string): Promise<string> {
        // 1. Check local storage for a stored folder ID and verify it
        const storedFolderId = localStorage.getItem(DRIVE_FOLDER_ID_KEY);
        if (storedFolderId) {
            const verifyResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${storedFolderId}?fields=id,trashed`, {
                 headers: new Headers({ 'Authorization': `Bearer ${accessToken}` }),
            });
            if (verifyResponse.ok) {
                const folderData = await verifyResponse.json();
                if (!folderData.trashed) {
                    return storedFolderId; // Folder is valid, return its ID
                }
            }
            // If verification fails (e.g., folder deleted), remove the bad ID
            localStorage.removeItem(DRIVE_FOLDER_ID_KEY);
        }

        // 2. If no valid ID, search for the folder by name in the user's Drive.
        const query = `mimeType='application/vnd.google-apps.folder' and name='${APP_FOLDER_NAME}' and trashed=false`;
        const searchResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&spaces=drive&fields=files(id)`, {
            headers: new Headers({ 'Authorization': `Bearer ${accessToken}` }),
        });

        if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            if (searchData.files && searchData.files.length > 0) {
                const folderId = searchData.files[0].id;
                localStorage.setItem(DRIVE_FOLDER_ID_KEY, folderId);
                return folderId; // Found existing folder
            }
        } else {
            console.error('Error searching for app folder:', await searchResponse.json());
        }
        
        // 3. If still not found, create a new folder in the 'root' (My Drive).
        const folderMetadata = {
            name: APP_FOLDER_NAME,
            mimeType: 'application/vnd.google-apps.folder',
            parents: ['root']
        };

        const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: new Headers({
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            }),
            body: JSON.stringify(folderMetadata),
        });
        
        if (!createResponse.ok) {
            const error = await createResponse.json();
            console.error('Failed to create app folder:', error);
            throw new Error(`Google Drive folder creation failed: ${error.error.message}`);
        }
        
        const createData = await createResponse.json();
        
        // 4. Store the newly created folder's ID
        localStorage.setItem(DRIVE_FOLDER_ID_KEY, createData.id);
        
        return createData.id;
    },

    async uploadFile(file: File, accessToken: string): Promise<string> {
        const folderId = await this.findOrCreateAppFolder(accessToken);
        
        const metadata = {
            name: file.name,
            mimeType: file.type,
            parents: [folderId]
        };

        const boundary = '-------314159265358979323846';
        const delimiter = `\r\n--${boundary}\r\n`;
        const close_delim = `\r\n--${boundary}--`;

        const metadataPart = new Blob([
            delimiter,
            'Content-Type: application/json; charset=UTF-8\r\n\r\n',
            JSON.stringify(metadata)
        ]);

        const filePartHeader = new Blob([
            delimiter,
            `Content-Type: ${file.type}\r\n\r\n`
        ]);
        
        const closingPart = new Blob([close_delim]);

        const requestBody = new Blob([metadataPart, filePartHeader, file, closingPart]);

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': `multipart/related; boundary=${boundary}`
            }),
            body: requestBody,
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Google Drive upload failed:', error);
            throw new Error(`Google Drive upload failed: ${error.error.message}`);
        }

        const responseData = await response.json();
        return responseData.id;
    }
};