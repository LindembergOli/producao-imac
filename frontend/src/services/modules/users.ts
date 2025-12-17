/**
 * SERVIÇO: Usuários
 * 
 * Gerencia operações de listagem e remoção de usuários.
 * Operações de criação são feitas via authService (register).
 */

import api from '../api';

export interface User {
    id: number;
    email: string;
    name: string;
    role: 'ADMIN' | 'SUPERVISOR' | 'LIDER_PRODUCAO' | 'ESPECTADOR';
    createdAt: string;
}

export const usersService = {
    /**
     * Lista todos os usuários
     */
    getAll: async (): Promise<User[]> => {
        const response = await api.get('/users');
        return response.data.data;
    },

    /**
     * Remove um usuário
     */
    delete: async (id: number): Promise<void> => {
        await api.delete(`/users/${id}`);
    },
};
