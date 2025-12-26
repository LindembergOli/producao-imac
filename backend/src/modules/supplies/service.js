/**
 * MÓDULO: Supplies (Insumos)
 * SERVICE - Lógica de Negócio
 * 
 * Gerencia o cadastro de supplies (matérias-primas) da empresa.
 * Supplies são utilizados para calcular custos de perdas.
 */

import prisma from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';
import logger from '../../utils/logger.js';
import { paginate, createPaginatedResponse } from '../../utils/pagination.js';
import { getCached, invalidateCachePattern } from '../../utils/cache.js';

/**
 * Lista todos os supplies com paginação e cache
 * 
 * @param {number} page - Número da página (padrão: 1)
 * @param {number} limit - Itens por página (padrão: 20)
 * @returns {Promise<Object>} { data, pagination }
 */
export const getAll = async (page = 1, limit = 20) => {
    const cacheKey = `supplies:all:${page}:${limit}`;

    return getCached(cacheKey, 60000, async () => {
        const { skip, take } = paginate(page, limit);

        const [data, total] = await Promise.all([
            prisma.supply.findMany({
                where: { deletedAt: null },
                skip,
                take,
                orderBy: [
                    { sector: 'asc' },
                    { name: 'asc' }
                ],
            }),
            prisma.supply.count({ where: { deletedAt: null } })
        ]);

        return createPaginatedResponse(data, page, limit, total);
    });
};

export const getById = async (id) => {
    const supply = await prisma.supply.findUnique({
        where: { id: parseInt(id) },
    });

    if (!supply || supply.deletedAt) {
        throw new AppError('Supply não encontrado', 404);
    }

    return supply;
};

export const getBySector = async (sector) => {
    return await prisma.supply.findMany({
        where: {
            sector,
            deletedAt: null // Filtrar deletados
        },
        orderBy: { name: 'asc' },
    });
};

/**
 * Cria um novo supply e invalida cache
 */
export const create = async (data) => {
    const supply = await prisma.supply.create({ data });

    // Invalidar cache de supplies
    invalidateCachePattern('supplies:');

    logger.info('Supply criado', { supplyId: supply.id, name: supply.name });
    return supply;
};

/**
 * Atualiza um supply e invalida cache
 */
export const update = async (id, data) => {
    await getById(id);
    const supply = await prisma.supply.update({
        where: { id: parseInt(id) },
        data,
    });

    // Invalidar cache de supplies
    invalidateCachePattern('supplies:');

    logger.info('Supply atualizado', { supplyId: supply.id });
    return supply;
};

export const remove = async (id) => {
    await getById(id);

    // Soft delete - marca como deletado ao invés de remover fisicamente
    await prisma.supply.update({
        where: { id: parseInt(id) },
        data: { deletedAt: new Date() }
    });

    // Invalidar cache de supplies
    invalidateCachePattern('supplies:');

    logger.info('Supply marcado como deletado (soft delete)', { supplyId: id });
};
