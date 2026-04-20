import { apiClient } from './api-client';

export interface LoginRequest {
  email: string;
  password: string;
  otp?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthUser {
  email?: string;
  firstName?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
  };
}

export interface AuthResponse {
  accessToken?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
  user?: AuthUser;
}

export interface VerificationResponse {
  message: string;
}

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  async resendVerificationEmail(email: string): Promise<VerificationResponse> {
    const response = await apiClient.post<VerificationResponse>('/auth/resend-email', { email });
    return response.data;
  },

  async resendCurrentVerificationEmail(): Promise<VerificationResponse> {
    const response = await apiClient.post<VerificationResponse>('/auth/resend-email/current');
    return response.data;
  },

  async verifyMfa(data: { userId: string; code: string }) {
    const response = await apiClient.post('/auth/mfa/verify', data);
    return response.data;
  },

  async getProfile() {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
  },
};
