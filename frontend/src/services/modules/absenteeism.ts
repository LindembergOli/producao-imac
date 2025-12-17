/**
 * SERVIÇO: Absenteísmo
 */

import api from '../api';
import { AbsenteeismRecord, Sector } from '../../types';

const sectorMap: Record<string, Sector> = {
    'CONFEITARIA': Sector.CONFEITARIA,
    'PAES': Sector.PAES,
    'SALGADO': Sector.SALGADO,
    'PAO_DE_QUEIJO': Sector.PAO_DE_QUEIJO,
    'EMBALADORA': Sector.EMBALADORA
};

const absenceMap: Record<string, any> = {
    'ATESTADO': 'Atestado',
    'FALTA_INJUSTIFICADA': 'Falta Injustificada',
    'BANCO_DE_HORAS': 'Banco de Horas'
};

const transformRecord = (record: any): AbsenteeismRecord => {
    return {
        ...record,
        sector: sectorMap[record.sector] || record.sector,
        absenceType: absenceMap[record.absenceType] || record.absenceType
    };
};

export const absenteeismService = {
    getAll: async (): Promise<AbsenteeismRecord[]> => {
        const response = await api.get('/absenteeism');
        return response.data.data.map(transformRecord);
    },

    getById: async (id: number): Promise<AbsenteeismRecord> => {
        const response = await api.get(`/absenteeism/${id}`);
        return transformRecord(response.data.data);
    },

    create: async (data: Omit<AbsenteeismRecord, 'id'>): Promise<AbsenteeismRecord> => {
        const response = await api.post('/absenteeism', data);
        return transformRecord(response.data.data);
    },

    update: async (id: number, data: Partial<Omit<AbsenteeismRecord, 'id'>>): Promise<AbsenteeismRecord> => {
        const response = await api.put(`/absenteeism/${id}`, data);
        return transformRecord(response.data.data);
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/absenteeism/${id}`);
    },
};
