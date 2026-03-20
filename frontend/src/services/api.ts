import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8081').trim();

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('harmonytrack_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============ AUTO-REFRESH INTERCEPTOR ============
// When a request fails with 401 (token_expired), automatically call /api/auth/refresh
// to get a new JWT, then retry the original request — fully transparent to the user.

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach(cb => cb(newToken));
  refreshSubscribers = [];
}

function onRefreshFailed() {
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Only attempt refresh on 401 with token_expired error, and not on the refresh endpoint itself
    const isTokenExpired = error.response?.status === 401
      && (error.response?.data as any)?.error === 'token_expired';
    const isRefreshRequest = originalRequest?.url?.includes('/api/auth/refresh');

    if (isTokenExpired && !originalRequest._retry && !isRefreshRequest) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Another request is already refreshing — wait for it
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        // Request refresh using httpOnly cookie set by the backend. Do not send refresh token in JS.
        const response = await axios.post(`${API_URL}/api/auth/refresh`, {}, {
          withCredentials: true,
        });

        const newToken = response.data.token;
        localStorage.setItem('harmonytrack_token', newToken);
        console.log('[Auth] JWT auto-refreshed successfully');

        isRefreshing = false;
        onTokenRefreshed(newToken);

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        onRefreshFailed();
        console.error('[Auth] Auto-refresh failed — session is dead');
        // Refresh truly failed (revoked, etc.) — clear token, redirect to login
        localStorage.removeItem('harmonytrack_token');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const spotifyAuthService = {
  getAuthURL: async () => {
    // Fetch the authorization URL from backend which includes client_id and redirect
    const res = await axios.get(`${API_URL}/api/auth/spotify/login`);
    return res.data.authUrl;
  },
  exchangeCodeForToken: (code: string) => axios.post(`${API_URL}/api/auth/spotify/exchange`, { code }).then(r => r.data),
};

export const spotifyService = {
  getProfile: () => api.get('/api/spotify/profile'),
  getTopTracks: (timeRange = 'short_term', limit = 20) =>
    api.get(`/api/spotify/top-tracks?time_range=${timeRange}&limit=${limit}`),
  getTopArtists: (timeRange = 'medium_term', limit = 20) =>
    api.get(`/api/spotify/top-artists?time_range=${timeRange}&limit=${limit}`),
  getRecentlyPlayed: (limit = 50) =>
    api.get(`/api/spotify/recently-played?limit=${limit}`),
  getAudioFeatures: (ids: string[]) =>
    api.get(`/api/spotify/audio-features?ids=${ids.join(',')}`),
};

export const moodService = {
  getCurrentMood: () => api.get('/api/mood/latest'),
  getMoodHistory: (days = 7) => api.get(`/api/mood?limit=${days}`),
  getWeeklyMood: () => api.get('/api/mood'),
  getMoodAnalytics: (startDate: string, endDate: string) =>
    api.get(`/api/mood/analytics?start=${startDate}&end=${endDate}`),
  getMoodTrends: (period = 'weekly', count = 8) =>
    api.get(`/api/mood/trends?period=${period}&count=${count}`),
  getMoodInsights: (days = 30) => api.get(`/api/mood/insights?days=${days}`),
};

export const recommendationService = {
  getRecommendations: () => api.get('/api/recommendations'),
  getByMood: (mood: string) => api.get(`/api/recommendations/mood/${mood}`),
};

// Export axiosInstance as alias for backward compatibility with tests
export const axiosInstance = api;

export default api;
