/**
 * MÓDULO: Absenteísmo
 * SERVICE
 */

import prisma from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';
import logger from '../../utils/logger.js';

export const getAll = async () => {
    return await prisma.absenteeism.findMany({
        orderBy: { date: 'desc' },
    });
};

export const getById = async (id) => {
    const record = await prisma.absenteeism.findUnique({
        where: { id: parseInt(id) },
    });
    if (!record) throw new AppError('Registro de absenteísmo não encontrado', 404);
    return record;
};

export const create = async (data) => {
    const record = await prisma.absenteeism.create({ data });
    logger.info('Absenteísmo criado', { id: record.id, employee: record.employeeName });
    return record;
};

export const update = async (id, data) => {
    await getById(id);
    const record = await prisma.absenteeism.update({
        where: { id: parseInt(id) },
        data,
    });
    logger.info('Absenteísmo atualizado', { id: record.id });
    return record;
};

export const remove = async (id) => {
    await getById(id);
    await prisma.absenteeism.delete({ where: { id: parseInt(id) } });
    logger.info('Absenteísmo deletado', { id });
};
