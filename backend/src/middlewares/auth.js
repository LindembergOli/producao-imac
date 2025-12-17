/**
 * Middleware de Autenticação JWT
 * 
 * Responsável por validar tokens JWT e extrair informações do usuário.
 * Deve ser aplicado em todas as rotas protegidas.
 */

import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { AppError } from './errorHandler.js';

/**
 * Middleware para autenticar requisições usando JWT
 * 
 * Extrai o token do header Authorization, valida e adiciona
 * os dados do usuário ao objeto req para uso nos próximos middlewares.
 * 
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} req.headers - Headers da requisição
 * @param {string} req.headers.authorization - Header no formato "Bearer {token}"
 * @param {Object} res - Objeto de resposta Express
 * @param {Function} next - Função para passar para o próximo middleware
 * 
 * @throws {AppError} 401 - Token não fornecido ou inválido
 * @throws {AppError} 401 - Token expirado
 * 
 * @example
 * // Proteger uma rota
 * router.get('/perfil', authenticate, getUserProfile);
 * 
 * @example
 * // Usar dados do usuário autenticado
 * router.post('/pedido', authenticate, (req, res) => {
 *   const userId = req.user.id;
 *   const userRole = req.user.role;
 *   // ... lógica do pedido
 * });
 */
export const authenticate = async (req, res, next) => {
    try {
        // Extrair token do header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('Token não fornecido', 401);
        }

        const token = authHeader.split(' ')[1];

        // Verificar token
        const decoded = jwt.verify(token, config.jwt.secret);

        // Adicionar usuário à requisição
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            next(new AppError('Token inválido', 401));
        } else if (error.name === 'TokenExpiredError') {
            next(new AppError('Token expirado', 401));
        } else {
            next(error);
        }
    }
};

/**
 * Middleware para verificar se o usuário é administrador
 * 
 * Deve ser usado após o middleware authenticate.
 * Bloqueia acesso se o usuário não tiver role 'admin'.
 * 
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} req.user - Dados do usuário (adicionados pelo authenticate)
 * @param {string} req.user.role - Role do usuário
 * @param {Object} res - Objeto de resposta Express
 * @param {Function} next - Função para passar para o próximo middleware
 * 
 * @throws {AppError} 403 - Usuário não é administrador
 * 
 * @example
 * // Rota exclusiva para admins
 * router.delete('/usuarios/:id', authenticate, requireAdmin, deleteUser);
 * 
 * @example
 * // Múltiplos middlewares de autorização
 * router.post('/config', authenticate, requireAdmin, updateConfig);
 */
export const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        throw new AppError('Acesso negado. Apenas administradores.', 403);
    }
    next();
};

/**
 * Middleware para verificar se o usuário possui uma das roles permitidas
 * 
 * Factory function que retorna um middleware configurado com as roles permitidas.
 * Mais flexível que requireAdmin, permite especificar múltiplas roles.
 * 
 * @param {string[]} allowedRoles - Array com as roles autorizadas a acessar o endpoint
 * @returns {Function} Middleware Express que valida a role do usuário
 * 
 * @throws {AppError} 401 - Usuário não autenticado
 * @throws {AppError} 403 - Role do usuário não está na lista de permitidas
 * 
 * @example
 * // Permitir apenas admins e supervisores
 * router.get('/relatorios', 
 *   authenticate, 
 *   requireRole(['ADMIN', 'SUPERVISOR']), 
 *   getRelatorios
 * );
 * 
 * @example
 * // Permitir apenas líderes de produção
 * router.post('/producao', 
 *   authenticate, 
 *   requireRole(['LIDER_PRODUCAO']), 
 *   createProducao
 * );
 * 
 * @example
 * // Múltiplas roles com acesso
 * router.put('/manutencao/:id', 
 *   authenticate, 
 *   requireRole(['ADMIN', 'SUPERVISOR', 'LIDER_PRODUCAO']), 
 *   updateManutencao
 * );
 */
export const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new AppError('Usuário não autenticado', 401);
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw new AppError(
                `Acesso negado. Roles permitidas: ${allowedRoles.join(', ')}`,
                403
            );
        }

        next();
    };
};
