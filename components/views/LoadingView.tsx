/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { UploadIcon } from '../ui/Icons';
import './LoadingView.css';

/**
 * A view displayed while the AI is analyzing the image.
 * It shows a spinner and a dynamic status message.
 * It can also display a "scan failed" message with tips and retry options.
 *
 * @param props - Component properties.
 * @param props.onCancel - Callback function to cancel the analysis and go back.
 * @param props.scanFailed - A boolean indicating if the analysis has failed.
 * @param props.onRetry - Callback function to retry the analysis.
 * @param props.message - The current status message to display to the user.
 * @param props.imageFile - The image file that was being analyzed.
 * @param props.tiles - An optional array of base64 data URLs for the 64 sliced board tiles.
 */
const LoadingView = ({ onCancel, scanFailed, onRetry, message, imageFile, tiles = [] }: {
    onCancel: () => void;
    scanFailed: boolean;
    onRetry: () => void;
    message: string;
    imageFile: File | null;
    tiles?: string[];
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleUploadFailureSample = () => {
        if (!imageFile) return;
        setIsSubmitting(true);
        // MOCK: In a real app, this would upload the `imageFile` to a backend service.
        setTimeout(() => {
            alert("Thank you for your feedback! The sample image has been submitted for analysis.");
            setIsSubmitting(false);
        }, 1000);
    };

    return (
        <div className="card loading-container">
            {/* Show spinner only if tiles are not yet generated */}
            {!scanFailed && tiles.length === 0 && <div className="spinner"></div>}

            {/* Display a different title based on whether the scan failed. */}
            <h3>{scanFailed ? "Scan Failed" : "Scanning Position"}</h3>
            
            {/* Only show the dynamic status message if the scan has NOT failed. */}
            {!scanFailed && <p className="loading-message">{message}</p>}
            
            {/* Show tile preview during a successful loading state if tiles are available */}
            {!scanFailed && tiles.length > 0 && (
                <div className="loading-tiles-preview">
                    <h4>Tiles Sent to Gemini</h4>
                    <p className="preview-description">These 64 tiles were extracted from the warped image and are sent for piece classification.</p>
                    <div className="tiles-grid">
                        {tiles.map((tileSrc, index) => (
                            <img key={index} src={tileSrc} alt={`Tile ${index + 1}`} />
                        ))}
                    </div>
                </div>
            )}
            
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
                     <div className="failure-actions-container">
                        <div className="button-group">
                            <button className="btn btn-secondary" onClick={onCancel}>Start Over</button>
                            <button className="btn btn-primary" onClick={onRetry}>Try Again</button>
                        </div>
                        <div className="feedback-section">
                            <p>Help improve our scans!</p>
                            <button className="btn btn-secondary" onClick={handleUploadFailureSample} disabled={isSubmitting || !imageFile}>
                                {isSubmitting ? <div className="spinner-small"></div> : <UploadIcon />}
                                {isSubmitting ? 'Submitting...' : 'Upload Failed Image'}
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
            )}
        </div>
    );
};

export default LoadingView;