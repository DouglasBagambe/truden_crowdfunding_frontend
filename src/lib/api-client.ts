import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Smart API URL resolution:
// 1. Use NEXT_PUBLIC_API_URL if explicitly set (Netlify env var or .env.production)
// 2. If running in a browser on a non-localhost domain, auto-point to Render
// 3. Fall back to localhost for local dev
const resolveApiUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // SSR fallback: if building for production, point to Render
  if (process.env.NODE_ENV === 'production') {
    return 'https://trufund.onrender.com/api';
  }
  // Runtime fallback: detect if we're on the production domain
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (!hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
      return 'https://trufund.onrender.com/api';
    }
  }
  return 'http://localhost:3000/api';
};

const API_URL = resolveApiUrl();
console.log('[API_CLIENT_DEBUG] API_URL:', API_URL);

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

    try {
      const method = String(originalRequest?.method ?? '').toUpperCase();
      const url = originalRequest?.baseURL
        ? `${originalRequest.baseURL}${originalRequest.url ?? ''}`
        : originalRequest?.url;
      const status = error?.response?.status;
      const data = error?.response?.data;
      console.error('[API_CLIENT_ERROR]', {
        method,
        url,
        status,
        data,
      });

      if (data !== undefined) {
        console.error('[API_CLIENT_ERROR_DATA]', data);
        try {
          console.error('[API_CLIENT_ERROR_DATA_JSON]', JSON.stringify(data));
        } catch {
          // ignore
        }
      }
    } catch {
      console.error('[API_CLIENT_ERROR]', error);
    }

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
