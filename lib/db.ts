/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import type { StoredGame, StoredPdf, StoredPdfRecord } from './types';

// This file acts as a simple wrapper around the browser's IndexedDB API
// to provide a more convenient, promise-based way to store and retrieve PDF files.

export const db = {
    name: 'ChessPuzzlesDB',
    version: 4, // Incremented version to add history store
    stores: {
        pdfs: 'pdfs',
        games: 'games', // This store is for user-bookmarked games
        history: 'history', // This store is for auto-saved games
    },
    _db: null as IDBDatabase | null, // Internal property to hold the database connection.

    /**
     * Initializes the IndexedDB database connection.
     * This must be called before any other database operations.
     * It handles the initial creation and version upgrades of the database.
     * @returns A promise that resolves when the connection is successful.
     */
    async init() {
        return new Promise<void>((resolve, reject) => {
            // If the connection already exists, resolve immediately.
            if (this._db) return resolve();

            const request = indexedDB.open(this.name, this.version);

            request.onerror = () => reject("Error opening DB");

            request.onsuccess = (event) => {
                this._db = (event.target as IDBOpenDBRequest).result;
                resolve();
            };

            // This event only fires if the version number is higher than the existing database,
            // or if the database doesn't exist.
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                const oldVersion = event.oldVersion;
                const transaction = (event.target as IDBOpenDBRequest).transaction!;

                if (oldVersion < 2) {
                    if (!db.objectStoreNames.contains(this.stores.pdfs)) {
                        db.createObjectStore(this.stores.pdfs, { keyPath: 'id', autoIncrement: true });
                    }
                    if (!db.objectStoreNames.contains(this.stores.games)) {
                        db.createObjectStore(this.stores.games, { keyPath: 'id', autoIncrement: true });
                    }
                }

                if (oldVersion < 3) {
                    const pdfStore = transaction.objectStore(this.stores.pdfs);
                    if (!pdfStore.indexNames.contains('lastAccessed')) {
                        pdfStore.createIndex('lastAccessed', 'lastAccessed', { unique: false });
                    }
                }

                if (oldVersion < 4) {
                    if (!db.objectStoreNames.contains(this.stores.history)) {
                        db.createObjectStore(this.stores.history, { keyPath: 'id', autoIncrement: true });
                    }
                }
            };
        });
    },

    /**
     * Saves a new PDF file and its thumbnail to the database.
     * @param file The PDF file object.
     * @param thumbnail A base64 data URL of the PDF's first page.
     * @returns A promise that resolves with the new record's auto-incremented ID.
     */
    async savePdf(file: File, thumbnail: string) {
        if (!this._db) await this.init();
        return new Promise<number>((resolve, reject) => {
            const transaction = this._db!.transaction(this.stores.pdfs, 'readwrite');
            let createdId: number;

            transaction.oncomplete = () => resolve(createdId);
            transaction.onerror = (event) => reject(`Transaction failed to save PDF: ${(event.target as any).error}`);

            const store = transaction.objectStore(this.stores.pdfs);
            // The record includes the file object, its name, thumbnail, and initial state.
            const record = { name: file.name, data: file, thumbnail, lastPage: 1, lastZoom: 1.0, lastAccessed: Date.now() };
            const request = store.put(record);
            
            // Capture the new ID on success.
            request.onsuccess = () => {
                createdId = request.result as number;
            };
        });
    },

    /**
     * Retrieves a list of all stored PDFs, but without the large file data.
     * This is used to populate the list on the initial screen.
     * @returns A promise that resolves with an array of StoredPdf objects.
     */
    async getAllPdfs() {
        if (!this._db) await this.init();
        return new Promise<StoredPdf[]>((resolve, reject) => {
            const transaction = this._db!.transaction(this.stores.pdfs, 'readonly');
            const store = transaction.objectStore(this.stores.pdfs);
            const request = store.getAll();
            
            request.onsuccess = () => {
                // Map the full results to only include the necessary metadata for the list view.
                const results = request.result.map(({ id, name, thumbnail, lastAccessed }) => ({ id, name, thumbnail, lastAccessed }));
                // Sort by last accessed descending, treating missing values as oldest.
                results.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
                resolve(results);
            };
            request.onerror = () => reject("Failed to get all PDFs");
        });
    },

    /**
     * Retrieves a single, complete PDF record, including the file data.
     * @param id The ID of the PDF record to retrieve.
     * @returns A promise that resolves with the full StoredPdfRecord.
     */
    async getPdf(id: number) {
        if (!this._db) await this.init();
        return new Promise<StoredPdfRecord>((resolve, reject) => {
            const transaction = this._db!.transaction(this.stores.pdfs, 'readonly');
            const store = transaction.objectStore(this.stores.pdfs);
            const request = store.get(id);

            request.onsuccess = () => {
                if (request.result) resolve(request.result);
                else reject("PDF not found");
            };
            request.onerror = () => reject("Failed to get PDF");
        });
    },

    /**
     * Updates the viewing state (page, zoom, scroll) of a specific PDF.
     * @param id The ID of the PDF to update.
     * @param page The new page number.
     * @param zoom The new zoom level.
     * @param thumbnail An optional new thumbnail to update.
     * @returns A promise that resolves when the update is complete.
     */
    async updatePdfState(id: number, page: number, zoom: number, thumbnail?: string) {
        if (!this._db) await this.init();
        return new Promise<void>((resolve, reject) => {
            const transaction = this._db!.transaction(this.stores.pdfs, 'readwrite');
            transaction.oncomplete = () => resolve();
            transaction.onerror = (event) => reject(`Transaction failed to update PDF state: ${(event.target as any).error}`);

            const store = transaction.objectStore(this.stores.pdfs);
            // First, get the existing record.
            const getRequest = store.get(id);
            getRequest.onsuccess = () => {
                const data = getRequest.result;
                if (data) {
                    // Modify the data with the new state.
                    data.lastPage = page;
                    data.lastZoom = zoom;
                    data.lastAccessed = Date.now();
                    if (thumbnail) {
                        data.thumbnail = thumbnail;
                    }
                    // Put the updated record back into the store.
                    store.put(data);
                } else {
                    // If the PDF was deleted in another tab, don't throw an error.
                    resolve();
                }
            };
        });
    },

    /**
     * Deletes a PDF record from the database.
     * @param id The ID of the PDF record to delete.
     * @returns A promise that resolves when the deletion is complete.
     */
    async deletePdf(id: number) {
        if (!this._db) await this.init();
        return new Promise<void>((resolve, reject) => {
            const transaction = this._db!.transaction(this.stores.pdfs, 'readwrite');
            transaction.oncomplete = () => resolve();
            transaction.onerror = (event) => reject(`Transaction failed to delete PDF: ${(event.target as any).error}`);
            
            const store = transaction.objectStore(this.stores.pdfs);
            store.delete(id);
        });
    },
    
    // --- Bookmarked Games Methods ---
    
    /**
     * Saves a new game session to the database.
     * @param gameData The game data to save.
     * @returns A promise that resolves with the new record's auto-incremented ID.
     */
    async saveGame(gameData: Omit<StoredGame, 'id'>): Promise<number> {
        if (!this._db) await this.init();
        return new Promise<number>((resolve, reject) => {
            const transaction = this._db!.transaction(this.stores.games, 'readwrite');
            const store = transaction.objectStore(this.stores.games);
            const request = store.add(gameData);
            request.onsuccess = () => resolve(request.result as number);
            request.onerror = (event) => reject(`Transaction failed to save game: ${(event.target as any).error}`);
        });
    },

    /**
     * Retrieves all saved games, sorted by date descending.
     * @returns A promise that resolves with an array of StoredGame objects.
     */
    async getAllGames(): Promise<StoredGame[]> {
        if (!this._db) await this.init();
        return new Promise<StoredGame[]>((resolve, reject) => {
            const transaction = this._db!.transaction(this.stores.games, 'readonly');
            const store = transaction.objectStore(this.stores.games);
            const request = store.getAll();
            request.onsuccess = () => {
                const sorted = request.result.sort((a, b) => b.date - a.date);
                resolve(sorted);
            };
            request.onerror = () => reject("Failed to get all games");
        });
    },
    
     /**
     * Retrieves a single game by its ID.
     * @param id The ID of the game to retrieve.
     * @returns A promise that resolves with the StoredGame object.
     */
    async getGame(id: number): Promise<StoredGame> {
        if (!this._db) await this.init();
        return new Promise<StoredGame>((resolve, reject) => {
            const transaction = this._db!.transaction(this.stores.games, 'readonly');
            const store = transaction.objectStore(this.stores.games);
            const request = store.get(id);
            request.onsuccess = () => {
                if (request.result) resolve(request.result);
                else reject("Game not found");
            };
            request.onerror = () => reject("Failed to get game");
        });
    },

    /**
     * Deletes a game record from the database.
     * @param id The ID of the game to delete.
     * @returns A promise that resolves when the deletion is complete.
     */
    async deleteGame(id: number): Promise<void> {
        if (!this._db) await this.init();
        return new Promise<void>((resolve, reject) => {
            const transaction = this._db!.transaction(this.stores.games, 'readwrite');
            transaction.oncomplete = () => resolve();
            transaction.onerror = (event) => reject(`Transaction failed to delete game: ${(event.target as any).error}`);
            
            const store = transaction.objectStore(this.stores.games);
            store.delete(id);
        });
    },

    // --- Game History Methods ---
    
    /**
     * Saves a new game session to the history.
     * @param gameData The game data to save.
     * @returns A promise that resolves with the new record's auto-incremented ID.
     */
    async saveHistory(gameData: Omit<StoredGame, 'id'>): Promise<number> {
        if (!this._db) await this.init();
        return new Promise<number>((resolve, reject) => {
            const transaction = this._db!.transaction(this.stores.history, 'readwrite');
            const store = transaction.objectStore(this.stores.history);
            const request = store.add(gameData);
            request.onsuccess = () => resolve(request.result as number);
            request.onerror = (event) => reject(`Transaction failed to save game history: ${(event.target as any).error}`);
        });
    },

    /**
     * Retrieves all history games, sorted by date descending.
     * @returns A promise that resolves with an array of StoredGame objects.
     */
    async getAllHistory(): Promise<StoredGame[]> {
        if (!this._db) await this.init();
        return new Promise<StoredGame[]>((resolve, reject) => {
            const transaction = this._db!.transaction(this.stores.history, 'readonly');
            const store = transaction.objectStore(this.stores.history);
            const request = store.getAll();
            request.onsuccess = () => {
                const sorted = request.result.sort((a, b) => b.date - a.date);
                resolve(sorted);
            };
            request.onerror = () => reject("Failed to get all history games");
        });
    },
    
     /**
     * Retrieves a single history game by its ID.
     * @param id The ID of the game to retrieve.
     * @returns A promise that resolves with the StoredGame object.
     */
    async getHistory(id: number): Promise<StoredGame> {
        if (!this._db) await this.init();
        return new Promise<StoredGame>((resolve, reject) => {
            const transaction = this._db!.transaction(this.stores.history, 'readonly');
            const store = transaction.objectStore(this.stores.history);
            const request = store.get(id);
            request.onsuccess = () => {
                if (request.result) resolve(request.result);
                else reject("Game from history not found");
            };
            request.onerror = () => reject("Failed to get game from history");
        });
    },

    /**
     * Deletes a history record from the database.
     * @param id The ID of the game to delete.
     * @returns A promise that resolves when the deletion is complete.
     */
    async deleteHistory(id: number): Promise<void> {
        if (!this._db) await this.init();
        return new Promise<void>((resolve, reject) => {
            const transaction = this._db!.transaction(this.stores.history, 'readwrite');
            transaction.oncomplete = () => resolve();
            transaction.onerror = (event) => reject(`Transaction failed to delete game history: ${(event.target as any).error}`);
            
            const store = transaction.objectStore(this.stores.history);
            store.delete(id);
        });
    },
};
