/**
 * SERVIÇO: Funcionários (Employees)
 * 
 * Serviço para gerenciar operações relacionadas a funcionários.
 * Todos os métodos retornam Promises com os dados da API.
 */

import api from '../api';
import { Employee, Sector } from '../../types';
import { extractData } from '../helpers';

const sectorMap: Record<string, Sector> = {
    'CONFEITARIA': Sector.CONFEITARIA,
    'PAES': Sector.PAES,
    'SALGADO': Sector.SALGADO,
    'PAO_DE_QUEIJO': Sector.PAO_DE_QUEIJO,
    'EMBALADORA': Sector.EMBALADORA,
    'MANUTENCAO': Sector.MANUTENCAO
};

const transformRecord = (record: any): Employee => {
    return {
        ...record,
        sector: sectorMap[record.sector] || record.sector
    };
};

export interface EmployeeStats {
    total: number;
    bySector: Record<string, number>;
}

/**
 * Serviço de Funcionários
 */
export const employeesService = {
    /**
     * Lista todos os funcionários
     */
    getAll: async (): Promise<Employee[]> => {
        const response = await api.get('/employees');
        const data = extractData<any>(response.data);
        return data.map(transformRecord);
    },

    /**
     * Busca funcionário por ID
     */
    getById: async (id: number): Promise<Employee> => {
        const response = await api.get(`/employees/${id}`);
        return transformRecord(response.data.data);
    },

    /**
     * Busca funcionários por setor
     */
    getBySector: async (sector: string): Promise<Employee[]> => {
        const response = await api.get(`/employees/sector/${sector}`);
        return response.data.data.map(transformRecord);
    },

    /**
     * Busca estatísticas de funcionários
     */
    getStats: async (): Promise<EmployeeStats> => {
        const response = await api.get('/employees/stats');
        return response.data.data;
    },

    /**
     * Cria novo funcionário
     */
    create: async (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> => {
        const response = await api.post('/employees', data);
        return transformRecord(response.data.data);
    },

    /**
     * Atualiza funcionário existente
     */
    update: async (id: number, data: Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Employee> => {
        const response = await api.put(`/employees/${id}`, data);
        return transformRecord(response.data.data);
    },

    /**
     * Remove funcionário
     */
    delete: async (id: number): Promise<void> => {
        await api.delete(`/employees/${id}`);
    },
};
