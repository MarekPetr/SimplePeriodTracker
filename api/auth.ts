import { apiClient } from '@/api/client';
import { AuthResponse, User } from '@/types/auth';

export const authApi = {
  async register(email: string, password: string, gender: 'woman' | 'man'): Promise<User> {
    const response = await apiClient.client.post<User>('/auth/register', {
      email,
      password,
      gender,
    });
    return response.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    // Create URL-encoded form data for OAuth2 password grant
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    const response = await apiClient.client.post<AuthResponse>('/auth/login', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Save token after successful login
    if (response.data.access_token) {
      await apiClient.saveToken(response.data.access_token);
    }

    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await apiClient.client.get<User>('/auth/me');
    return response.data;
  },

  async updateSharingSettings(settings: {
    share_periods?: boolean;
    share_ovulation?: boolean;
    share_notes?: boolean;
  }): Promise<void> {
    await apiClient.client.put('/auth/sharing-settings', settings);
  },

  async logout(): Promise<void> {
    await apiClient.clearToken();
  },
};
