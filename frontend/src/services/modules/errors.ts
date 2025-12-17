/**
 * SERVIÇO: Erros de Produção
 */

import api from '../api';
import { ErrorRecord, Sector } from '../../types';

const sectorMap: Record<string, Sector> = {
    'CONFEITARIA': Sector.CONFEITARIA,
    'PAES': Sector.PAES,
    'SALGADO': Sector.SALGADO,
    'PAO_DE_QUEIJO': Sector.PAO_DE_QUEIJO,
    'EMBALADORA': Sector.EMBALADORA
};

const transformRecord = (record: any): ErrorRecord => {
    return {
        ...record,
        sector: sectorMap[record.sector] || record.sector
    };
};

export const errorsService = {
    getAll: async (): Promise<ErrorRecord[]> => {
        const response = await api.get('/errors');
        return response.data.data.map(transformRecord);
    },

    getById: async (id: number): Promise<ErrorRecord> => {
        const response = await api.get(`/errors/${id}`);
        return transformRecord(response.data.data);
    },

    create: async (data: Omit<ErrorRecord, 'id'>): Promise<ErrorRecord> => {
        const response = await api.post('/errors', data);
        return transformRecord(response.data.data);
    },

    update: async (id: number, data: Partial<Omit<ErrorRecord, 'id'>>): Promise<ErrorRecord> => {
        const response = await api.put(`/errors/${id}`, data);
        return transformRecord(response.data.data);
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/errors/${id}`);
    },
};
