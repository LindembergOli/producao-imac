/**
 * MÓDULO: Autenticação
 * ROUTES - Definição de Rotas
 * 
 * Define todas as rotas do módulo de autenticação e aplica
 * os middlewares apropriados (validação, rate limiting, autenticação).
 * 
 * Rotas Públicas (sem autenticação):
 * - POST /register - Registrar novo usuário
 * - POST /login - Fazer login
 * - POST /refresh - Renovar access token
 * - POST /logout - Fazer logout
 * 
 * Rotas Protegidas (requerem autenticação):
 * - POST /logout-all - Logout de todos os dispositivos
 * - GET  /me - Obter dados do usuário autenticado
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as controller from './controller.js';
import * as validator from './validator.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/auth.js';
import { loginRateLimitConfig, registerRateLimitConfig } from '../../config/security.js';
import logger from '../../utils/logger.js';
import { auditLogin, auditLogout } from '../../middlewares/audit.js';

const router = Router();

/**
 * Rate Limiter para Login
 * Máximo 5 tentativas a cada 15 minutos
 */
const loginLimiter = rateLimit({
    ...loginRateLimitConfig,
    handler: (req, res) => {
        logger.warn('Rate limit de login excedido', {
            ip: req.ip,
            email: req.body?.email,
        });
        res.status(429).json({
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
            },
        });
    },
});

/**
 * Rate Limiter para Registro
 * Máximo 3 tentativas a cada 1 hora
 */
const registerLimiter = rateLimit({
    ...registerRateLimitConfig,
    handler: (req, res) => {
        logger.warn('Rate limit de registro excedido', {
            ip: req.ip,
            email: req.body?.email,
        });
        res.status(429).json({
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Muitas tentativas de registro. Tente novamente em 1 hora.',
            },
        });
    },
});

// ========================================
// ROTAS PÚBLICAS
// ========================================

/**
 * POST /api/auth/register
 * Registra um novo usuário
 * 
 * Rate Limit: 3 tentativas por hora
 * Validação: registerSchema
 */
router.post(
    '/register',
    registerLimiter,
    validate(validator.registerSchema),
    controller.register
);

/**
 * POST /api/auth/login
 * Realiza login do usuário
 * 
 * Rate Limit: 5 tentativas a cada 15 minutos
 * Validação: loginSchema
 */
router.post(
    '/login',
    loginLimiter,
    validate(validator.loginSchema),
    controller.login,
    auditLogin
);

/**
 * POST /api/auth/refresh
 * Renova o access token
 * 
 * Validação: refreshSchema
 */
router.post(
    '/refresh',
    validate(validator.refreshSchema),
    controller.refresh
);

/**
 * POST /api/auth/logout
 * Realiza logout invalidando o refresh token
 * 
 * Validação: logoutSchema
 */
router.post(
    '/logout',
    validate(validator.logoutSchema),
    controller.logout,
    auditLogout
);

/**
 * POST /api/auth/forgot-password
 * Solicitação de recuperação de senha
 * 
 * Validação: forgotPasswordSchema
 */
router.post(
    '/forgot-password',
    validate(validator.forgotPasswordSchema),
    controller.forgotPassword
);

/**
 * POST /api/auth/reset-password
 * Redefinição de senha
 * 
 * Validação: resetPasswordSchema
 */
router.post(
    '/reset-password',
    validate(validator.resetPasswordSchema),
    controller.resetPassword
);

// ========================================
// ROTAS PROTEGIDAS (Requerem Autenticação)
// ========================================

/**
 * POST /api/auth/logout-all
 * Realiza logout de todos os dispositivos
 * 
 * Requer: Autenticação (JWT)
 */
router.post(
    '/logout-all',
    authenticate,
    controller.logoutAll,
    auditLogout
);

/**
 * GET /api/auth/me
 * Retorna dados do usuário autenticado
 * 
 * Requer: Autenticação (JWT)
 */
router.get(
    '/me',
    authenticate,
    controller.getMe
);

export default router;
