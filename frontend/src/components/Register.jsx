import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api'; // Removed loginWithOutlook
import './styles/Register.css';

const Register = () => {
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
  
    try {
      console.log(`formData | ${JSON.stringify(formData)}`);
      
      const response = await registerUser(formData);
      console.log(response.data.condition);
      
        if (response.data.condition === 'USER_EXIST') {
        setError(response.data.message || 'Something went wrong!');
        return;
      }
        navigate('/connect-outlook');
    } catch (err) {
      // If the error contains a message from the server, use it
      setError(err.response?.data?.message || 'Something went wrong! Please try again after sometime.');
    }
  };
  

  return (
    <div className="register-container">
      <div className="form-container">
        <h2>Register</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="register-button">Register</button>
        </form>

        <p>Or</p>
        {/* Updated: Login button to redirect to login page */}
        <button className="login-button" onClick={() => navigate('/login')}>
          Login
        </button>
        <p>Already have an account? <span className="login-link" onClick={() => navigate('/login')}>Login here</span></p>
      </div>
    </div>
  );
};

export default Register;
