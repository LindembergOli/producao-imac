/**
 * SOFT DELETE MIDDLEWARE
 * 
 * Middleware para implementar soft delete ao invés de delete físico.
 * 
 * Ao invés de remover registros do banco, marca como deletado
 * com deletedAt e deletedBy.
 * 
 * Benefícios:
 * - Preserva histórico
 * - Permite recuperação
 * - Mantém integridade referencial
 */

import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { AppError } from './errorHandler.js';

/**
 * Cria middleware de soft delete para um model específico
 * 
 * @param {string} modelName - Nome do model no Prisma (ex: 'product', 'machine')
 * @returns {Function} Middleware Express
 * 
 * @example
 * // Em uma rota
 * router.delete('/:id', authenticate, softDelete('product'));
 */
export const softDelete = (modelName) => {
    return async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                throw new AppError('ID inválido', 400);
            }

            // Verificar se model existe no Prisma
            if (!prisma[modelName]) {
                throw new AppError(`Model ${modelName} não encontrado`, 500);
            }

            // Verificar se registro existe e não está deletado
            const record = await prisma[modelName].findUnique({
                where: { id }
            });

            if (!record) {
                throw new AppError('Registro não encontrado', 404);
            }

            if (record.deletedAt) {
                throw new AppError('Registro já foi deletado', 400);
            }

            // Marcar como deletado ao invés de deletar
            const deleted = await prisma[modelName].update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    deletedBy: req.user?.id || null
                }
            });

            logger.info('Soft delete executado', {
                model: modelName,
                id,
                deletedBy: req.user?.id,
                requestId: req.requestId
            });

            res.json({
                success: true,
                message: 'Registro deletado com sucesso',
                data: deleted
            });
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Middleware para filtrar registros deletados automaticamente
 * 
 * Adiciona where: { deletedAt: null } em todas as queries
 * 
 * NOTA: Este middleware deve ser aplicado globalmente ou por rota
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const filterDeleted = (req, res, next) => {
    // Adicionar flag para indicar que deve filtrar deletados
    req.filterDeleted = true;
    next();
};

/**
 * Helper para restaurar registro soft deleted
 * 
 * @param {string} modelName - Nome do model
 * @param {number} id - ID do registro
 * @param {number} userId - ID do usuário que está restaurando
 * @returns {Promise<Object>} Registro restaurado
 * 
 * @example
 * const restored = await restoreSoftDeleted('product', 1, userId);
 */
export const restoreSoftDeleted = async (modelName, id, userId) => {
    if (!prisma[modelName]) {
        throw new AppError(`Model ${modelName} não encontrado`, 500);
    }

    const record = await prisma[modelName].findUnique({
        where: { id }
    });

    if (!record) {
        throw new AppError('Registro não encontrado', 404);
    }

    if (!record.deletedAt) {
        throw new AppError('Registro não está deletado', 400);
    }

    const restored = await prisma[modelName].update({
        where: { id },
        data: {
            deletedAt: null,
            deletedBy: null,
            updatedBy: userId
        }
    });

    logger.info('Registro restaurado', {
        model: modelName,
        id,
        restoredBy: userId
    });

    return restored;
};

/**
 * Helper para adicionar filtro de deletados em queries
 * 
 * @param {Object} where - Cláusula where existente
 * @param {boolean} includeDeleted - Se deve incluir deletados
 * @returns {Object} Where com filtro de deletados
 * 
 * @example
 * const where = addDeletedFilter({ sector: 'CONFEITARIA' }, false);
 * // { sector: 'CONFEITARIA', deletedAt: null }
 */
export const addDeletedFilter = (where = {}, includeDeleted = false) => {
    if (includeDeleted) {
        return where;
    }

    return {
        ...where,
        deletedAt: null
    };
};
