/**
 * SERVIÇO: Usuários
 */

import api from '../api';
import { extractData } from '../helpers';

export interface User {
    id: number;
    email: string;
    name: string;
    role: 'ADMIN' | 'SUPERVISOR' | 'LIDER_PRODUCAO' | 'ESPECTADOR';
    createdAt: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    refreshToken: string;
    user: User;
}

export const usersService = {
    getAll: async (): Promise<User[]> => {
        const response = await api.get('/users');
        return extractData<User>(response.data);
    },

    getById: async (id: number): Promise<User> => {
        const response = await api.get(`/users/${id}`);
        return response.data.data;
    },

    create: async (data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
        const response = await api.post('/users', data);
        return response.data.data;
    },

    update: async (id: number, data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User> => {
        const response = await api.put(`/users/${id}`, data);
        return response.data.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/users/${id}`);
    },
};
