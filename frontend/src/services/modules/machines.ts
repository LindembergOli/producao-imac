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

/**
 * Serviço de Máquinas
 * Gerencia o inventário de equipamentos e máquinas da fábrica.
 */
export const machinesService = {
    /**
     * Lista todas as máquinas cadastradas.
     * @returns {Promise<Machine[]>} Lista de máquinas formatadas.
     */
    getAll: async (): Promise<Machine[]> => {
        const response = await api.get('/machines');
        const data = extractData<Machine>(response.data);
        return data.map(transformRecord);
    },

    /**
     * Busca uma máquina pelo ID.
     * @param {number} id - ID da máquina.
     * @returns {Promise<Machine>} A máquina encontrada.
     */
    getById: async (id: number): Promise<Machine> => {
        const response = await api.get(`/machines/${id}`);
        return transformRecord(response.data.data);
    },

    /**
     * Busca máquinas por setor.
     * @param {string} sector - Nome do setor.
     * @returns {Promise<Machine[]>} Lista de máquinas do setor.
     */
    getBySector: async (sector: string): Promise<Machine[]> => {
        const response = await api.get(`/machines/sector/${sector}`);
        return response.data.data.map(transformRecord);
    },

    /**
     * Busca uma máquina pelo código de identificação.
     * @param {string} code - Código da máquina.
     * @returns {Promise<Machine>} A máquina encontrada.
     */
    getByCode: async (code: string): Promise<Machine> => {
        const response = await api.get(`/machines/code/${code}`);
        return transformRecord(response.data.data);
    },

    /**
     * Cadastra uma nova máquina.
     * @param {Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>} data - Dados da nova máquina.
     * @returns {Promise<Machine>} A máquina criada.
     */
    create: async (data: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>): Promise<Machine> => {
        const response = await api.post('/machines', data);
        return transformRecord(response.data.data);
    },

    /**
     * Atualiza os dados de uma máquina.
     * @param {number} id - ID da máquina.
     * @param {Partial<Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>>} data - Dados a serem atualizados.
     * @returns {Promise<Machine>} A máquina atualizada.
     */
    update: async (id: number, data: Partial<Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Machine> => {
        const response = await api.put(`/machines/${id}`, data);
        return transformRecord(response.data.data);
    },

    /**
     * Remove uma máquina do sistema.
     * @param {number} id - ID da máquina.
     * @returns {Promise<void>}
     */
    delete: async (id: number): Promise<void> => {
        await api.delete(`/machines/${id}`);
    },
};
