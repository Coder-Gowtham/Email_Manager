// EmailDashboard.js
import React, { useEffect, useState } from 'react';
import './styles/EmailDashboard.css'; // Import your styles here

const EmailDashboard = () => {
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);

    // Function to fetch emails
    const fetchEmails = async () => {
        try {
            const response = await fetch('/api/emails/inbox'); // Update with your API endpoint
            const data = await response.json();
            setEmails(data); // Assuming the response is an array of emails
        } catch (error) {
            console.error('Error fetching emails:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmails();
    }, []);

    return (
        <div className="dashboard-container">
            <nav className="navbar">
                <ul>
                    <li>Inbox</li>
                    <li>Sent</li>
                    <li>Deleted</li>
                    <li>Other Folders</li>
                    <li>Spam</li>
                </ul>
            </nav>
            <div className="email-list">
                <h2>Inbox</h2>
                {loading ? (
                    <p>Loading emails...</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '8%' }}>Folder</th>
                                <th style={{ width: '12%' }}>From</th>
                                <th style={{ width: '20%' }}>Subject</th>
                                <th style={{ width: '50%' }}>Body</th>
                                <th style={{ width: '10%' }}>Received Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {emails.map((email) => (
                                <tr key={email.id}>
                                    <td>{email.from.name} &lt;{email.from.address}&gt;</td>
                                    <td>{email.subject}</td>
                                    <td>{email.body.length > 100 ? email.body.slice(0, 100) + '...' : email.body}</td>
                                    <td>{new Date(email.receivedDateTime).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default EmailDashboard;
