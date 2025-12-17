/**
 * SERVIÇO: Máquinas
 * 
 * Serviço para gerenciar operações relacionadas a máquinas.
 */

import api from '../api';
import type { Machine } from '../../types';


export interface MachineStats {
    total: number;
    bySector: Record<string, number>;
}

/**
 * Serviço de Máquinas
 */
export const machinesService = {
    /**
     * Lista todas as máquinas
     */
    getAll: async (): Promise<Machine[]> => {
        const response = await api.get('/machines');
        return response.data.data;
    },

    /**
     * Busca máquina por ID
     */
    getById: async (id: number): Promise<Machine> => {
        const response = await api.get(`/machines/${id}`);
        return response.data.data;
    },

    /**
     * Busca máquina por código
     */
    getByCode: async (code: string): Promise<Machine> => {
        const response = await api.get(`/machines/code/${code}`);
        return response.data.data;
    },

    /**
     * Busca máquinas por setor
     */
    getBySector: async (sector: string): Promise<Machine[]> => {
        const response = await api.get(`/machines/sector/${sector}`);
        return response.data.data;
    },

    /**
     * Retorna estatísticas de máquinas
     */
    getStats: async (): Promise<MachineStats> => {
        const response = await api.get('/machines/stats');
        return response.data.data;
    },

    /**
     * Cria uma nova máquina
     */
    create: async (data: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>): Promise<Machine> => {
        const response = await api.post('/machines', data);
        return response.data.data;
    },

    /**
     * Atualiza uma máquina existente
     */
    update: async (id: number, data: Partial<Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Machine> => {
        const response = await api.put(`/machines/${id}`, data);
        return response.data.data;
    },

    /**
     * Deleta uma máquina
     */
    delete: async (id: number): Promise<void> => {
        await api.delete(`/machines/${id}`);
    },
};
