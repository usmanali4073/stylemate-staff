import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_STAFF_API_URL || 'http://localhost:5002',
  headers: { 'Content-Type': 'application/json' },
});

// Helper to get token from either storage (auth-ui stores as 'stylemate-auth-token')
function getAuthToken(): string | null {
  try {
    const local = localStorage.getItem('stylemate-auth-token');
    if (local) return local;
  } catch {}
  try {
    const session = sessionStorage.getItem('stylemate-auth-token');
    if (session) return session;
  } catch {}
  return null;
}

// JWT interceptor -- read token from shared auth context
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 handler -- dispatch event for centralized auth handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;
