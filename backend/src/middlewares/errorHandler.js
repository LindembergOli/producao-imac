/**
 * Middleware de Tratamento Global de Erros
 */

import { config } from '../config/env.js';
import logger from '../utils/logger.js';

export class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Middleware centralizado para tratamento de erros.
 * Captura AppError, erros do Prisma, Zod e JWT.
 * 
 * @param {Error} err - Objeto de erro capturado.
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} res - Objeto de resposta Express.
 * @param {Function} next - Função next (obrigatória para assinatura de erro).
 */
export const errorHandler = (err, req, res, next) => {
    let { statusCode = 500, message } = err;

    // Log do erro
    logger.error('Erro na aplicação', {
        message: err.message,
        stack: config.isDevelopment ? err.stack : undefined,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
    });

    // Erros do Prisma
    if (err.code === 'P2002') {
        statusCode = 409;
        message = 'Registro duplicado. Este valor já existe.';
    } else if (err.code === 'P2025') {
        statusCode = 404;
        message = 'Registro não encontrado.';
    } else if (err.code?.startsWith('P')) {
        statusCode = 400;
        message = 'Erro no banco de dados.';
    }

    // Erros de validação Zod
    if (err.name === 'ZodError') {
        statusCode = 400;
        message = 'Dados inválidos';
        const errors = err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
        }));

        return res.status(statusCode).json({
            success: false,
            message,
            errors,
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Token inválido';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expirado';
    }

    // Resposta
    res.status(statusCode).json({
        success: false,
        message,
        ...(config.isDevelopment && { stack: err.stack }),
    });
};

/**
 * Middleware para capturar rotas inexistentes (404).
 * 
 * @param {Object} req - Objeto de requisição.
 * @param {Object} res - Objeto de resposta.
 * @param {Function} next - Função next.
 */
export const notFound = (req, res, next) => {
    const error = new AppError(`Rota não encontrada: ${req.originalUrl}`, 404);
    next(error);
};
