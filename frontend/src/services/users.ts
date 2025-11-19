import api from './api';

export interface User {
  id: number;
  email: string;
  username: string;
  phone: string | null;
  role: string;
  salesRep?: {
    id: number;
    name: string;
  } | null;
}

export interface CreateUserData {
  email: string;
  username: string;
  password: string;
  role: string;
}

export const usersService = {
  getList: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },

  getOne: async (id: number): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  create: async (data: CreateUserData): Promise<User> => {
    const response = await api.post('/users', data);
    return response.data.user || response.data;
  },

  update: async (id: number, data: Partial<CreateUserData>): Promise<User> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};

