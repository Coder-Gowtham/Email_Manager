import axios from 'axios';
import config from './environConfig';
const API = axios.create({
  baseURL: config.BACKEND_BASE_URL || 'http://localhost:5000/',
});

export const registerUser = (data) =>
  API.post('/manager/users/register', data, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

export const loginUser = (data) =>
  API.post('/manager/users/login', data, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

export const loginWithOutlook = () => {
  return API.get('/manager/users/auth/outlook'); // Adjust to match your backend OAuth endpoint
};

export default API;
