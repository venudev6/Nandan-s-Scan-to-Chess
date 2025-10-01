/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// This file contains global configuration for the application.

/**
 * The Client ID for Google APIs (Sign-In and Drive).
 * It is sourced from a global variable set in index.html to allow pre-React scripts
 * to access it and handle authentication edge cases before the app loads.
 */
export const GOOGLE_CLIENT_ID = (window as any).GOOGLE_CLIENT_ID;

/**
 * The scope for Google Drive API access.
 * drive allows the app to see, create, modify, and delete files it has permission to access.
 * This is required to create a visible folder in the user's "My Drive".
 */
export const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';