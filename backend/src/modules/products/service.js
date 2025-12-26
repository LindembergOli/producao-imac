/**
 * MÓDULO: Produtos
 * SERVICE - Lógica de Negócio
 * 
 * Gerencia o cadastro de produtos da empresa.
 * Produtos são utilizados para calcular custos de perdas e erros.
 */

import prisma from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';
import logger from '../../utils/logger.js';
import { paginate, createPaginatedResponse } from '../../utils/pagination.js';
import { getCached, invalidateCachePattern } from '../../utils/cache.js';

/**
 * Lista todos os produtos com paginação e cache
 * 
 * @param {number} page - Número da página (padrão: 1)
 * @param {number} limit - Itens por página (padrão: 20)
 * @returns {Promise<Object>} { data, pagination }
 */
export const getAll = async (page = 1, limit = 20) => {
    const cacheKey = `products:all:${page}:${limit}`;

    return getCached(cacheKey, 60000, async () => {
        const { skip, take } = paginate(page, limit);

        const [data, total] = await Promise.all([
            prisma.product.findMany({
                where: { deletedAt: null },
                skip,
                take,
                orderBy: [
                    { sector: 'asc' },
                    { name: 'asc' }
                ],
            }),
            prisma.product.count({ where: { deletedAt: null } })
        ]);

        return createPaginatedResponse(data, page, limit, total);
    });
};

export const getById = async (id) => {
    const product = await prisma.product.findUnique({
        where: { id: parseInt(id) },
    });

    if (!product || product.deletedAt) {
        throw new AppError('Produto não encontrado', 404);
    }

    return product;
};

export const getBySector = async (sector) => {
    return await prisma.product.findMany({
        where: {
            sector,
            deletedAt: null // Filtrar deletados
        },
        orderBy: { name: 'asc' },
    });
};

/**
 * Cria um novo produto e invalida cache
 */
export const create = async (data) => {
    const product = await prisma.product.create({ data });

    // Invalidar cache de produtos
    invalidateCachePattern('products:');

    logger.info('Produto criado', { productId: product.id, name: product.name });
    return product;
};

/**
 * Atualiza um produto e invalida cache
 */
export const update = async (id, data) => {
    await getById(id);
    const product = await prisma.product.update({
        where: { id: parseInt(id) },
        data,
    });

    // Invalidar cache de produtos
    invalidateCachePattern('products:');

    logger.info('Produto atualizado', { productId: product.id });
    return product;
};

export const remove = async (id) => {
    await getById(id);

    // Soft delete - marca como deletado ao invés de remover fisicamente
    await prisma.product.update({
        where: { id: parseInt(id) },
        data: { deletedAt: new Date() }
    });

    // Invalidar cache de produtos
    invalidateCachePattern('products:');

    logger.info('Produto marcado como deletado (soft delete)', { productId: id });
};
