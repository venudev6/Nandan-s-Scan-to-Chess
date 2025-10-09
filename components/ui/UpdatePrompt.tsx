/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import './UpdatePrompt.css';
import { CheckIcon } from './Icons';

interface UpdatePromptProps {
    registration: ServiceWorkerRegistration;
}

export const UpdatePrompt = ({ registration }: UpdatePromptProps) => {
    const handleUpdate = () => {
        if (registration && registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            // The page will reload automatically via the 'controllerchange'
            // event listener set up in App.tsx.
        }
    };

    return (
        <div className="update-prompt-toast">
            <CheckIcon />
            <span>A new version is available.</span>
            <button onClick={handleUpdate}>Refresh</button>
        </div>
    );
};
