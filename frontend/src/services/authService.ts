import apiClient from './api';
import { User, LoginCredentials, OTPVerification, ApiResponse } from '@/types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await apiClient.post('/auth/login', credentials);
    // Backend returns access_token, map it to token for frontend compatibility
    return {
      ...response,
      data: {
        user: response.data.user,
        token: response.data.access_token,
      },
    };
  },

  async verifyOTP(data: OTPVerification): Promise<ApiResponse<{ user: User; token: string }>> {
    return apiClient.post('/auth/verify-otp', data);
  },

  async register(data: any): Promise<ApiResponse<{ user: User; token: string }>> {
    return apiClient.post('/auth/register', data);
  },

  async logout(): Promise<ApiResponse<void>> {
    return apiClient.post('/auth/logout');
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiClient.get('/auth/me');
  },

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return apiClient.post('/auth/refresh-token');
  },

  async requestPasswordReset(email: string): Promise<ApiResponse<void>> {
    return apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<void>> {
    return apiClient.post('/auth/reset-password', { token, newPassword });
  },
};
