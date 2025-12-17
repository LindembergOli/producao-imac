/**
 * SERVIÇO: Manutenção
 */

import api from '../api';
import { MaintenanceRecord, Sector } from '../../types';

const sectorMap: Record<string, Sector> = {
    'CONFEITARIA': Sector.CONFEITARIA,
    'PAES': Sector.PAES,
    'SALGADO': Sector.SALGADO,
    'PAO_DE_QUEIJO': Sector.PAO_DE_QUEIJO,
    'EMBALADORA': Sector.EMBALADORA
};

const transformRecord = (record: any): MaintenanceRecord => {
    return {
        ...record,
        sector: sectorMap[record.sector] || record.sector
    };
};

export const maintenanceService = {
    getAll: async (): Promise<MaintenanceRecord[]> => {
        const response = await api.get('/maintenance');
        return response.data.data.map(transformRecord);
    },

    getById: async (id: number): Promise<MaintenanceRecord> => {
        const response = await api.get(`/maintenance/${id}`);
        return transformRecord(response.data.data);
    },

    create: async (data: Omit<MaintenanceRecord, 'id'>): Promise<MaintenanceRecord> => {
        const response = await api.post('/maintenance', data);
        return transformRecord(response.data.data);
    },

    update: async (id: number, data: Partial<Omit<MaintenanceRecord, 'id'>>): Promise<MaintenanceRecord> => {
        const response = await api.put(`/maintenance/${id}`, data);
        return transformRecord(response.data.data);
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/maintenance/${id}`);
    },
};
