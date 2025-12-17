/**
 * MÓDULO: Manutenção
 * SERVICE
 */

import prisma from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';
import logger from '../../utils/logger.js';

export const getAll = async () => {
    return await prisma.maintenance.findMany({
        orderBy: { date: 'desc' },
    });
};

export const getById = async (id) => {
    const record = await prisma.maintenance.findUnique({
        where: { id: parseInt(id) },
    });
    if (!record) throw new AppError('Manutenção não encontrada', 404);
    return record;
};

export const create = async (data) => {
    const record = await prisma.maintenance.create({ data });
    logger.info('Manutenção criada', { id: record.id, machine: record.machine });
    return record;
};

export const update = async (id, data) => {
    await getById(id);
    const record = await prisma.maintenance.update({
        where: { id: parseInt(id) },
        data,
    });
    logger.info('Manutenção atualizada', { id: record.id });
    return record;
};

export const remove = async (id) => {
    await getById(id);
    await prisma.maintenance.delete({ where: { id: parseInt(id) } });
    logger.info('Manutenção deletada', { id });
};
