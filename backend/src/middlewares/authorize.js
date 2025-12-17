/**
 * Middleware de Autorização
 * Controla acesso baseado em roles de usuário
 */

import { AppError } from './errorHandler.js';
import logger from '../utils/logger.js';

/**
 * Verifica se usuário tem uma das roles permitidas
 * @param {string[]} allowedRoles - Array de roles permitidas
 * @returns {Function} Middleware Express
 */
export const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.user?.role;

        if (!userRole) {
            logger.warn('Tentativa de acesso sem role definida', {
                userId: req.user?.id,
                path: req.path,
            });
            throw new AppError('Acesso negado: role não definida', 403);
        }

        if (!allowedRoles.includes(userRole)) {
            logger.warn('Acesso negado por role insuficiente', {
                userId: req.user.id,
                userRole,
                requiredRoles: allowedRoles,
                path: req.path,
            });
            throw new AppError('Acesso negado: permissões insuficientes', 403);
        }

        next();
    };
};

/**
 * Verifica se usuário pode acessar seção de Cadastro
 * Apenas ADMIN e SUPERVISOR
 */
export const canAccessCadastro = requireRole(['ADMIN', 'SUPERVISOR']);

/**
 * Verifica se usuário pode criar registros
 * ADMIN, SUPERVISOR e LIDER_PRODUCAO podem criar
 */
export const canCreate = requireRole(['ADMIN', 'SUPERVISOR', 'LIDER_PRODUCAO']);

/**
 * Verifica se usuário pode editar registros
 * ADMIN, SUPERVISOR e LIDER_PRODUCAO podem editar
 */
export const canEdit = requireRole(['ADMIN', 'SUPERVISOR', 'LIDER_PRODUCAO']);

/**
 * Verifica se usuário pode deletar registros
 * ADMIN, SUPERVISOR e LIDER_PRODUCAO podem deletar
 */
export const canDelete = requireRole(['ADMIN', 'SUPERVISOR', 'LIDER_PRODUCAO']);

/**
 * Verifica se usuário é ADMIN
 * Apenas ADMIN pode gerenciar usuários
 */
export const isAdmin = requireRole(['ADMIN']);

/**
 * Middleware para verificar permissões de leitura
 * Todos os usuários autenticados podem ler (visualizar)
 */
export const canRead = (req, res, next) => {
    if (!req.user) {
        throw new AppError('Autenticação necessária', 401);
    }
    next();
};
