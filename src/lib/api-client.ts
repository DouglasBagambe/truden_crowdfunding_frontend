import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const TEST_FRONTEND_HOSTS = new Set(['akeibo.netlify.app']);
const LIVE_FRONTEND_HOSTS = new Set(['keibo.io', 'www.keibo.io']);
const TEST_API_URL = 'https://keibo.onrender.com/api';
const LIVE_API_URL = 'https://api.keibo.io/api';
const LOCAL_API_URL = 'http://localhost:3000/api';

const normalizeApiUrl = (value: string): string =>
  value.replace(/\/+$/, '');

const resolveApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;

    if (host === 'localhost' || host === '127.0.0.1') {
      return LOCAL_API_URL;
    }

    if (TEST_FRONTEND_HOSTS.has(host)) {
      return TEST_API_URL;
    }

    if (LIVE_FRONTEND_HOSTS.has(host)) {
      return LIVE_API_URL;
    }
  }

  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.startsWith('http')) {
    return normalizeApiUrl(envUrl);
  }

  if (process.env.NODE_ENV === 'development') {
    return LOCAL_API_URL;
  }

  return LIVE_API_URL;
};

const API_URL = resolveApiUrl();

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor to add auth token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle errors- specifically 401 Unauthorized
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: any) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const { access_token } = response.data;

          localStorage.setItem('token', access_token);
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
