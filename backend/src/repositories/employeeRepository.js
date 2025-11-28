/**
 * Repository - Acesso a dados de Employees
 */

import prisma from '../config/database.js';

export const employeeRepository = {
    // Buscar todos
    async findAll() {
        return await prisma.employee.findMany({
            orderBy: { sector: 'asc' },
        });
    },

    // Buscar por ID
    async findById(id) {
        return await prisma.employee.findUnique({
            where: { id: parseInt(id) },
        });
    },

    // Buscar por setor
    async findBySector(sector) {
        return await prisma.employee.findMany({
            where: { sector },
            orderBy: { name: 'asc' },
        });
    },

    // Criar
    async create(data) {
        return await prisma.employee.create({
            data,
        });
    },

    // Atualizar
    async update(id, data) {
        return await prisma.employee.update({
            where: { id: parseInt(id) },
            data,
        });
    },

    // Deletar
    async delete(id) {
        return await prisma.employee.delete({
            where: { id: parseInt(id) },
        });
    },

    // Contar total
    async count() {
        return await prisma.employee.count();
    },
};
