/**
 * CONFIGURAÇÃO: Segurança da Aplicação
 * 
 * Centraliza todas as configurações de segurança da aplicação,
 * incluindo Helmet, CORS e Rate Limiting.
 * 
 * Segurança Implementada:
 * - Helmet: Headers de segurança HTTP
 * - CORS: Controle de origens permitidas
 * - Rate Limiting: Proteção contra ataques de força bruta
 */

import { config } from './env.js';

/**
 * Configuração do Helmet
 * Define headers de segurança HTTP para proteger contra vulnerabilidades comuns
 */
export const helmetConfig = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    hsts: {
        maxAge: 31536000, // 1 ano
        includeSubDomains: true,
        preload: true,
    },
    frameguard: {
        action: 'deny',
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
    },
};

/**
 * Configuração do CORS
 * Define quais origens podem acessar a API
 */
export const corsConfig = {
    origin: (origin, callback) => {
        // Permitir requisições sem origin (mobile apps, Postman) em desenvolvimento
        if (!origin && config.isDevelopment) {
            return callback(null, true);
        }

        // Lista de origens permitidas
        const allowedOrigins = [config.cors.origin];

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Origem não permitida pelo CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400, // 24 horas
};

/**
 * Configuração de Rate Limiting Global
 * Limita o número de requisições por IP para prevenir ataques
 */
export const globalRateLimitConfig = {
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
        success: false,
        message: 'Muitas requisições. Tente novamente mais tarde.',
    },
    standardHeaders: true,
    legacyHeaders: false,
};

/**
 * Configuração de Rate Limiting para Login
 * Mais restritivo para prevenir ataques de força bruta
 */
export const loginRateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 tentativas
    message: {
        success: false,
        message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    },
    skipSuccessfulRequests: true,
};

/**
 * Configuração de Rate Limiting para Registro
 * Previne criação em massa de contas
 */
export const registerRateLimitConfig = {
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // 3 tentativas
    message: {
        success: false,
        message: 'Muitas tentativas de registro. Tente novamente em 1 hora.',
    },
};
