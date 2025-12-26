/**
 * SERVIÇO: Perdas
 */

import api from '../api';
import { LossRecord, LossType, Sector } from '../../types';
import { extractData } from '../helpers';

const lossTypeMap: Record<string, LossType> = {
    'MASSA': LossType.MASSA,
    'EMBALAGEM': LossType.EMBALAGEM,
    'INSUMO': LossType.INSUMO
};

const sectorMap: Record<string, Sector> = {
    'CONFEITARIA': Sector.CONFEITARIA,
    'PAES': Sector.PAES,
    'SALGADO': Sector.SALGADO,
    'PAO_DE_QUEIJO': Sector.PAO_DE_QUEIJO,
    'EMBALADORA': Sector.EMBALADORA
};

const transformRecord = (record: any): LossRecord => {
    return {
        ...record,
        lossType: lossTypeMap[record.lossType] || record.lossType,
        sector: sectorMap[record.sector] || record.sector
    };
};

export const lossesService = {
    getAll: async (): Promise<LossRecord[]> => {
        const response = await api.get('/losses');
        const data = extractData<any>(response);
        return data.map(transformRecord);
    },

    getById: async (id: number): Promise<LossRecord> => {
        const response = await api.get(`/losses/${id}`);
        return transformRecord(response.data.data);
    },

    create: async (data: Omit<LossRecord, 'id'>): Promise<LossRecord> => {
        const response = await api.post('/losses', data);
        return transformRecord(response.data.data);
    },

    update: async (id: number, data: Partial<Omit<LossRecord, 'id'>>): Promise<LossRecord> => {
        const response = await api.put(`/losses/${id}`, data);
        return transformRecord(response.data.data);
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/losses/${id}`);
    },
};
