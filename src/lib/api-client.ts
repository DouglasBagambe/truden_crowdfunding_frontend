import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Smart API URL resolution:
// 1. Use NEXT_PUBLIC_API_URL if explicitly set (Netlify env var or .env.production)
// 2. If running in a browser on a non-localhost domain, auto-point to Render
// 3. Fall back to localhost for local dev
const resolveApiUrl = (): string => {
  // 1. Explicit env var (if fully baked in via build)
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.startsWith('http')) {
    return envUrl;
  }

  // 2. Browser runtime: if we're clearly running locally, use localhost
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Local dev
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3000/api';
    }
    // Any live domain (Netlify, Vercel, Custom) -> use Render
    return 'https://trufund.onrender.com/api';
  }

  // 3. Server-Side Rendering (SSR) fallback
  // In Next.js, process.env.NODE_ENV is 'development' during local `npm run dev`
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000/api';
  }

  // Default to production API if unsure (best for live deployments)
  return 'https://trufund.onrender.com/api';
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
