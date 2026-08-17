import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE = process.env.REACT_APP_API_BASE;
const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);
const MOCK_AUTH = TRUE_VALUES.has((process.env.REACT_APP_MOCK_AUTH || '').trim().toLowerCase());

const api = axios.create({
  baseURL: API_BASE
});

// Add auth token to every request
api.interceptors.request.use(async (config) => {
  if (MOCK_AUTH) {
    return config;
  }

  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    // User is not authenticated, request will proceed without token
  }
  return config;
});

// Handle 401 responses (token expired, etc.)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
