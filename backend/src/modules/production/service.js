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
            orderBy: [
                { createdAt: 'desc' },     // 1º: Data mais recente primeiro
                { sector: 'asc' },         // 2º: Setor em ordem alfabética
                { produto: 'asc' }         // 3º: Produto em ordem alfabética
            ],
        }),
        prisma.productionSpeed.count({ where: { deletedAt: null } })
    ]);

    // Buscar unidade de cada produto
    const dataWithUnit = await Promise.all(data.map(async (record) => {
        const product = await prisma.product.findFirst({
            where: {
                name: record.produto,
                sector: record.sector,
                deletedAt: null
            },
            select: { unit: true }
        });

        return {
            ...record,
            unit: product?.unit || 'UND' // Fallback para UND se não encontrar
        };
    }));

    return createPaginatedResponse(dataWithUnit, page, limit, total);
};

export const getById = async (id) => {
    const record = await prisma.productionSpeed.findUnique({
        where: { id: parseInt(id) },
    });
    if (!record || record.deletedAt) throw new AppError('Registro não encontrado', 404);
    return record;
};

export const create = async (data) => {
    // Buscar produto para obter rendimento (yield)
    const product = await prisma.product.findFirst({
        where: {
            name: data.produto,
            sector: data.sector,
            deletedAt: null
        }
    });

    if (!product) {
        throw new AppError(`Produto "${data.produto}" não encontrado no setor ${data.sector}`, 404);
    }

    if (!product.yield || product.yield === 0) {
        throw new AppError(`Produto "${data.produto}" não possui rendimento cadastrado`, 400);
    }

    // Calcular totalRealizadoKgUnd = totalRealizado × rendimento
    const totalRealizadoKgUnd = data.totalRealizado * product.yield;

    // Criar registro com o valor calculado
    const record = await prisma.productionSpeed.create({
        data: {
            ...data,
            totalRealizadoKgUnd
        }
    });

    logger.info('Velocidade de produção criada', { id: record.id, totalRealizadoKgUnd });
    return record;
};

export const update = async (id, data) => {
    await getById(id);

    // Buscar produto para obter rendimento (yield)
    const product = await prisma.product.findFirst({
        where: {
            name: data.produto,
            sector: data.sector,
            deletedAt: null
        }
    });

    if (!product) {
        throw new AppError(`Produto "${data.produto}" não encontrado no setor ${data.sector}`, 404);
    }

    if (!product.yield || product.yield === 0) {
        throw new AppError(`Produto "${data.produto}" não possui rendimento cadastrado`, 400);
    }

    // Recalcular totalRealizadoKgUnd = totalRealizado × rendimento
    const totalRealizadoKgUnd = data.totalRealizado * product.yield;

    // Atualizar registro com o valor recalculado
    const record = await prisma.productionSpeed.update({
        where: { id: parseInt(id) },
        data: {
            ...data,
            totalRealizadoKgUnd
        },
    });

    logger.info('Velocidade de produção atualizada', { id: record.id, totalRealizadoKgUnd });
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
