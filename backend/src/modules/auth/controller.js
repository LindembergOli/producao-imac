/**
 * MÓDULO: Autenticação
 * CONTROLLER - Camada de Controle
 * 
 * Recebe as requisições HTTP, valida os dados (via middleware),
 * chama o service apropriado e retorna a resposta padronizada.
 * 
 * Endpoints:
 * - POST /api/auth/register - Registrar novo usuário
 * - POST /api/auth/login - Fazer login
 * - POST /api/auth/refresh - Renovar access token
 * - POST /api/auth/logout - Fazer logout
 * - POST /api/auth/logout-all - Logout de todos os dispositivos
 * - GET  /api/auth/me - Obter dados do usuário autenticado
 */

import * as authService from './service.js';
import { success, error as errorResponse } from '../../utils/responses.js';
import { logAudit } from '../../middlewares/audit.js';

/**
 * POST /api/auth/register
 * Registra um novo usuário no sistema
 * 
 * Body: { email, password, name, role? }
 * Response: { success, data: user, message }
 */
export const register = async (req, res, next) => {
    try {
        const user = await authService.register(req.body);

        // Auditar criação de usuário (sem senha)
        await logAudit({
            userId: user.id,
            action: 'CREATE_USER',
            entity: 'User',
            entityId: user.id,
            details: {
                name: req.body.name,
                email: req.body.email,
                role: req.body.role || 'LIDER_PRODUCAO',
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        return success(res, {
            data: user,
            message: 'Usuário registrado com sucesso',
            statusCode: 201,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/auth/login
 * Realiza login do usuário
 * 
 * Body: { email, password }
 * Response: { success, data: { user, accessToken, refreshToken }, message }
 */
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);

        // Auditar login
        await logAudit({
            userId: result.user.id,
            action: 'LOGIN',
            entity: 'User',
            entityId: result.user.id,
            details: { email },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        return success(res, {
            data: result,
            message: 'Login realizado com sucesso',
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/auth/refresh
 * Renova o access token usando refresh token
 * 
 * Body: { refreshToken }
 * Response: { success, data: { accessToken, refreshToken }, message }
 */
export const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const result = await authService.refresh(refreshToken);

        return success(res, {
            data: result,
            message: 'Token renovado com sucesso',
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/auth/logout
 * Realiza logout invalidando o refresh token
 * 
 * Body: { refreshToken? }
 * Response: { success, message }
 */
export const logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        await authService.logout(refreshToken);

        // Auditar logout (se usuário estiver autenticado)
        if (req.user) {
            await logAudit({
                userId: req.user.id,
                action: 'LOGOUT',
                entity: 'User',
                entityId: req.user.id,
                details: {},
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
            });
        }

        return success(res, {
            data: null,
            message: 'Logout realizado com sucesso',
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/auth/logout-all
 * Realiza logout de todos os dispositivos do usuário
 * Requer autenticação (middleware auth)
 * 
 * Response: { success, message }
 */
export const logoutAll = async (req, res, next) => {
    try {
        await authService.logoutAll(req.user.id);

        // Auditar logout de todos os dispositivos
        await logAudit({
            userId: req.user.id,
            action: 'LOGOUT',
            entity: 'User',
            entityId: req.user.id,
            details: { logoutAll: true },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        return success(res, {
            data: null,
            message: 'Logout realizado em todos os dispositivos',
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/auth/me
 * Retorna dados do usuário autenticado
 * Requer autenticação (middleware auth)
 * 
 * Response: { success, data: user }
 */
export const getMe = async (req, res, next) => {
    try {
        const user = await authService.getUserById(req.user.id);

        return success(res, {
            data: user,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/auth/forgot-password
 * Solicita recuperação de senha
 * 
 * Body: { email }
 * Response: { success, message }
 */
export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        await authService.forgotPassword(email);

        return success(res, {
            data: null,
            message: 'Se o email existir, um link de recuperação será enviado.',
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/auth/reset-password
 * Redefine a senha usando token
 * 
 * Body: { token, password }
 * Response: { success, message }
 */
export const resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;
        await authService.resetPassword(token, password);

        return success(res, {
            data: null,
            message: 'Senha redefinida com sucesso.',
        });
    } catch (err) {
        next(err);
    }
};
