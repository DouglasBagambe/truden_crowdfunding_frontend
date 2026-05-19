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
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  mfa?: {
    enabled?: boolean;
    emailEnabled?: boolean;
    authenticatorEnabled?: boolean;
  };
  mfaEnabled?: boolean;
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

export interface MfaSetupResponse {
  secret: string;
  otpauthUrl?: string;
  note?: string;
}

export interface MfaActionResponse {
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

  async startMfaSetup(): Promise<MfaSetupResponse> {
    const response = await apiClient.post<MfaSetupResponse>('/auth/mfa/setup');
    return response.data;
  },

  async enableMfa(token: string): Promise<MfaActionResponse> {
    const response = await apiClient.post<MfaActionResponse>('/auth/mfa/enable', { token });
    return response.data;
  },

  async startEmailMfa(): Promise<MfaActionResponse> {
    const response = await apiClient.post<MfaActionResponse>('/auth/mfa/email/start');
    return response.data;
  },

  async enableEmailMfa(token: string): Promise<MfaActionResponse> {
    const response = await apiClient.post<MfaActionResponse>('/auth/mfa/email/enable', { token });
    return response.data;
  },

  async disableMfa(token: string): Promise<MfaActionResponse> {
    const response = await apiClient.post<MfaActionResponse>('/auth/mfa/disable', { token });
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
