/**
 * MÓDULO: Produtos
 * SERVICE - Lógica de Negócio
 * 
 * Gerencia o cadastro de produtos da empresa.
 * Produtos são utilizados para calcular custos de perdas e erros.
 */

import prisma from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';
import logger from '../../utils/logger.js';

export const getAll = async () => {
    return await prisma.product.findMany({
        orderBy: [
            { sector: 'asc' },
            { name: 'asc' }
        ],
    });
};

export const getById = async (id) => {
    const product = await prisma.product.findUnique({
        where: { id: parseInt(id) },
    });

    if (!product) {
        throw new AppError('Produto não encontrado', 404);
    }

    return product;
};

export const getBySector = async (sector) => {
    return await prisma.product.findMany({
        where: { sector },
        orderBy: { name: 'asc' },
    });
};

export const create = async (data) => {
    const product = await prisma.product.create({ data });
    logger.info('Produto criado', { productId: product.id, name: product.name });
    return product;
};

export const update = async (id, data) => {
    await getById(id);
    const product = await prisma.product.update({
        where: { id: parseInt(id) },
        data,
    });
    logger.info('Produto atualizado', { productId: product.id });
    return product;
};

export const remove = async (id) => {
    await getById(id);
    await prisma.product.delete({
        where: { id: parseInt(id) },
    });
    logger.info('Produto deletado', { productId: id });
};
