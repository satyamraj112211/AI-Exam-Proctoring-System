import axios from 'axios';
import { API_URL } from '../config/constants';

const axiosClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosClient.interceptors.request.use(
  (config) => {
    // Check for student token first, then teacher token
    const studentToken = localStorage.getItem('token');
    const teacherToken = localStorage.getItem('teacherToken');
    const token = studentToken || teacherToken;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosClient.interceptors.response.use(
  (response) => {
    // Return the full response data structure
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      localStorage.removeItem('teacherToken');
      // Don't redirect automatically, let components handle it
    }
    return Promise.reject(error);
  }
);

export default axiosClient;