import axios from 'axios';
import { triggerRateLimit } from '../composables/useRateLimit';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000,
  withCredentials: true
});

// Request interceptor — attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 and 429
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle rate limit (429) — show notification, wait 15s, then auto-retry once
    if (error.response?.status === 429 && !originalRequest._retried) {
      originalRequest._retried = true;
      const retryAfter = error.response.headers['retry-after'];
      const waitSeconds = retryAfter ? parseInt(retryAfter) : 15;
      console.warn(`Rate limited. Retrying in ${waitSeconds}s...`);
      await triggerRateLimit(waitSeconds);
      return api(originalRequest);
    }

    // Handle expired/invalid token
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
    }

    return Promise.reject(error);
  }
);

export default api;
