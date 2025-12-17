/**
 * MÓDULO: Erros de Produção
 * SERVICE
 */

import prisma from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';
import logger from '../../utils/logger.js';

export const getAll = async () => {
    return await prisma.error.findMany({
        orderBy: { date: 'desc' },
    });
};

export const getById = async (id) => {
    const record = await prisma.error.findUnique({
        where: { id: parseInt(id) },
    });
    if (!record) throw new AppError('Erro não encontrado', 404);
    return record;
};

export const create = async (data) => {
    const record = await prisma.error.create({ data });
    logger.info('Erro criado', { id: record.id, product: record.product });
    return record;
};

export const update = async (id, data) => {
    await getById(id);
    const record = await prisma.error.update({
        where: { id: parseInt(id) },
        data,
    });
    logger.info('Erro atualizado', { id: record.id });
    return record;
};

export const remove = async (id) => {
    await getById(id);
    await prisma.error.delete({ where: { id: parseInt(id) } });
    logger.info('Erro deletado', { id });
};
