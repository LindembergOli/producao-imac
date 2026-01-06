/**
 * MÓDULO: Observações de Produção
 * SERVICE
 * 
 * Responsável pela lógica de negócio das observações de produção.
 * Implementa CRUD completo com soft delete e validação de produtos.
 */

import prisma from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';
import logger from '../../utils/logger.js';
import { paginate, createPaginatedResponse } from '../../utils/pagination.js';

/**
 * Buscar todas as observações (com paginação)
 * @param {number} page - Número da página
 * @param {number} limit - Itens por página
 * @returns {Promise<Object>} Dados paginados
 */
export const getAll = async (page = 1, limit = 20) => {
    const { skip, take } = paginate(page, limit);

    const [data, total] = await Promise.all([
        prisma.productionObservation.findMany({
            where: { deletedAt: null },
            skip,
            take,
            orderBy: [
                { date: 'desc' },          // 1º: Data mais recente primeiro
                { sector: 'asc' },         // 2º: Setor em ordem alfabética
                { product: 'asc' }         // 3º: Produto em ordem alfabética
            ],
        }),
        prisma.productionObservation.count({ where: { deletedAt: null } })
    ]);

    return createPaginatedResponse(data, page, limit, total);
};

/**
 * Buscar observação por ID
 * @param {number} id - ID da observação
 * @returns {Promise<Object>} Dados da observação
 * @throws {AppError} 404 se não encontrado ou deletado
 */
export const getById = async (id) => {
    const record = await prisma.productionObservation.findUnique({
        where: { id: parseInt(id) },
    });

    if (!record || record.deletedAt) {
        throw new AppError('Observação não encontrada', 404);
    }

    return record;
};

/**
 * Criar nova observação
 * @param {Object} data - Dados da observação
 * @returns {Promise<Object>} Observação criada
 * @throws {AppError} 404 se produto não encontrado
 */
export const create = async (data) => {
    // Validar se o produto existe no setor especificado
    const product = await prisma.product.findFirst({
        where: {
            name: data.product,
            sector: data.sector,
            deletedAt: null
        }
    });

    if (!product) {
        throw new AppError(
            `Produto "${data.product}" não encontrado no setor ${data.sector}`,
            404
        );
    }

    // Criar observação
    const record = await prisma.productionObservation.create({
        data: {
            ...data,
            date: new Date(data.date + 'T12:00:00Z'),  // Fixar meio-dia UTC para evitar problemas de fuso horário
            observationType: data.observationType?.toUpperCase(),
            description: data.description?.toUpperCase()
        }
    });

    logger.info('Observação de produção criada', {
        id: record.id,
        product: record.product,
        sector: record.sector
    });

    return record;
};

/**
 * Atualizar observação existente
 * @param {number} id - ID da observação
 * @param {Object} data - Dados para atualizar
 * @returns {Promise<Object>} Observação atualizada
 * @throws {AppError} 404 se não encontrado ou produto inválido
 */
export const update = async (id, data) => {
    await getById(id);

    // Se está alterando produto ou setor, validar
    if (data.product || data.sector) {
        const existingRecord = await getById(id);
        const productToCheck = data.product || existingRecord.product;
        const sectorToCheck = data.sector || existingRecord.sector;

        const product = await prisma.product.findFirst({
            where: {
                name: productToCheck,
                sector: sectorToCheck,
                deletedAt: null
            }
        });

        if (!product) {
            throw new AppError(
                `Produto "${productToCheck}" não encontrado no setor ${sectorToCheck}`,
                404
            );
        }
    }

    // Se está alterando data, converter para Date object
    const updateData = { ...data };
    if (updateData.date) {
        updateData.date = new Date(updateData.date + 'T12:00:00Z');
    }
    if (updateData.observationType) {
        updateData.observationType = updateData.observationType.toUpperCase();
    }
    if (updateData.description) {
        updateData.description = updateData.description.toUpperCase();
    }

    // Atualizar registro
    const record = await prisma.productionObservation.update({
        where: { id: parseInt(id) },
        data: updateData,
    });

    logger.info('Observação de produção atualizada', {
        id: record.id,
        product: record.product
    });

    return record;
};

/**
 * Deletar observação (soft delete)
 * @param {number} id - ID da observação
 * @throws {AppError} 404 se não encontrado
 */
export const remove = async (id) => {
    await getById(id);

    await prisma.productionObservation.update({
        where: { id: parseInt(id) },
        data: { deletedAt: new Date() },
    });

    logger.info('Observação de produção deletada (soft delete)', { id });
};
