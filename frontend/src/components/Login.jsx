import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api'; // Adjust the path if necessary
import './styles/Login.css'; // Import the CSS for styling

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errorMessage, setErrorMessage] = useState(''); // Use only errorMessage for error handling
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const { data } = await loginUser(formData); // Assuming loginUser is a function to call the backend API
        console.log(`Login response from backend: ${JSON.stringify(data)}`);

        if (data.status === 200) {        
            navigate(data.url);
        } else {
            setErrorMessage(data.message || 'Something went wrong.');
        }
    } catch (err) {
        console.error(`Login error: ${JSON.stringify(err.response?.data || err.message)}`);

        if (err.response?.data?.message) {
            setErrorMessage(err.response.data.message);
        } else {
            setErrorMessage('Login failed. Please try again later.');
        }
    }
};


  return (
    <div className="login-container">
      <div className="form-container">
        <h2>Login</h2>
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
          {errorMessage && <p className="error-message">{errorMessage}</p>} {/* Display error message */}
          <button type="submit" className="login-button">Login</button>
        </form>

        <div className="signup-section">
          <p>Or</p>
          <button className="signup-button" onClick={() => navigate('/register')}>Sign Up</button>
        </div>

        <p>Don't have an account? 
          <span className="register-link" onClick={() => navigate('/register')}> Create a new account</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
