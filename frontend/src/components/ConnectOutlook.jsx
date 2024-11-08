import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithOutlook } from '../api';
import './styles/ConnectOutlook.css';

const ConnectOutlook = () => {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleConnect = async () => {
    try {
      const response = await loginWithOutlook();
      // Redirect to Outlook's authorization page if the backend response contains a URL
      if (response?.data?.redirectUrl) {
        window.location.href = response.data.redirectUrl;
      } else {
        throw new Error('Failed to initiate OAuth flow');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to connect to Outlook. Please try again.');
    }
  };

  return (
    <div className="connect-outlook-container">
      <h2>Connect Your Account with Outlook</h2>
      <p>
        To complete your registration, please connect your account with Outlook.
        This will allow us to sync your emails and provide you with a seamless experience.
      </p>
      {error && <p className="error-message">{error}</p>}
      <button onClick={handleConnect} className="connect-button">
        Connect with Outlook
      </button>
    </div>
  );
};

export default ConnectOutlook;
