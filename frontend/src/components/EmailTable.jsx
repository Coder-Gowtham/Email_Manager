// EmailTable.js
import React from 'react';
import './styles/EmailDashboard.css'; // Import the CSS for styling

const EmailTable = ({ emails, setSelectedEmail }) => (
    <table className="email-table">
        <thead>
            <tr>
                <th>Folder</th>
                <th>From</th>
                <th>To</th>
                <th>Subject</th>
                <th>Body</th>
                <th>Date</th>
            </tr>
        </thead>
        <tbody>
            {emails.map((email) => (
                <tr key={email.message_id} onClick={() => setSelectedEmail(email)}>
                    <td>{email.folderName}</td>
                    <td>{email.from}</td>
                    <td>{email.to}</td>
                    <td>{email.subject}</td>
                    <td>{email.email_body.slice(0, 50)}...</td>
                    <td>{new Date(email.date).toLocaleString()}</td>
                </tr>
            ))}
        </tbody>
    </table>
);

export default EmailTable;
