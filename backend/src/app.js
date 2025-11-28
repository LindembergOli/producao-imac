/**
 * Configuração Express App
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import logger, { httpLogger } from './utils/logger.js';
import routes from './routes/index.js';

const app = express();

// ========================================
// LOGGING
// ========================================

// Log de requisições HTTP
app.use(httpLogger);

// ========================================
// MIDDLEWARES DE SEGURANÇA
// ========================================

// Helmet - Security headers com CSP detalhado
app.use(
    helmet({
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
            maxAge: 31536000,
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
    })
);

// CORS - Restrito ao frontend
app.use(
    cors({
        origin: (origin, callback) => {
            // Permitir requisições sem origin (mobile apps, Postman, etc) em dev
            if (!origin && config.isDevelopment) {
                return callback(null, true);
            }

            // Lista de origens permitidas
            const allowedOrigins = [config.cors.origin];

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                logger.warn(`CORS bloqueado para origem: ${origin}`);
                callback(new Error('Origem não permitida pelo CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['X-Total-Count'],
        maxAge: 86400, // 24 horas
    })
);

// Rate Limiting Global
const globalLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
        success: false,
        message: 'Muitas requisições. Tente novamente mais tarde.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Rate limit excedido', {
            ip: req.ip,
            url: req.originalUrl,
        });
        res.status(429).json({
            success: false,
            message: 'Muitas requisições. Tente novamente mais tarde.',
        });
    },
});
app.use('/api/', globalLimiter);

// Rate Limiting para Login (mais restritivo)
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 tentativas
    message: {
        success: false,
        message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    },
    skipSuccessfulRequests: true,
    handler: (req, res) => {
        logger.warn('Rate limit de login excedido', {
            ip: req.ip,
            email: req.body?.email,
        });
        res.status(429).json({
            success: false,
            message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
        });
    },
});

// ========================================
// MIDDLEWARES DE PARSING
// ========================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========================================
// ROTAS
// ========================================

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API IMAC Congelados funcionando',
        timestamp: new Date().toISOString(),
        environment: config.env,
        uptime: process.uptime(),
    });
});

// Rotas da API
app.use('/api', routes);

// ========================================
// ERROR HANDLING
// ========================================

// 404 - Rota não encontrada
app.use(notFound);

// Error handler global
app.use(errorHandler);

export default app;
