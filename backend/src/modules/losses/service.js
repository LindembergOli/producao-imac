/**
 * MÓDULO: Perdas de Produção
 * SERVICE
 */

import prisma from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';
import logger from '../../utils/logger.js';
import { paginate, createPaginatedResponse } from '../../utils/pagination.js';

export const getAll = async (page = 1, limit = 20) => {
    const { skip, take } = paginate(page, limit);

    const [data, total] = await Promise.all([
        prisma.loss.findMany({
            where: { deletedAt: null },
            skip,
            take,
            orderBy: { date: 'desc' },
        }),
        prisma.loss.count({ where: { deletedAt: null } })
    ]);

    return createPaginatedResponse(data, page, limit, total);
};

export const getById = async (id) => {
    const record = await prisma.loss.findUnique({
        where: { id: parseInt(id) },
    });
    if (!record || record.deletedAt) throw new AppError('Perda não encontrada', 404);
    return record;
};

export const create = async (data) => {
    const record = await prisma.loss.create({ data });
    logger.info('Perda criada', { id: record.id, product: record.product });
    return record;
};

export const update = async (id, data) => {
    await getById(id);
    const record = await prisma.loss.update({
        where: { id: parseInt(id) },
        data,
    });
    logger.info('Perda atualizada', { id: record.id });
    return record;
};

export const remove = async (id) => {
    await getById(id);
    await prisma.loss.update({
        where: { id: parseInt(id) },
        data: { deletedAt: new Date() },
    });
    logger.info('Perda deletada', { id });
};
