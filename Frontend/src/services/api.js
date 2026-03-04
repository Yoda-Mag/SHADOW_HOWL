import axios from 'axios';

// Get the API base URL from environment variable, with a default fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://18.134.190.37:5000';

// Normalize the base URL to ensure it doesn't end with a trailing slash
const normalizedBaseURL = API_BASE_URL.replace(/\/+$/, '');

const api = axios.create({
  baseURL: normalizedBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;