/**
 * MÓDULO: Perdas de Produção
 * SERVICE
 */

import prisma from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';
import logger from '../../utils/logger.js';

export const getAll = async () => {
    return await prisma.loss.findMany({
        orderBy: { date: 'desc' },
    });
};

export const getById = async (id) => {
    const record = await prisma.loss.findUnique({
        where: { id: parseInt(id) },
    });
    if (!record) throw new AppError('Perda não encontrada', 404);
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
    await prisma.loss.delete({ where: { id: parseInt(id) } });
    logger.info('Perda deletada', { id });
};
