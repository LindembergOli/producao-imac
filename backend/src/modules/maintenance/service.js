/**
 * MÓDULO: Manutenção
 * SERVICE
 */

import prisma from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';
import logger from '../../utils/logger.js';
import { paginate, createPaginatedResponse } from '../../utils/pagination.js';

export const getAll = async (page = 1, limit = 20) => {
    const { skip, take } = paginate(page, limit);

    const [data, total] = await Promise.all([
        prisma.maintenance.findMany({
            where: { deletedAt: null },
            skip,
            take,
            orderBy: [
                { date: 'desc' },      // 1º: Data mais recente primeiro
                { sector: 'asc' },     // 2º: Setor em ordem alfabética
                { machine: 'asc' }     // 3º: Máquina em ordem alfabética
            ],
        }),
        prisma.maintenance.count({ where: { deletedAt: null } })
    ]);

    return createPaginatedResponse(data, page, limit, total);
};

export const getById = async (id) => {
    const record = await prisma.maintenance.findUnique({
        where: { id: parseInt(id) },
    });
    if (!record || record.deletedAt) throw new AppError('Manutenção não encontrada', 404);
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
