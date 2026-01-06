/**
 * MÓDULO: Velocidade de Produção
 * SERVICE
 */

import prisma from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';
import logger from '../../utils/logger.js';
import { paginate, createPaginatedResponse } from '../../utils/pagination.js';

/**
 * Lista todos os registros com paginação.
 * 
 * @param {number} [page=1] - Página atual.
 * @param {number} [limit=20] - Limite por página.
 * @returns {Promise<Object>} Dados paginados com unidade do produto preenchida.
 */
export const getAll = async (page = 1, limit = 20) => {
    const { skip, take } = paginate(page, limit);

    const [data, total] = await Promise.all([
        prisma.productionSpeed.findMany({
            where: { deletedAt: null },
            skip,
            take,
            orderBy: [
                { createdAt: 'desc' },     // 1º: Data mais recente primeiro
                { sector: 'asc' },         // 2º: Setor em ordem alfabética
                { produto: 'asc' }         // 3º: Produto em ordem alfabética
            ],
        }),
        prisma.productionSpeed.count({ where: { deletedAt: null } })
    ]);

    // Buscar unidade de cada produto
    const dataWithUnit = await Promise.all(data.map(async (record) => {
        const product = await prisma.product.findFirst({
            where: {
                name: record.produto,
                sector: record.sector,
                deletedAt: null
            },
            select: { unit: true }
        });

        return {
            ...record,
            unit: product?.unit || 'UND' // Fallback para UND se não encontrar
        };
    }));

    return createPaginatedResponse(dataWithUnit, page, limit, total);
};

/**
 * Busca registro por ID.
 * 
 * @param {string|number} id - ID do registro.
 * @returns {Promise<Object>} Registro encontrado.
 * @throws {AppError} 404 se não encontrado.
 */
export const getById = async (id) => {
    const record = await prisma.productionSpeed.findUnique({
        where: { id: parseInt(id) },
    });
    if (!record || record.deletedAt) throw new AppError('Registro não encontrado', 404);
    return record;
};

/**
 * Cria novo registro de velocidade de produção.
 * Realiza cálculo automático de totalRealizadoKgUnd baseado no rendimento do produto.
 * 
 * @param {Object} data - Dados do registro.
 * @param {string} data.produto - Nome do produto.
 * @param {string} data.sector - Setor.
 * @param {number} data.totalRealizado - Quantidade realizada.
 * @returns {Promise<Object>} Registro criado.
 * @throws {AppError} 404 se produto não encontrado, 400 se produto sem rendimento.
 */
export const create = async (data) => {
    // Buscar produto para obter rendimento (yield)
    const product = await prisma.product.findFirst({
        where: {
            name: data.produto,
            sector: data.sector,
            deletedAt: null
        }
    });

    if (!product) {
        throw new AppError(`Produto "${data.produto}" não encontrado no setor ${data.sector}`, 404);
    }

    if (!product.yield || product.yield === 0) {
        throw new AppError(`Produto "${data.produto}" não possui rendimento cadastrado`, 400);
    }

    // Calcular totalRealizadoKgUnd = totalRealizado × rendimento
    const totalRealizadoKgUnd = data.totalRealizado * product.yield;

    // Criar registro com o valor calculado
    const record = await prisma.productionSpeed.create({
        data: {
            ...data,
            totalRealizadoKgUnd
        }
    });

    logger.info('Velocidade de produção criada', { id: record.id, totalRealizadoKgUnd });
    return record;
};

/**
 * Atualiza registro existente.
 * Recalcula totalRealizadoKgUnd.
 * 
 * @param {string|number} id - ID.
 * @param {Object} data - Dados a atualizar.
 * @returns {Promise<Object>} Registro atualizado.
 */
export const update = async (id, data) => {
    await getById(id);

    // Buscar produto para obter rendimento (yield)
    const product = await prisma.product.findFirst({
        where: {
            name: data.produto,
            sector: data.sector,
            deletedAt: null
        }
    });

    if (!product) {
        throw new AppError(`Produto "${data.produto}" não encontrado no setor ${data.sector}`, 404);
    }

    if (!product.yield || product.yield === 0) {
        throw new AppError(`Produto "${data.produto}" não possui rendimento cadastrado`, 400);
    }

    // Recalcular totalRealizadoKgUnd = totalRealizado × rendimento
    const totalRealizadoKgUnd = data.totalRealizado * product.yield;

    // Atualizar registro com o valor recalculado
    const record = await prisma.productionSpeed.update({
        where: { id: parseInt(id) },
        data: {
            ...data,
            totalRealizadoKgUnd
        },
    });

    logger.info('Velocidade de produção atualizada', { id: record.id, totalRealizadoKgUnd });
    return record;
};

/**
 * Remove registro (soft delete).
 * 
 * @param {string|number} id - ID.
 */
export const remove = async (id) => {
    await getById(id);
    await prisma.productionSpeed.update({
        where: { id: parseInt(id) },
        data: { deletedAt: new Date() },
    });
    logger.info('Velocidade de produção deletada', { id });
};
