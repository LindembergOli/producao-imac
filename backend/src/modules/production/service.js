/**
 * MÓDULO: Velocidade de Produção
 * SERVICE
 */

import prisma from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';
import logger from '../../utils/logger.js';
import { paginate, createPaginatedResponse } from '../../utils/pagination.js';

export const getAll = async (page = 1, limit = 20) => {
    const { skip, take } = paginate(page, limit);

    const [data, total] = await Promise.all([
        prisma.productionSpeed.findMany({
            where: { deletedAt: null },
            skip,
            take,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.productionSpeed.count({ where: { deletedAt: null } })
    ]);

    return createPaginatedResponse(data, page, limit, total);
};

export const getById = async (id) => {
    const record = await prisma.productionSpeed.findUnique({
        where: { id: parseInt(id) },
    });
    if (!record || record.deletedAt) throw new AppError('Registro não encontrado', 404);
    return record;
};

export const create = async (data) => {
    const record = await prisma.productionSpeed.create({ data });
    logger.info('Velocidade de produção criada', { id: record.id });
    return record;
};

export const update = async (id, data) => {
    await getById(id);
    const record = await prisma.productionSpeed.update({
        where: { id: parseInt(id) },
        data,
    });
    logger.info('Velocidade de produção atualizada', { id: record.id });
    return record;
};

export const remove = async (id) => {
    await getById(id);
    await prisma.productionSpeed.update({
        where: { id: parseInt(id) },
        data: { deletedAt: new Date() },
    });
    logger.info('Velocidade de produção deletada', { id });
};
