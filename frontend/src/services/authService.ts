/**
 * SERVIÇO DE AUTENTICAÇÃO
 * 
 * Gerencia autenticação de usuários usando o cliente HTTP base.
 * Integrado com o sistema de refresh automático de tokens.
 */

import api from './api';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
    role?: string;
}

export interface User {
    id: number;
    email: string;
    name: string;
    role: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}

/**
 * Serviço de Autenticação
 */
export const authService = {
    /**
     * Faz login do usuário
     */
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await api.post('/auth/login', credentials);
        const { user, accessToken, refreshToken } = response.data.data;

        // Armazenar tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        return response.data.data;
    },

    /**
     * Registra novo usuário
     */
    register: async (userData: RegisterData): Promise<AuthResponse> => {
        const response = await api.post('/auth/register', userData);
        return response.data.data;
    },

    /**
     * Faz logout do usuário
     */
    logout: async (): Promise<void> => {
        const refreshToken = localStorage.getItem('refreshToken');

        if (refreshToken) {
            try {
                await api.post('/auth/logout', { refreshToken });
            } catch (error) {
                console.error('Erro ao fazer logout:', error);
            }
        }

        // Limpar tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    },

    /**
     * Obtém dados do usuário autenticado
     */
    getMe: async (): Promise<User> => {
        const response = await api.get('/auth/me');
        return response.data.data;
    },

    /**
     * Obtém usuário do localStorage
     */
    getCurrentUser: (): User | null => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    /**
     * Verifica se usuário está autenticado
     */
    isAuthenticated: (): boolean => {
        return !!localStorage.getItem('accessToken') || !!localStorage.getItem('refreshToken');
    },

    /**
     * Obtém access token
     */
    getAccessToken: (): string | null => {
        return localStorage.getItem('accessToken');
    },

    /**
     * Obtém refresh token
     */
    getRefreshToken: (): string | null => {
        return localStorage.getItem('refreshToken');
    },
};
