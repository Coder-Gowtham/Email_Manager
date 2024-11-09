import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithOutlook, fetchEmailElastic } from '../api'; // Assuming you have this API call
import './styles/ConnectOutlook.css';

const ConnectOutlook = () => {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleConnect = async () => {
    try {
      const response = await loginWithOutlook();
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

  const handleSuccessfulAuth = async (token) => {
    try {
      // Assuming the token is returned after successful authentication
      const emailResponse = await fetchEmailElastic(); // Pass the token to your API
      if (emailResponse?.data) {
        // Store emails or update the app state as needed
        navigate('/dashboard', { state: { emails: emailResponse.data } }); // Passing emails to dashboard
      } else {
        throw new Error('Failed to fetch emails');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load emails. Please try again.');
    }
  };

  // Assuming you handle the OAuth token here in your dashboard page
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token'); // Get token from URL after OAuth redirect
    if (token) {
      handleSuccessfulAuth(token);
    }
  }, []);

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
