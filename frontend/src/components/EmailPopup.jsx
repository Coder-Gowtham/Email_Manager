// EmailPopup.js
import React from 'react';
import './styles/EmailDashboard.css'; // Import the CSS for styling

const EmailPopup = ({ email, onClose }) => (
    <div className="email-popup">
        <button onClick={onClose}>Close</button>
        <h2>{email.subject}</h2>
        <p><strong>From:</strong> {email.from}</p>
        <p><strong>To:</strong> {email.to}</p>
        <p><strong>Date:</strong> {new Date(email.date).toLocaleString()}</p>
        <p><strong>Body:</strong> {email.email_body}</p>
        <p><strong>Folder:</strong> {email.folderName}</p>
    </div>
);

export default EmailPopup;
