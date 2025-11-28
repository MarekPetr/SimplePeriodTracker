import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_URL = __DEV__
  ? process.env.EXPO_PUBLIC_API_URL_DEV
  : process.env.EXPO_PUBLIC_API_URL_PROD;

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

class ApiClient {
  public axios: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];
  private refreshTimer: NodeJS.Timeout | null = null;
  private refreshPromise: Promise<void> | null = null;

  constructor() {
    this.axios = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.startTokenRefreshTimer();
  }

  private setupInterceptors() {
    // Request interceptor to add token
    this.axios.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Wait for the refresh to complete
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.axios(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await this.getRefreshToken();
            console.log('Attempting token refresh, refresh token exists:', !!refreshToken);

            if (!refreshToken) {
              console.log('No refresh token found, clearing tokens and logging out');
              await this.clearTokens();
              return Promise.reject(error);
            }

            console.log('Calling refresh endpoint...');
            const response = await this.axios.post('/auth/refresh', { refresh_token: refreshToken });
            const { access_token, refresh_token: new_refresh_token } = response.data;

            console.log('Token refresh successful, saving new tokens');
            await this.saveToken(access_token);
            await this.saveRefreshToken(new_refresh_token);

            // Retry all queued requests
            this.refreshSubscribers.forEach((callback) => callback(access_token));
            this.refreshSubscribers = [];

            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return this.axios(originalRequest);
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            await this.clearTokens();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async saveToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      }
      console.log('Access token saved successfully');
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(TOKEN_KEY);
      } else {
        return await SecureStore.getItemAsync(TOKEN_KEY);
      }
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  async saveRefreshToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(REFRESH_TOKEN_KEY, token);
      } else {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
      }
      console.log('Refresh token saved successfully');
    } catch (error) {
      console.error('Error saving refresh token:', error);
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        const token = localStorage.getItem(REFRESH_TOKEN_KEY);
        console.log('Retrieved refresh token:', token ? 'exists' : 'null');
        return token;
      } else {
        const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        console.log('Retrieved refresh token:', token ? 'exists' : 'null');
        return token;
      }
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  async clearToken(): Promise<void> {
    await this.clearTokens();
  }

  async clearTokens(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      }
      this.stopTokenRefreshTimer();
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  public startTokenRefreshTimer() {
    this.stopTokenRefreshTimer();

    // Refresh token every minute
    this.refreshTimer = setInterval(async () => {
      await this.refreshTokensSilently();
    }, 60000); // 60 seconds

    console.log('Token refresh timer started (refreshing every 1 minute)');
  }

  private stopTokenRefreshTimer() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      console.log('Token refresh timer stopped');
    }
  }

  private async refreshTokensSilently() {
    // If already refreshing, wait for that refresh to complete
    if (this.refreshPromise) {
      console.log('Token refresh already in progress, waiting...');
      return this.refreshPromise;
    }

    // Create new refresh promise
    this.refreshPromise = this.doRefresh();

    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async doRefresh() {
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) {
      console.log('No refresh token available for background refresh');
      return;
    }

    try {
      console.log('Background token refresh...');
      const response = await this.axios.post('/auth/refresh', { refresh_token: refreshToken });
      const { access_token, refresh_token: new_refresh_token } = response.data;

      await this.saveToken(access_token);
      await this.saveRefreshToken(new_refresh_token);

      console.log('Background token refresh successful');
    } catch (error) {
      console.error('Background token refresh failed:', error);
      // Don't clear tokens on silent refresh failure - let the 401 interceptor handle it
    }
  }
}

export const apiClient = new ApiClient();
