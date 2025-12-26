/**
 * AUDIT FIELDS MIDDLEWARE
 * 
 * Middleware para preencher automaticamente os campos de auditoria
 * createdBy e updatedBy com base no usuário autenticado.
 * 
 * Uso:
 * - Aplicar em rotas que criam/atualizam registros
 * - Requer autenticação (req.user deve existir)
 */

import logger from '../utils/logger.js';

/**
 * Middleware para preencher campos de auditoria automaticamente
 * 
 * Adiciona createdBy/updatedBy ao body da requisição baseado no usuário autenticado
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const auditFieldsMiddleware = (req, res, next) => {
    // Verificar se usuário está autenticado
    if (!req.user || !req.user.id) {
        logger.warn('auditFieldsMiddleware: Usuário não autenticado', {
            path: req.path,
            method: req.method
        });
        return next();
    }

    const userId = req.user.id;

    // POST - Criar novo registro
    if (req.method === 'POST') {
        req.body.createdBy = userId;
        req.body.updatedBy = userId;

        logger.debug('Campos de auditoria adicionados (CREATE)', {
            userId,
            path: req.path,
            createdBy: userId,
            updatedBy: userId
        });
    }

    // PUT/PATCH - Atualizar registro existente
    else if (req.method === 'PUT' || req.method === 'PATCH') {
        req.body.updatedBy = userId;

        logger.debug('Campos de auditoria adicionados (UPDATE)', {
            userId,
            path: req.path,
            updatedBy: userId
        });
    }

    next();
};

/**
 * Helper para adicionar campos de auditoria manualmente em services
 * 
 * Útil quando não é possível usar o middleware (ex: operações em batch)
 * 
 * @param {Object} data - Dados a serem salvos
 * @param {number} userId - ID do usuário
 * @param {boolean} isUpdate - Se é atualização (true) ou criação (false)
 * @returns {Object} Dados com campos de auditoria
 * 
 * @example
 * const dataWithAudit = addAuditFields({ name: 'Product' }, userId, false);
 * // { name: 'Product', createdBy: 1, updatedBy: 1 }
 */
export const addAuditFields = (data, userId, isUpdate = false) => {
    if (!userId) {
        logger.warn('addAuditFields: userId não fornecido');
        return data;
    }

    const auditedData = { ...data };

    if (isUpdate) {
        auditedData.updatedBy = userId;
    } else {
        auditedData.createdBy = userId;
        auditedData.updatedBy = userId;
    }

    return auditedData;
};

/**
 * Helper para adicionar campos de soft delete
 * 
 * @param {number} userId - ID do usuário que está deletando
 * @returns {Object} Dados de soft delete
 * 
 * @example
 * const softDeleteData = addSoftDeleteFields(userId);
 * // { deletedAt: Date, deletedBy: 1 }
 */
export const addSoftDeleteFields = (userId) => {
    return {
        deletedAt: new Date(),
        deletedBy: userId || null
    };
};
