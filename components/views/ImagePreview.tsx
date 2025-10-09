/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import { BackIcon } from '../ui/Icons';
import { resizeAndExportImage } from '../../lib/utils';
import './ImagePreview.css';

/**
 * A view that displays a selected image and allows the user to crop it.
 * This ensures that only the relevant part of the image (the chessboard) is sent for analysis.
 *
 * @param props - Component properties.
 * @param props.imageFile - The image file to be previewed and cropped.
 * @param props.onConfirm - Callback function that receives the final cropped image as a File object.
 * @param props.onBack - Callback function to navigate back.
 */
const ImagePreview = ({ imageFile, onConfirm, onBack }: {
    imageFile: File;
    onConfirm: (file: File) => void;
    onBack: () => void;
}) => {
    // `crop` is the state managed by the ReactCrop component during user interaction.
    const [crop, setCrop] = useState<Crop>();
    // `completedCrop` stores the final crop dimensions after the user finishes resizing/moving.
    const [completedCrop, setCompletedCrop] = useState<Crop>();
    // A ref to the <img> element to access its properties (like naturalWidth/Height).
    const imgRef = useRef<HTMLImageElement>(null);
    // The data URL source for the <img> element.
    const [imgSrc, setImgSrc] = useState('');
    const [isConfirming, setIsConfirming] = useState(false);


    // This effect runs when the `imageFile` prop changes. It reads the file
    // and sets the `imgSrc` state to a data URL, so it can be displayed in an <img> tag.
    useEffect(() => {
        const reader = new FileReader();
        reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
        reader.readAsDataURL(imageFile);
    }, [imageFile]);
    
    /**
     * This function is called once the image has loaded in the <img> tag.
     * It initializes the crop selection to cover the entire image by default.
     * @param e - The image load event.
     */
    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        const newCrop: Crop = {
            unit: '%', // Use percentage for a responsive initial crop.
            width: 100,
            height: 100,
            x: 0,
            y: 0,
        };
        setCrop(newCrop);
        setCompletedCrop(newCrop); // Set the initial completed crop as well.
    };

    /**
     * Creates a new cropped image File based on the `completedCrop` selection.
     * It works by drawing the selected portion of the original image onto a new, smaller canvas
     * and then converting that canvas into a Blob/File.
     * @returns A Promise that resolves to the new cropped File, or null if an error occurs.
     */
    const getCroppedImg = async (): Promise<File | null> => {
        const image = imgRef.current;
        if (!image || !completedCrop) {
            return null;
        }

        const canvas = document.createElement("canvas");
        // Calculate the scale factor between the displayed image size and its natural size.
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        
        // The canvas size is the pixel size of the crop area on the original image.
        canvas.width = Math.floor(completedCrop.width * scaleX);
        canvas.height = Math.floor(completedCrop.height * scaleY);

        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        // The source x/y coordinates on the original image.
        const cropX = completedCrop.x * scaleX;
        const cropY = completedCrop.y * scaleY;

        // Use drawImage to clip the original image and draw it onto the canvas.
        ctx.drawImage(
            image,
            cropX,
            cropY,
            canvas.width, // source width
            canvas.height, // source height
            0, // destination x
            0, // destination y
            canvas.width, // destination width
            canvas.height // destination height
        );
        
        return resizeAndExportImage(canvas, {
            maxDimension: 1024,
            type: 'image/webp',
            quality: 0.7,
            fileName: 'cropped.webp'
        });
    };

    /**
     * Handles the confirm button click. It gets the cropped image and passes it to the onConfirm callback.
     * If cropping fails for some reason, it passes the original image.
     */
    const handleConfirm = async () => {
        setIsConfirming(true);
        const croppedFile = await getCroppedImg();
        onConfirm(croppedFile || imageFile);
    };

    return (
        <div className="card image-preview-container">
            {imgSrc && (
                <ReactCrop
                    crop={crop}
                    onChange={c => setCrop(c)}
                    onComplete={c => setCompletedCrop(c)}
                >
                    <img
                        ref={imgRef}
                        src={imgSrc}
                        onLoad={onImageLoad}
                        alt="Preview"
                        className="image-preview"
                    />
                </ReactCrop>
            )}
            <div className="preview-controls">
                <p>Adjust the selection to tightly crop the chessboard.</p>
                <div className="preview-button-group">
                    <button className="btn btn-secondary" onClick={onBack} title="Go back" aria-label="Go back">
                        <BackIcon /> Back
                    </button>
                    <button className="btn btn-primary" onClick={handleConfirm} disabled={!completedCrop?.width || !completedCrop?.height || isConfirming} title="Confirm selection and start analysis">
                         {isConfirming ? <div className="spinner-small"></div> : 'Confirm Crop & Analyse'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImagePreview;