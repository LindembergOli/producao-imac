/**
 * MÓDULO: Funcionários (Employees)
 * SERVICE - Lógica de Negócio
 * 
 * Gerencia o cadastro e consulta de funcionários da empresa.
 * Permite criar, listar, atualizar e deletar funcionários,
 * além de consultar por setor e gerar estatísticas.
 * 
 * Funcionalidades:
 * - CRUD completo de funcionários
 * - Consulta por setor
 * - Estatísticas por setor
 * - Validação de dados
 */

import prisma from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';
import logger from '../../utils/logger.js';

/**
 * Lista todos os funcionários
 * 
 * @returns {Promise<Array>} Lista de funcionários
 */
export const getAll = async () => {
    return await prisma.employee.findMany({
        orderBy: [
            { sector: 'asc' },
            { name: 'asc' }
        ],
    });
};

/**
 * Busca funcionário por ID
 * 
 * @param {number} id - ID do funcionário
 * @returns {Promise<Object>} Funcionário encontrado
 * @throws {AppError} Se funcionário não for encontrado
 */
export const getById = async (id) => {
    const employee = await prisma.employee.findUnique({
        where: { id: parseInt(id) },
    });

    if (!employee) {
        throw new AppError('Funcionário não encontrado', 404);
    }

    return employee;
};

/**
 * Busca funcionários por setor
 * 
 * @param {string} sector - Setor (CONFEITARIA, PAES, SALGADO, PAO_DE_QUEIJO, EMBALADORA)
 * @returns {Promise<Array>} Lista de funcionários do setor
 */
export const getBySector = async (sector) => {
    return await prisma.employee.findMany({
        where: { sector },
        orderBy: { name: 'asc' },
    });
};

/**
 * Cria um novo funcionário
 * 
 * @param {Object} data - Dados do funcionário
 * @param {string} data.name - Nome do funcionário
 * @param {string} data.sector - Setor
 * @param {string} [data.role] - Cargo/função
 * @returns {Promise<Object>} Funcionário criado
 */
export const create = async (data) => {
    const employee = await prisma.employee.create({
        data,
    });

    logger.info('Funcionário criado', {
        employeeId: employee.id,
        name: employee.name,
        sector: employee.sector,
    });

    return employee;
};

/**
 * Atualiza dados de um funcionário
 * 
 * @param {number} id - ID do funcionário
 * @param {Object} data - Dados a serem atualizados
 * @returns {Promise<Object>} Funcionário atualizado
 * @throws {AppError} Se funcionário não for encontrado
 */
export const update = async (id, data) => {
    // Verificar se funcionário existe
    await getById(id);

    const employee = await prisma.employee.update({
        where: { id: parseInt(id) },
        data,
    });

    logger.info('Funcionário atualizado', {
        employeeId: employee.id,
        name: employee.name,
    });

    return employee;
};

/**
 * Deleta um funcionário
 * 
 * @param {number} id - ID do funcionário
 * @returns {Promise<void>}
 * @throws {AppError} Se funcionário não for encontrado
 */
export const remove = async (id) => {
    // Verificar se funcionário existe
    await getById(id);

    await prisma.employee.delete({
        where: { id: parseInt(id) },
    });

    logger.info('Funcionário deletado', { employeeId: id });
};

/**
 * Retorna estatísticas de funcionários
 * 
 * @returns {Promise<Object>} Estatísticas (total, por setor)
 */
export const getStats = async () => {
    const employees = await getAll();
    const total = employees.length;

    // Contar por setor
    const bySector = employees.reduce((acc, emp) => {
        acc[emp.sector] = (acc[emp.sector] || 0) + 1;
        return acc;
    }, {});

    return {
        total,
        bySector,
    };
};
