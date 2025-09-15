/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useMemo } from 'react';
import './LoadingView.css';

/**
 * A view displayed while the AI is analyzing the image.
 * It shows a spinner and cycles through various status messages.
 * It can also display a "scan failed" message with tips and retry options.
 *
 * @param props - Component properties.
 * @param props.onCancel - Callback function to cancel the analysis and go back.
 * @param props.scanFailed - A boolean indicating if the analysis has failed.
 * @param props.onRetry - Callback function to retry the analysis.
 */
const LoadingView = ({ onCancel, scanFailed, onRetry }: {
    onCancel: () => void;
    scanFailed: boolean;
    onRetry: () => void;
}) => {
    // A memoized array of messages to display to the user during loading.
    const messages = useMemo(() => [
        "Analyzing board layout...",
        "Identifying individual pieces...",
        "Determining piece colors and types...",
        "Constructing the final position...",
        "Almost there...",
    ], []);
    
    // State to hold the currently displayed message.
    const [currentMessage, setCurrentMessage] = useState(messages[0]);

    // This effect cycles through the loading messages every 2.5 seconds.
    useEffect(() => {
        // Only run the animation if the scan has not failed.
        if (!scanFailed) {
            let index = 0;
            const interval = setInterval(() => {
                index = (index + 1) % messages.length; // Loop back to the start
                setCurrentMessage(messages[index]);
            }, 2500);

            // Cleanup function to clear the interval when the component unmounts.
            return () => clearInterval(interval);
        }
    }, [messages, scanFailed]);

    return (
        <div className="card loading-container">
            <div className="spinner"></div>
            {/* Display a different title based on whether the scan failed. */}
            <h3>{scanFailed ? "Scan Failed" : "Scanning Position"}</h3>
            
            {/* Show the cycling messages only during a successful loading state. */}
            {!scanFailed && <p className="loading-message">{currentMessage}</p>}
            
            {/* Conditionally render either the failure tips or the cancel button. */}
            {scanFailed ? (
                 <>
                    <p>We couldn't recognize the board from the image.</p>
                    <div className="scan-failed-tips">
                        <h3>Tips for a Better Scan:</h3>
                        <ul>
                           <li><strong>Clear View:</strong> Ensure the board is not obstructed.</li>
                           <li><strong>Good Lighting:</strong> Avoid glare and shadows.</li>
                           <li><strong>Flat Angle:</strong> A top-down view works best.</li>
                           <li><strong>High Contrast:</strong> Clear distinction between pieces and squares.</li>
                        </ul>
                    </div>
                    <div className="button-group">
                        <button className="btn btn-secondary" onClick={onCancel}>Start Over</button>
                        <button className="btn btn-primary" onClick={onRetry}>Try Again</button>
                    </div>
                </>
            ) : (
                <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
            )}
        </div>
    );
};

export default LoadingView;