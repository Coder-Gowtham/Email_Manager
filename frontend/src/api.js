import axios from 'axios';
import config from './environConfig';
const API = axios.create({
  baseURL: config.REACT_APP_BACKEND_URL  || 'http://localhost:5000',
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
  return API.get('/manager/users/auth/outlook');
};
export const updateEmail = () => {
  return API.get('/manager/users/auth/outlook');

}

export const fetchEmailElastic = ({ folder }) => {
  const url = `/manager/users/fetchEmailElastic?folder=${folder}`;
  return API.get(url);
};
export default API;
