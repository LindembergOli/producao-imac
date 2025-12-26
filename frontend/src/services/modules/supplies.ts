/**
 * SERVIÇO: Supplies (Insumos)
 */

import api from '../api';
import type { Supply } from '../../types';
import { Sector } from '../../types';

interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

const sectorMap: Record<string, Sector> = {
    'CONFEITARIA': Sector.CONFEITARIA,
    'PAES': Sector.PAES,
    'SALGADO': Sector.SALGADO,
    'PAO_DE_QUEIJO': Sector.PAO_DE_QUEIJO,
    'EMBALADORA': Sector.EMBALADORA,
    'MANUTENCAO': Sector.MANUTENCAO
};

const transformSupply = (supply: any): Supply => {
    return {
        ...supply,
        sector: sectorMap[supply.sector] || supply.sector,
    };
};

export const suppliesService = {
    getAll: async (): Promise<Supply[]> => {
        const response = await api.get('/supplies');
        // Extrai dados da resposta paginada e transforma setores
        const supplies = Array.isArray(response.data) ? response.data : response.data.data;
        return supplies.map(transformSupply);
    },

    getById: async (id: number): Promise<Supply> => {
        const response = await api.get(`/supplies/${id}`);
        return transformSupply(response.data.data);
    },

    getBySector: async (sector: string): Promise<Supply[]> => {
        const response = await api.get(`/supplies/sector/${sector}`);
        return response.data.data.map(transformSupply);
    },

    create: async (data: Omit<Supply, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supply> => {
        const response = await api.post('/supplies', data);
        return response.data.data;
    },

    update: async (id: number, data: Partial<Omit<Supply, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Supply> => {
        const response = await api.put(`/supplies/${id}`, data);
        return response.data.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/supplies/${id}`);
    },
};
