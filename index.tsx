/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// This is the main entry point for the React application.

// 1. Find the root DOM element.
// The `index.html` file has a `<div>` with the ID 'root'. This is where our entire React app will be mounted.
const rootElement = document.getElementById('root');

// 2. Ensure the root element exists before trying to render the app.
// This is a safety check to prevent errors if the HTML file is missing the 'root' div.
if (rootElement) {
    // 3. Create a React "root".
    // This new API is part of React 18 and provides better performance and new concurrent features.
    // It designates `rootElement` as the main container for the React app.
    const root = createRoot(rootElement);

    // 4. Render the main App component into the root.
    // The `<App />` component is the top-level component of our application.
    // Everything you see on the screen is a child of this App component.
    root.render(
        // React.StrictMode is a developer tool that helps find potential problems in an application.
        // It activates additional checks and warnings for its descendants. It does not render any visible UI
        // and only runs in development mode, so it doesn't affect the production build.
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}