/**
 * SERVIÇO: Manutenção
 */

import api from '../api';
import { MaintenanceRecord, MaintenanceStatus } from '../../types';
import { extractData } from '../helpers';

const statusMap: Record<string, MaintenanceStatus> = {
    'EM_ABERTO': MaintenanceStatus.EM_ABERTO,
    'FECHADO': MaintenanceStatus.FECHADO
};

const transformRecord = (record: any): MaintenanceRecord => {
    return {
        ...record,
        status: statusMap[record.status] || record.status
    };
};

export const maintenanceService = {
    getAll: async (): Promise<MaintenanceRecord[]> => {
        const response = await api.get('/maintenance');
        const data = extractData<any>(response.data);
        return data.map(transformRecord);
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
