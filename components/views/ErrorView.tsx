/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

/**
 * A simple view to display a generic error message to the user.
 * It provides a single action to retry the last operation or return to the start.
 *
 * @param props - Component properties.
 * @param props.message - The error message to display.
 * @param props.onRetry - The callback function to execute when the "Try Again" button is clicked.
 */
const ErrorView = ({ message, onRetry }: {
    message: string;
    onRetry: () => void;
}) => (
    <div className="card error-container">
        <h3>An Error Occurred</h3>
        <p>{message}</p>
        <button className="btn btn-primary" onClick={onRetry}>Try Again</button>
    </div>
);

export default ErrorView;