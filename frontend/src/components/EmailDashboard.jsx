import React, { useState, useEffect, useCallback } from 'react';
import EmailModal from './EmailModal';
import '../components/styles/DashBoard.css';
import { fetchEmailElastic } from '../api';
import { debounce } from 'lodash';
import { useNavigate } from 'react-router-dom';
import { updateEmail } from '../api';

const EmailDashboard = () => {
    const [emails, setEmails] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [folder, setFolder] = useState('ALL');
    const [errorMessage, setErrorMessage] = useState(null); // State to store error message
    const [loading, setLoading] = useState(false); // State to handle loading indicator
    const navigate = useNavigate();

    const debouncedFetchEmails = useCallback(
        debounce(async (folder) => {
            await fetchEmails(folder);
        }, 500),
        []
    );

    useEffect(() => {
        // Fetch initial emails on first load
        fetchEmails('ALL');
    }, []);

    useEffect(() => {
        debouncedFetchEmails(folder);
    }, [folder, debouncedFetchEmails]);

    const fetchEmails = async (folder = 'ALL') => {
        setLoading(true); // Start loading
        setErrorMessage(null); // Clear any previous errors

        try {
            const response = await fetchEmailElastic({ folder });

            console.log('Response:', response);

            if (response && response.data && response.data.emails) {
                if (response.data.emails.length > 0) {
                    setEmails(response.data.emails); // Replace with new emails
                }
            } else {
                setEmails([]); // Clear emails if no valid response
                const errorMsg = response?.data?.message || 'Something went wrong.';
                setErrorMessage(errorMsg);
            }

        } catch (error) {
            console.error('Error fetching emails:', error);
            setEmails([]); // Clear email list on error
            setErrorMessage('Failed to fetch emails due to a network error. Please login again!');

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login', { replace: true });
            }, 3000);
        } finally {
            setLoading(false); // End loading
        }
    };

    const handleFolderChange = (folderName) => {
        setFolder(folderName); // Update folder state
        setEmails([]); // Reset emails to an empty array when switching folders
        fetchEmails(folderName); // Fetch emails for the new folder
    };

    const openEmailModal = (email) => {
        setSelectedEmail(email);
    };

    const closeModal = () => {
        setSelectedEmail(null);
    };

    // Navigate to the backend login URL when clicked
    const handleOutlookLogin = async () => {
        try {
            const response = await updateEmail();
            if (response?.data?.redirectUrl) {
                window.location.href = response.data.redirectUrl;
            } else {
                throw new Error('Failed to initiate OAuth flow');
            }
        } catch (err) {
            console.error(err);
            setErrorMessage('Failed to connect to Outlook. Please try again.');
        }
    };

    return (
        <div className="email-dashboard">
            <nav className="email-navbar">
                {['ALL', 'Inbox', 'Sent', 'Drafts', 'Outbox', 'Junk', 'Deleted', 'Archive', 'Notes', 'Others'].map(folderName => (
                    <button key={folderName} onClick={() => handleFolderChange(folderName)}>
                        {folderName}
                    </button>
                ))}
                {/* Outlook login button */}
                <button onClick={handleOutlookLogin} className="outlook-login-btn">
                    Update Emails
                </button>
            </nav>

            {errorMessage && (
                <div className="error-message">
                    <strong>{errorMessage}</strong>
                </div>
            )}

            {loading && <div className="loading-spinner">Loading...</div>} {/* Show loading spinner */}

            <div className="email-table">
                <div className="email-table-header">
                    <div>Folder</div>
                    <div>From</div>
                    <div>To</div>
                    <div>Subject</div>
                    <div>Body</div>
                    <div>Date</div>
                </div>
                <div className='email-data-container'>
                    {emails.map((email, index) => (
                        <div key={index} className="email-table-row" onClick={() => openEmailModal(email)}>
                            <div>{email.folderName || ''}</div>
                            <div>{email?.from[0].address || ''}</div>
                            <div>{email?.to[0].address || ''}</div>
                            <div>{email.subject || ''}</div>
                            <div>{email.email_body.slice(0, 50)}...</div>
                            <div>{new Date(email.date).toLocaleString() || ''}</div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedEmail && <EmailModal email={selectedEmail} onClose={closeModal} />}
        </div>
    );
};

export default EmailDashboard;
