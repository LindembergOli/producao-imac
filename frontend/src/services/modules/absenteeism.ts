/**
 * SERVIÇO: Absenteísmo
 */

import api from '../api';
import { AbsenteeismRecord, AbsenceType, Sector } from '../../types';
import { extractData } from '../helpers';

const sectorMap: Record<string, Sector> = {
    'CONFEITARIA': Sector.CONFEITARIA,
    'PAES': Sector.PAES,
    'SALGADO': Sector.SALGADO,
    'PAO_DE_QUEIJO': Sector.PAO_DE_QUEIJO,
    'EMBALADORA': Sector.EMBALADORA,
    'MANUTENCAO': Sector.MANUTENCAO
};

const absenceTypeMap: Record<string, AbsenceType> = {
    'ATESTADO': AbsenceType.ATESTADO,
    'FALTA_INJUSTIFICADA': AbsenceType.FALTA_INJUSTIFICADA,
    'BANCO_DE_HORAS': AbsenceType.BANCO_DE_HORAS
};

const transformRecord = (record: any): AbsenteeismRecord => {
    return {
        ...record,
        sector: sectorMap[record.sector] || record.sector,
        absenceType: absenceTypeMap[record.absenceType] || record.absenceType
    };
};

export const absenteeismService = {
    getAll: async (): Promise<AbsenteeismRecord[]> => {
        const response = await api.get('/absenteeism');
        const data = extractData<any>(response.data);
        return data.map(transformRecord);
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
