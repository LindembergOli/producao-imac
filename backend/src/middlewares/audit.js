/**
 * MIDDLEWARE: Auditoria de Ações
 * 
 * Registra ações sensíveis dos usuários no sistema para rastreabilidade e compliance.
 * 
 * Ações Auditadas:
 * - LOGIN, LOGOUT
 * - CREATE_USER, UPDATE_USER, DELETE_USER
 * - CREATE_RECORD, UPDATE_RECORD, DELETE_RECORD
 * - CHANGE_PERMISSIONS
 * 
 * Informações Capturadas:
 * - Usuário que executou a ação
 * - Tipo de ação
 * - Entidade afetada
 * - Detalhes adicionais (JSON)
 * - IP e User-Agent
 * - Timestamp
 */

import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Registra uma ação de auditoria no banco de dados
 * 
 * @param {Object} params - Parâmetros da auditoria
 * @param {number} [params.userId] - ID do usuário (null para ações anônimas)
 * @param {string} params.action - Tipo de ação (LOGIN, CREATE_USER, etc)
 * @param {string} [params.entity] - Nome da entidade afetada
 * @param {number} [params.entityId] - ID da entidade afetada
 * @param {Object} [params.details] - Detalhes adicionais em JSON
 * @param {string} [params.ipAddress] - Endereço IP
 * @param {string} [params.userAgent] - User-Agent do navegador
 * 
 * @returns {Promise<void>}
 * 
 * @example
 * await logAudit({
 *   userId: req.user.id,
 *   action: 'DELETE_RECORD',
 *   entity: 'Product',
 *   entityId: 123,
 *   details: { name: 'Bolo de Chocolate' },
 *   ipAddress: req.ip,
 *   userAgent: req.get('user-agent')
 * });
 */
export const logAudit = async ({
    userId = null,
    action,
    entity = null,
    entityId = null,
    details = null,
    ipAddress = null,
    userAgent = null,
}) => {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                entity,
                entityId,
                details: details ? JSON.parse(JSON.stringify(details)) : null,
                ipAddress,
                userAgent,
            },
        });

        logger.info('Ação auditada', {
            userId,
            action,
            entity,
            entityId,
        });
    } catch (error) {
        // Não falhar a requisição se auditoria falhar
        logger.error('Erro ao registrar auditoria', {
            error: error.message,
            stack: error.stack,
            userId,
            action,
        });
    }
};

/**
 * Middleware para auditar automaticamente ações de criação
 * 
 * Use após a criação bem-sucedida de um recurso.
 * 
 * @param {string} entity - Nome da entidade criada
 * @returns {Function} Middleware Express
 * 
 * @example
 * router.post('/products', authenticate, validate(schema), 
 *   controller.create, 
 *   auditCreate('Product')
 * );
 */
export const auditCreate = (entity) => {
    return async (req, res, next) => {
        // Só auditar se a resposta foi bem-sucedida
        if (res.statusCode >= 200 && res.statusCode < 300) {
            const entityId = res.locals.createdId || req.body.id;

            await logAudit({
                userId: req.user?.id,
                action: 'CREATE_RECORD',
                entity,
                entityId,
                details: { ...req.body },
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
            });
        }
        next();
    };
};

/**
 * Middleware para auditar automaticamente ações de atualização
 * 
 * @param {string} entity - Nome da entidade atualizada
 * @returns {Function} Middleware Express
 */
export const auditUpdate = (entity) => {
    return async (req, res, next) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            const entityId = req.params.id;

            await logAudit({
                userId: req.user?.id,
                action: 'UPDATE_RECORD',
                entity,
                entityId: parseInt(entityId),
                details: { ...req.body },
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
            });
        }
        next();
    };
};

/**
 * Middleware para auditar automaticamente ações de exclusão
 * 
 * @param {string} entity - Nome da entidade excluída
 * @returns {Function} Middleware Express
 */
export const auditDelete = (entity) => {
    return async (req, res, next) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            const entityId = req.params.id;

            await logAudit({
                userId: req.user?.id,
                action: 'DELETE_RECORD',
                entity,
                entityId: parseInt(entityId),
                details: res.locals.deletedData || {},
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
            });
        }
        next();
    };
};

/**
 * Middleware para auditar login
 * 
 * Deve ser chamado após login bem-sucedido
 */
export const auditLogin = async (req, res, next) => {
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        await logAudit({
            userId: req.user.id,
            action: 'LOGIN',
            details: { email: req.user.email },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });
    }
    next();
};

/**
 * Middleware para auditar logout
 */
export const auditLogout = async (req, res, next) => {
    if (req.user) {
        await logAudit({
            userId: req.user.id,
            action: 'LOGOUT',
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });
    }
    next();
};

/**
 * Middleware para auditar criação de usuário
 */
export const auditCreateUser = async (req, res, next) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
        await logAudit({
            userId: req.user?.id,
            action: 'CREATE_USER',
            entity: 'User',
            entityId: res.locals.createdUserId,
            details: {
                email: req.body.email,
                name: req.body.name,
                role: req.body.role,
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });
    }
    next();
};

/**
 * Middleware para auditar alteração de permissões
 */
export const auditChangePermissions = async (req, res, next) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
        await logAudit({
            userId: req.user?.id,
            action: 'CHANGE_PERMISSIONS',
            entity: 'User',
            entityId: parseInt(req.params.id),
            details: {
                oldRole: res.locals.oldRole,
                newRole: req.body.role,
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });
    }
    next();
};
