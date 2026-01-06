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

/**
 * Serviço de Absenteísmo
 * Gerencia o registro e consulta de faltas e atestados dos funcionários.
 */
export const absenteeismService = {
    /**
     * Lista todos os registros de absenteísmo.
     * @returns {Promise<AbsenteeismRecord[]>} Lista de registros formatados.
     */
    getAll: async (): Promise<AbsenteeismRecord[]> => {
        const response = await api.get('/absenteeism');
        const data = extractData<any>(response.data);
        return data.map(transformRecord);
    },

    /**
     * Busca um registro de absenteísmo pelo ID.
     * @param {number} id - ID do registro.
     * @returns {Promise<AbsenteeismRecord>} O registro encontrado.
     */
    getById: async (id: number): Promise<AbsenteeismRecord> => {
        const response = await api.get(`/absenteeism/${id}`);
        return transformRecord(response.data.data);
    },

    /**
     * Cria um novo registro de absenteísmo.
     * @param {Omit<AbsenteeismRecord, 'id'>} data - Dados do novo registro.
     * @returns {Promise<AbsenteeismRecord>} O registro criado.
     */
    create: async (data: Omit<AbsenteeismRecord, 'id'>): Promise<AbsenteeismRecord> => {
        const response = await api.post('/absenteeism', data);
        return transformRecord(response.data.data);
    },

    /**
     * Atualiza um registro existente de absenteísmo.
     * @param {number} id - ID do registro a ser atualizado.
     * @param {Partial<Omit<AbsenteeismRecord, 'id'>>} data - Dados a serem atualizados.
     * @returns {Promise<AbsenteeismRecord>} O registro atualizado.
     */
    update: async (id: number, data: Partial<Omit<AbsenteeismRecord, 'id'>>): Promise<AbsenteeismRecord> => {
        const response = await api.put(`/absenteeism/${id}`, data);
        return transformRecord(response.data.data);
    },

    /**
     * Remove um registro de absenteísmo.
     * @param {number} id - ID do registro a ser removido.
     * @returns {Promise<void>}
     */
    delete: async (id: number): Promise<void> => {
        await api.delete(`/absenteeism/${id}`);
    },
};
