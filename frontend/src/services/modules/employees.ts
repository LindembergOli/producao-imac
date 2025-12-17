/**
 * SERVIÇO: Funcionários (Employees)
 * 
 * Serviço para gerenciar operações relacionadas a funcionários.
 * Todos os métodos retornam Promises com os dados da API.
 */

import api from '../api';
import { Employee, Sector } from '../../types';

const sectorMap: Record<string, Sector> = {
    'CONFEITARIA': Sector.CONFEITARIA,
    'PAES': Sector.PAES,
    'SALGADO': Sector.SALGADO,
    'PAO_DE_QUEIJO': Sector.PAO_DE_QUEIJO,
    'EMBALADORA': Sector.EMBALADORA
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
        return response.data.data.map(transformRecord);
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
     * Retorna estatísticas de funcionários
     */
    getStats: async (): Promise<EmployeeStats> => {
        const response = await api.get('/employees/stats');
        // Stats might use keys like 'PAES', but we don't usually map stats keys unless UI uses them directly as enums
        // Assuming stats are just counts
        return response.data.data;
    },

    /**
     * Cria um novo funcionário
     */
    create: async (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> => {
        const response = await api.post('/employees', data);
        return transformRecord(response.data.data);
    },

    /**
     * Atualiza um funcionário existente
     */
    update: async (id: number, data: Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Employee> => {
        const response = await api.put(`/employees/${id}`, data);
        return transformRecord(response.data.data);
    },

    /**
     * Deleta um funcionário
     */
    delete: async (id: number): Promise<void> => {
        await api.delete(`/employees/${id}`);
    },
};
