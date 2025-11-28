/**
 * Service - Lógica de negócio de Employees
 */

import { employeeRepository } from '../repositories/employeeRepository.js';
import { AppError } from '../middlewares/errorHandler.js';

export const employeeService = {
    // Listar todos
    async getAllEmployees() {
        return await employeeRepository.findAll();
    },

    // Buscar por ID
    async getEmployeeById(id) {
        const employee = await employeeRepository.findById(id);

        if (!employee) {
            throw new AppError('Funcionário não encontrado', 404);
        }

        return employee;
    },

    // Buscar por setor
    async getEmployeesBySector(sector) {
        return await employeeRepository.findBySector(sector);
    },

    // Criar funcionário
    async createEmployee(data) {
        // Validações de negócio podem ser adicionadas aqui
        return await employeeRepository.create(data);
    },

    // Atualizar funcionário
    async updateEmployee(id, data) {
        // Verificar se existe
        await this.getEmployeeById(id);

        return await employeeRepository.update(id, data);
    },

    // Deletar funcionário
    async deleteEmployee(id) {
        // Verificar se existe
        await this.getEmployeeById(id);

        return await employeeRepository.delete(id);
    },

    // Estatísticas
    async getEmployeeStats() {
        const total = await employeeRepository.count();
        const employees = await employeeRepository.findAll();

        // Contar por setor
        const bySector = employees.reduce((acc, emp) => {
            acc[emp.sector] = (acc[emp.sector] || 0) + 1;
            return acc;
        }, {});

        return {
            total,
            bySector,
        };
    },
};
