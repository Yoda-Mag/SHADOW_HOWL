import axios from 'axios';

// Get API base URL from environment or construct from current host
const getAPIBaseURL = () => {
  const envURL = import.meta.env.VITE_API_URL;
  
  if (envURL) {
    return envURL.replace(/\/+$/, ''); // Remove trailing slashes
  }
  
  // Production: use same host as frontend
  if (import.meta.env.PROD) {
    const protocol = window.location.protocol;
    const host = window.location.host;
    return `${protocol}//${host}/api`;
  }
  
  // Development: default to localhost
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getAPIBaseURL();

console.log('API Configuration:', {
  baseURL: API_BASE_URL,
  environment: import.meta.env.MODE,
  production: import.meta.env.PROD
});

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;