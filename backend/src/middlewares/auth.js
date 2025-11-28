/**
 * Middleware de Autenticação JWT
 */

import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { AppError } from './errorHandler.js';

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

// Middleware para verificar role de admin
export const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        throw new AppError('Acesso negado. Apenas administradores.', 403);
    }
    next();
};
