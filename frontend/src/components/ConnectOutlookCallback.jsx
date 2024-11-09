import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ConnectOutlookCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const status = queryParams.get('status');

    if (status === 'success') {
      // Redirect to the dashboard if emails were successfully stored
      navigate('/dashboard');
    } else {
      // Redirect to ConnectOutlook page or show an error message if failed
      navigate('/connect-outlook', { state: { error: 'Failed to sync emails. Please try again.' } });
    }
  }, [location, navigate]);

  return <div>Processing Outlook Connection...</div>;
};

export default ConnectOutlookCallback;
