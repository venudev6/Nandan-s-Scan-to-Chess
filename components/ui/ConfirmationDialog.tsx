/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './Icons';
import './ConfirmationDialog.css';

interface ConfirmationDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onClose: () => void;
    confirmText?: string;
    cancelText?: string;
}

export const ConfirmationDialog = ({
    isOpen,
    title,
    message,
    onConfirm,
    onClose,
    confirmText = 'Delete',
    cancelText = 'Cancel'
}: ConfirmationDialogProps) => {
    if (!isOpen) {
        return null;
    }

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
                    <CloseIcon />
                </button>
                <h2 className="modal-title">{title}</h2>
                <p className="modal-message">{message}</p>
                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onClose}>
                        {cancelText}
                    </button>
                    <button className="btn btn-danger" onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
