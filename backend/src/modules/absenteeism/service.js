/**
 * MÓDULO: Absenteísmo
 * SERVICE
 */

import prisma from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';
import logger from '../../utils/logger.js';
import { paginate, createPaginatedResponse } from '../../utils/pagination.js';

export const getAll = async (page = 1, limit = 20) => {
    const { skip, take } = paginate(page, limit);

    const [data, total] = await Promise.all([
        prisma.absenteeism.findMany({
            where: { deletedAt: null },
            skip,
            take,
            orderBy: { date: 'desc' },
        }),
        prisma.absenteeism.count({ where: { deletedAt: null } })
    ]);

    return createPaginatedResponse(data, page, limit, total);
};

export const getById = async (id) => {
    const record = await prisma.absenteeism.findUnique({
        where: { id: parseInt(id) },
    });
    if (!record || record.deletedAt) throw new AppError('Registro de absenteísmo não encontrado', 404);
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
