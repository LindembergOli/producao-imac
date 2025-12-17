/**
 * MÓDULO: Velocidade de Produção
 * SERVICE
 */

import prisma from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';
import logger from '../../utils/logger.js';

export const getAll = async () => {
    return await prisma.productionSpeed.findMany({
        orderBy: { createdAt: 'desc' },
    });
};

export const getById = async (id) => {
    const record = await prisma.productionSpeed.findUnique({
        where: { id: parseInt(id) },
    });
    if (!record) throw new AppError('Registro não encontrado', 404);
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
    await prisma.productionSpeed.delete({ where: { id: parseInt(id) } });
    logger.info('Velocidade de produção deletada', { id });
};
