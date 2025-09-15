/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useRef, useState, useEffect } from 'react';
import { BackIcon } from '../ui/Icons';
import { dataUrlToBlob } from '../../lib/utils';
import './CameraView.css';

/**
 * A view that displays a live feed from the user's device camera
 * and provides a button to capture an image.
 *
 * @param props - Component properties.
 * @param props.onCapture - Callback function that receives the captured image as a File object.
 * @param props.onBack - Callback function to navigate back to the previous view.
 */
const CameraView = ({ onCapture, onBack }: {
    onCapture: (file: File) => void;
    onBack: () => void;
}) => {
    // A ref to hold the <video> DOM element.
    const videoRef = useRef<HTMLVideoElement>(null);
    // State to hold any potential error messages.
    const [error, setError] = useState<string | null>(null);

    // This `useEffect` hook handles the lifecycle of the camera stream.
    useEffect(() => {
        let stream: MediaStream | null = null;

        // An async function to request access to the camera and start the stream.
        const startCamera = async () => {
            try {
                // Request the user's camera.
                // `facingMode: "environment"` prefers the rear-facing camera on mobile devices.
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                
                // If the video element exists, attach the media stream to it.
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError("Could not access the camera. Please ensure you've granted permission.");
            }
        };

        startCamera();

        // This is the cleanup function that runs when the component is unmounted.
        // It's crucial for turning off the camera to save battery and protect privacy.
        return () => {
            stream?.getTracks().forEach(track => track.stop());
        };
    }, []); // The empty dependency array `[]` means this effect runs only once on mount.

    /**
     * Handles the capture button click. It draws the current video frame to a canvas,
     * converts the canvas to a PNG, and calls the onCapture callback.
     */
    const handleCapture = () => {
        if (videoRef.current) {
            // Create a temporary canvas element.
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            
            // Draw the current frame from the video onto the canvas.
            canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
            
            // Convert the canvas to a data URL, then to a Blob, and finally to a File.
            const dataUrl = canvas.toDataURL('image/png');
            const blob = dataUrlToBlob(dataUrl);
            onCapture(new File([blob], 'capture.png', { type: 'image/png' }));
        }
    };

    // If there's an error (e.g., camera permission denied), show an error message.
    if (error) {
        return (
            <div className="card error-container">
                <p>{error}</p>
                <button className="btn btn-secondary" onClick={onBack}>Go Back</button>
            </div>
        );
    }

    // Otherwise, show the camera view and controls.
    return (
        <div className="card camera-container">
            <div className="camera-view">
                <video ref={videoRef} autoPlay playsInline muted />
            </div>
            <div className="camera-controls">
                <button className="btn btn-secondary" onClick={onBack} title="Go back"><BackIcon /> Back</button>
                <button className="capture-btn" onClick={handleCapture} aria-label="Take picture" title="Capture image"></button>
            </div>
        </div>
    );
};

export default CameraView;