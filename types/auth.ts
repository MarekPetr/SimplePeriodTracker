export interface User {
  id: string;
  email: string;
  gender: 'woman' | 'man';
  partner_id?: string;
  sharing_settings: SharingSettings;
  created_at: string;
}

export interface SharingSettings {
  share_periods: boolean;
  share_ovulation: boolean;
  share_notes: boolean;
}

export interface LoginRequest {
  username: string; // Email is used as username
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  gender: 'woman' | 'man';
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, gender: 'woman' | 'man') => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
