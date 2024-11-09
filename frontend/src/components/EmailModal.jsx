// frontend/src/components/EmailModal.js
import React from 'react';
import '../components/styles/DashBoard.css';

const EmailModal = ({ email, onClose }) => {
  return (
    <div className="email-modal-overlay" onClick={onClose}>
      <div className="email-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>X</button>
        <h3>From: {email.from[0].address}</h3>
        <h4>To: {email.to[0].name} {email.to[0].address}</h4>
        <h5>Subject: {email.subject}</h5>
        <p><strong>Date:</strong> {new Date(email.date).toLocaleString()}</p>
        <p><strong>Body:</strong></p>
        <p>{email.email_body}</p>
      </div>
    </div>
  );
};

export default EmailModal;
