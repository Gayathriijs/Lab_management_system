import axios from './axios';

export const authAPI = {
  login: async (credentials) => {
    const response = await axios.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await axios.post('/auth/register', userData);
    return response.data;
  },

  verifyToken: async () => {
    const response = await axios.get('/auth/verify');
    return response.data;
  },
};