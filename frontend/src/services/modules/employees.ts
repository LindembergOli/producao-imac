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
/**
 * Serviço de Funcionários
 * Gerencia o cadastro, consulta e demissão de funcionários.
 */
export const employeesService = {
    /**
     * Lista todos os funcionários cadastrados.
     * @returns {Promise<Employee[]>} Lista de funcionários formatados.
     */
    getAll: async (): Promise<Employee[]> => {
        const response = await api.get('/employees');
        const data = extractData<any>(response.data);
        return data.map(transformRecord);
    },

    /**
     * Busca um funcionário pelo ID.
     * @param {number} id - ID do funcionário.
     * @returns {Promise<Employee>} O funcionário encontrado.
     */
    getById: async (id: number): Promise<Employee> => {
        const response = await api.get(`/employees/${id}`);
        return transformRecord(response.data.data);
    },

    /**
     * Busca funcionários por setor.
     * @param {string} sector - Nome do setor.
     * @returns {Promise<Employee[]>} Lista de funcionários do setor.
     */
    getBySector: async (sector: string): Promise<Employee[]> => {
        const response = await api.get(`/employees/sector/${sector}`);
        return response.data.data.map(transformRecord);
    },

    /**
     * Busca estatísticas gerais de funcionários (total, pro setor, etc).
     * @returns {Promise<EmployeeStats>} Objeto com as estatísticas.
     */
    getStats: async (): Promise<EmployeeStats> => {
        const response = await api.get('/employees/stats');
        return response.data.data;
    },

    /**
     * Cria um novo funcionário.
     * @param {Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>} data - Dados do novo funcionário.
     * @returns {Promise<Employee>} O funcionário criado.
     */
    create: async (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> => {
        const response = await api.post('/employees', data);
        return transformRecord(response.data.data);
    },

    /**
     * Atualiza dados de um funcionário existente.
     * @param {number} id - ID do funcionário.
     * @param {Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>} data - Dados a serem atualizados.
     * @returns {Promise<Employee>} O funcionário atualizado.
     */
    update: async (id: number, data: Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Employee> => {
        const response = await api.put(`/employees/${id}`, data);
        return transformRecord(response.data.data);
    },

    /**
     * Remove um funcionário do sistema.
     * @param {number} id - ID do funcionário.
     * @returns {Promise<void>}
     */
    delete: async (id: number): Promise<void> => {
        await api.delete(`/employees/${id}`);
    },
};
