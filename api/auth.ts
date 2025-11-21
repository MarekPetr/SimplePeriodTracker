import apiClient from './client';
import { apiClient as clientInstance } from './client';
import { AuthResponse, User, RegisterRequest } from '@/types/auth';

export const authApi = {
  async register(email: string, password: string, gender: 'woman' | 'man'): Promise<User> {
    const response = await apiClient.post<User>('/auth/register', {
      email,
      password,
      gender,
    });
    return response.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append('username', email); // Backend expects username field
    formData.append('password', password);

    const response = await apiClient.post<AuthResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Save token after successful login
    if (response.data.access_token) {
      await clientInstance.saveToken(response.data.access_token);
    }

    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  async updateSharingSettings(settings: {
    share_periods?: boolean;
    share_ovulation?: boolean;
    share_notes?: boolean;
  }): Promise<void> {
    await apiClient.put('/auth/sharing-settings', settings);
  },

  async logout(): Promise<void> {
    await clientInstance.clearToken();
  },
};
