In short, this is a sophisticated Single-Page Application (SPA) built with React and TypeScript. It runs entirely in the user's browser, leveraging modern browser APIs for powerful features. It integrates two distinct "engines": one for AI-powered image analysis (Google Gemini) and one for chess rule logic (chess.js).
Here is a more detailed look at the architecture:
1. Frontend Framework & Core Structure
Framework: The application is built using React 18, as indicated by the use of createRoot in index.tsx.
Language: TypeScript is used for type safety, which helps prevent bugs and makes the code more maintainable.
Entry Point: The application starts in index.html, which loads the main JavaScript bundle from dist/bundle.js. This bundle's entry point is index.tsx.
Dependency Management: It uses a modern importmap system in index.html. Instead of a traditional build step bundling node_modules, it loads dependencies like React, chess.js, and the Gemini SDK directly from a CDN (aistudiocdn.com). This simplifies the local development setup.
2. State Management & UI Flow
The application's core logic is managed by a state machine within the main App.tsx component.
View Controller: The appState state variable (useState<AppState>) in App.tsx determines which "view" (or screen) is currently visible to the user. The ProtectedApp.tsx component acts as a router, rendering the correct view component (e.g., InitialView, CameraView, ResultView, SolveView) based on this state.
Component-Based Logic: Complex features are encapsulated into custom React Hooks for reusability and separation of concerns. This is a key architectural pattern:
useChessGame.ts: Manages the interactive chess game logic on the SolveView.
useBoardEditor.ts: Handles the logic for editing the board on the ResultView.
usePieceInteraction.ts: A robust hook that manages all the drag-and-drop and click-to-move pointer events for pieces.
usePdfManager.ts: Handles all logic related to loading, storing, and selecting PDFs from IndexedDB.
3. Data Persistence (Client-Side Storage)
Since there is no traditional backend, all user data is stored directly in the browser.
IndexedDB (lib/db.ts): This is used for storing larger, more structured data. The app uses it to persist:
Uploaded PDF files (pdfs store).
Saved/bookmarked games (games store).
Auto-saved game history (history store).
Results from PDF "deep scans" (pdfPuzzles store).
LocalStorage: This is used for simpler, key-value data:
User settings (board theme, sound preferences) managed by useAppSettings.ts.
The mock authentication session token (mock_session).
The scan count for guest users.
4. Authentication & User Management
Mock Backend: The application simulates a backend using localStorage for user authentication. The authService.ts file contains functions like login and register that read from and write to a list of users stored in localStorage. This is not a real, secure backend.
Google Sign-In (GSI): For Google login, the app integrates with the official Google Identity Services library. It handles the frontend flow (rendering the button, receiving the credential), and the authService.ts then uses the returned email to create or log in the user in the mock database.
Google Drive Integration: The app has functionality to sync PDFs to a user's Google Drive. This uses the Google Drive API and requires separate OAuth authorization, which is managed within the AuthContext.
5. The Integrated Engines
This is the core of your second question. The app uses two distinct engines for different purposes:
1. The Vision & Analysis Engine (Google Gemini)
This is the "smart" engine responsible for understanding the chessboard images.
Implementation: The logic is located in lib/gemini.ts.
Function: It uses the @google/genai (Gemini API) to send an image of a chessboard to the cloud for analysis.
Role:
Single Scan: When you upload an image (analyzeImagePosition), Gemini analyzes it and returns a JSON object containing the FEN string of the position, whose turn it is, a confidence score, and a list of "uncertain squares."
PDF Deep Scan: It also powers the feature to find all chess puzzles on a PDF page (findChessboardsAndFENsInPage). It returns an array of FEN strings, each with its corresponding bounding box coordinates on the page.
Nature: This is an external, cloud-based AI service. It requires an internet connection and an API key to function.
2. The Chess Logic Engine (chess.js)
This engine is responsible for understanding and enforcing the rules of chess.
Implementation: It's a third-party library loaded from the CDN. Its logic is heavily used within the useChessGame.ts custom hook.
Function: It operates on FEN strings. It has no concept of images.
Role:
Move Validation: Checks if a move made by the user is legal.
Game State: Determines if the game is in check, checkmate, or a draw.
Move Generation: Calculates all possible moves from a given position for a specific piece.
History: Processes SAN (Standard Algebraic Notation) to replay moves from the history.
Nature: This is a client-side JavaScript library. It runs entirely in the browser, is very fast, and does not require an internet connection.
In summary, Gemini acts as the eyes that see the board and translate it into the FEN language, and chess.js acts as the rulebook that understands that language to power the interactive game analysis.

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1O5mKck4fatANSdxMnPGESXI9tnpNR7O5

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
