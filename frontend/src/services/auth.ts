import api from './api';

export interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    email: string;
    username: string;
  };
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
};

