/**
 * MÓDULO: Máquinas
 * SERVICE - Lógica de Negócio
 * 
 * Gerencia o cadastro de máquinas da empresa.
 * Máquinas são utilizadas para rastreamento de manutenções
 * e identificação de equipamentos por setor.
 * 
 * Funcionalidades:
 * - CRUD completo de máquinas
 * - Consulta por setor
 * - Busca por código único
 */

import prisma from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';
import logger from '../../utils/logger.js';

/**
 * Lista todas as máquinas
 * 
 * @returns {Promise<Array>} Lista de máquinas
 */
export const getAll = async () => {
    return await prisma.machine.findMany({
        orderBy: [
            { sector: 'asc' },
            { name: 'asc' }
        ],
    });
};

/**
 * Busca máquina por ID
 * 
 * @param {number} id - ID da máquina
 * @returns {Promise<Object>} Máquina encontrada
 * @throws {AppError} Se máquina não for encontrada
 */
export const getById = async (id) => {
    const machine = await prisma.machine.findUnique({
        where: { id: parseInt(id) },
    });

    if (!machine) {
        throw new AppError('Máquina não encontrada', 404);
    }

    return machine;
};

/**
 * Busca máquina por código único
 * 
 * @param {string} code - Código da máquina
 * @returns {Promise<Object>} Máquina encontrada
 * @throws {AppError} Se máquina não for encontrada
 */
export const getByCode = async (code) => {
    const machine = await prisma.machine.findUnique({
        where: { code },
    });

    if (!machine) {
        throw new AppError('Máquina não encontrada', 404);
    }

    return machine;
};

/**
 * Busca máquinas por setor
 * 
 * @param {string} sector - Setor (CONFEITARIA, PAES, SALGADO, PAO_DE_QUEIJO, EMBALADORA)
 * @returns {Promise<Array>} Lista de máquinas do setor
 */
export const getBySector = async (sector) => {
    return await prisma.machine.findMany({
        where: { sector },
        orderBy: { name: 'asc' },
    });
};

/**
 * Cria uma nova máquina
 * 
 * @param {Object} data - Dados da máquina
 * @param {string} data.name - Nome da máquina
 * @param {string} data.code - Código único da máquina
 * @param {string} data.sector - Setor
 * @returns {Promise<Object>} Máquina criada
 * @throws {AppError} Se código já existir
 */
export const create = async (data) => {
    // Verificar se código já existe
    const existingMachine = await prisma.machine.findUnique({
        where: { code: data.code },
    });

    if (existingMachine) {
        throw new AppError('Código de máquina já cadastrado', 409);
    }

    const machine = await prisma.machine.create({
        data,
    });

    logger.info('Máquina criada', {
        machineId: machine.id,
        name: machine.name,
        code: machine.code,
        sector: machine.sector,
    });

    return machine;
};

/**
 * Atualiza dados de uma máquina
 * 
 * @param {number} id - ID da máquina
 * @param {Object} data - Dados a serem atualizados
 * @returns {Promise<Object>} Máquina atualizada
 * @throws {AppError} Se máquina não for encontrada ou código já existir
 */
export const update = async (id, data) => {
    // Verificar se máquina existe
    await getById(id);

    // Se estiver atualizando o código, verificar se não existe
    if (data.code) {
        const existingMachine = await prisma.machine.findUnique({
            where: { code: data.code },
        });

        if (existingMachine && existingMachine.id !== parseInt(id)) {
            throw new AppError('Código de máquina já cadastrado', 409);
        }
    }

    const machine = await prisma.machine.update({
        where: { id: parseInt(id) },
        data,
    });

    logger.info('Máquina atualizada', {
        machineId: machine.id,
        name: machine.name,
    });

    return machine;
};

/**
 * Deleta uma máquina
 * 
 * @param {number} id - ID da máquina
 * @returns {Promise<void>}
 * @throws {AppError} Se máquina não for encontrada
 */
export const remove = async (id) => {
    // Verificar se máquina existe
    await getById(id);

    await prisma.machine.delete({
        where: { id: parseInt(id) },
    });

    logger.info('Máquina deletada', { machineId: id });
};

/**
 * Retorna estatísticas de máquinas
 * 
 * @returns {Promise<Object>} Estatísticas (total, por setor)
 */
export const getStats = async () => {
    const machines = await getAll();
    const total = machines.length;

    // Contar por setor
    const bySector = machines.reduce((acc, machine) => {
        acc[machine.sector] = (acc[machine.sector] || 0) + 1;
        return acc;
    }, {});

    return {
        total,
        bySector,
    };
};
