/**
 * SERVIÇO: Velocidade de Produção
 */

import api from '../api';
import { ProductionSpeedRecord, Sector } from '../../types';

const sectorMap: Record<string, Sector> = {
    'CONFEITARIA': Sector.CONFEITARIA,
    'PAES': Sector.PAES,
    'SALGADO': Sector.SALGADO,
    'PAO_DE_QUEIJO': Sector.PAO_DE_QUEIJO,
    'EMBALADORA': Sector.EMBALADORA
};

const transformRecord = (record: any): ProductionSpeedRecord => {
    return {
        ...record,
        sector: sectorMap[record.sector] || record.sector
    };
};

export const productionService = {
    getAll: async (): Promise<ProductionSpeedRecord[]> => {
        const response = await api.get('/production');
        return response.data.data.map(transformRecord);
    },

    getById: async (id: number): Promise<ProductionSpeedRecord> => {
        const response = await api.get(`/production/${id}`);
        return transformRecord(response.data.data);
    },

    create: async (data: Omit<ProductionSpeedRecord, 'id'>): Promise<ProductionSpeedRecord> => {
        const response = await api.post('/production', data);
        return transformRecord(response.data.data);
    },

    update: async (id: number, data: Partial<Omit<ProductionSpeedRecord, 'id'>>): Promise<ProductionSpeedRecord> => {
        const response = await api.put(`/production/${id}`, data);
        return transformRecord(response.data.data);
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/production/${id}`);
    },
};
