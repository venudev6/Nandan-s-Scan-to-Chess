/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useCallback, useRef } from 'react';

type DragAndDropOptions = {
    onDrop: (file: File) => void;
    disabled?: boolean;
};

/**
 * A custom hook to manage file drag-and-drop functionality.
 * It encapsulates the drag state and event handlers, using a counter-based
 * method to reliably track when a dragged item enters and leaves the drop zone,
 * even with nested child elements.
 * @param options - Configuration for the hook.
 * @param options.onDrop - The callback function to execute with the dropped file.
 * @param options.disabled - A boolean to temporarily disable the drop functionality.
 * @returns An object with the current dragging state and the necessary event handlers.
 */
export const useDragAndDrop = ({ onDrop, disabled = false }: DragAndDropOptions) => {
    const [isDragging, setIsDragging] = useState(false);
    // A counter to correctly handle drag enter/leave events when the pointer moves over child elements.
    const dragCounter = useRef(0);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;
        if (!disabled) {
            setIsDragging(true);
        }
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setIsDragging(false);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault(); // This is crucial to allow dropping.
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Reset state regardless of whether drop is handled.
        setIsDragging(false);
        dragCounter.current = 0;
        
        if (disabled) return;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            // We only handle the first file dropped.
            onDrop(e.dataTransfer.files[0]);
        }
    }, [onDrop, disabled]);

    return {
        isDragging,
        handleDragEnter,
        handleDragLeave,
        handleDragOver,
        handleDrop,
    };
};