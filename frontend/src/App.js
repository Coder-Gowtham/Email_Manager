import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import ConnectOutlook from './components/ConnectOutlook';
import EmailDashboard from './components/EmailDashboard';
import ConnectOutlookCallback from './components/ConnectOutlookCallback';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
      
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/connect-outlook" element={<ConnectOutlook />} />
        <Route path="/dashboard" element={<EmailDashboard />} />
        <Route path="/connect-outlook-callback" element={<ConnectOutlookCallback />} />
      </Routes>
    </Router>
  );
}

export default App;
