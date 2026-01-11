/**
 * SERVIÇO: Insumos
 */

import api from '../api';
import type { Supply as Insumo } from '../../types';

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

// Mapeamento reverso: backend enum -> frontend display (MAIÚSCULAS)
const reverseSectorMap: Record<string, string> = {
    'CONGELADOS': 'CONGELADOS',
    'RESFRIADOS': 'RESFRIADOS',
    'TEMPEROS': 'TEMPEROS',
    'EMBALAGEM': 'EMBALAGEM',
    'EXPEDICAO': 'EXPEDIÇÃO',
    'MANUTENCAO': 'MANUTENÇÃO',
    'PAO_DE_QUEIJO': 'PÃO DE QUEIJO',
    'PAES': 'PÃES',
    'SALGADO': 'SALGADO',
    'CONFEITARIA': 'CONFEITARIA',
    'EMBALADORA': 'EMBALADORA',
};

const transformInsumo = (insumo: any): Insumo => {
    return {
        ...insumo,
        sector: reverseSectorMap[insumo.sector] || insumo.sector,
    };
};

export const insumosService = {
    getAll: async (): Promise<Insumo[]> => {
        const response = await api.get('/insumos');
        // Extrai dados da resposta paginada e transforma setores
        const insumos = Array.isArray(response.data) ? response.data : response.data.data;
        return insumos.map(transformInsumo);
    },

    getById: async (id: number): Promise<Insumo> => {
        const response = await api.get(`/insumos/${id}`);
        return transformInsumo(response.data.data);
    },

    getBySector: async (sector: string): Promise<Insumo[]> => {
        const response = await api.get(`/insumos/sector/${sector}`);
        return response.data.data.map(transformInsumo);
    },

    create: async (data: Omit<Insumo, 'id' | 'createdAt' | 'updatedAt'>): Promise<Insumo> => {
        const response = await api.post('/insumos', data);
        return response.data.data;
    },

    update: async (id: number, data: Partial<Omit<Insumo, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Insumo> => {
        const response = await api.put(`/insumos/${id}`, data);
        return response.data.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/insumos/${id}`);
    },
};
