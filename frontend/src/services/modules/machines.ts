/**
 * SERVIÇO: Máquinas
 */

import api from '../api';
import type { Machine } from '../../types';
import { Sector } from '../../types';
import { extractData } from '../helpers';

const sectorMap: Record<string, Sector> = {
    'CONFEITARIA': Sector.CONFEITARIA,
    'PAES': Sector.PAES,
    'SALGADO': Sector.SALGADO,
    'PAO_DE_QUEIJO': Sector.PAO_DE_QUEIJO,
    'EMBALADORA': Sector.EMBALADORA,
    'MANUTENCAO': Sector.MANUTENCAO
};

const transformRecord = (record: any): Machine => {
    return {
        ...record,
        sector: sectorMap[record.sector] || record.sector
    };
};

export const machinesService = {
    getAll: async (): Promise<Machine[]> => {
        const response = await api.get('/machines');
        const data = extractData<Machine>(response.data);
        return data.map(transformRecord);
    },

    getById: async (id: number): Promise<Machine> => {
        const response = await api.get(`/machines/${id}`);
        return transformRecord(response.data.data);
    },

    getBySector: async (sector: string): Promise<Machine[]> => {
        const response = await api.get(`/machines/sector/${sector}`);
        return response.data.data.map(transformRecord);
    },

    getByCode: async (code: string): Promise<Machine> => {
        const response = await api.get(`/machines/code/${code}`);
        return transformRecord(response.data.data);
    },

    create: async (data: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>): Promise<Machine> => {
        const response = await api.post('/machines', data);
        return transformRecord(response.data.data);
    },

    update: async (id: number, data: Partial<Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Machine> => {
        const response = await api.put(`/machines/${id}`, data);
        return transformRecord(response.data.data);
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/machines/${id}`);
    },
};
