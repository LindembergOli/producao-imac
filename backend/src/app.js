/**
 * CONFIGURAÇÃO EXPRESS APP - Arquitetura Minimalista Profissional (AMP)
 * 
 * Arquivo principal de configuração do Express.
 * Aplica middlewares de segurança, logging, parsing e rotas.
 * 
 * Segurança Implementada:
 * - Helmet (headers de segurança)
 * - CORS restritivo
 * - Rate limiting global e por endpoint
 * - HTTPS obrigatório em produção
 * - Validação em todos os endpoints
 * 
 * Estrutura Modular:
 * - Todos os módulos organizados em /modules
 * - Rotas centralizadas em /routes.js
 * - Middlewares em /middlewares
 * - Configurações em /config
 * - Utilitários em /utils
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import { helmetConfig, corsConfig, globalRateLimitConfig } from './config/security.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import logger, { httpLogger } from './utils/logger.js';
import { enforceHttps } from './middlewares/httpsRedirect.js';
import { sanitize } from './middlewares/sanitize.js';
import { requestIdMiddleware, requestEndMiddleware } from './middlewares/requestId.js';
import routes from './routes.js';

const app = express();

// ========================================
// HTTPS OBRIGATÓRIO (PRODUÇÃO)
// ========================================

// Forçar HTTPS em produção (deve ser o primeiro middleware)
app.use(enforceHttps);

// ========================================
// REQUEST ID / CORRELATION ID
// ========================================

// Gerar requestId único para cada requisição (rastreamento)
app.use(requestIdMiddleware);

// ========================================
// LOGGING
// ========================================

// Log de requisições HTTP
app.use(httpLogger);

// ========================================
// MÉTRICAS DE PERFORMANCE
// ========================================

// Coletar métricas de cada requisição
import { metricsMiddleware } from './middlewares/metrics.js';
app.use(metricsMiddleware);

// ========================================
// MIDDLEWARES DE SEGURANÇA
// ========================================

// Helmet - Security headers com CSP detalhado
app.use(helmet(helmetConfig));

// CORS - Restrito ao frontend
app.use(cors(corsConfig));

// Rate Limiting Global
const globalLimiter = rateLimit({
    ...globalRateLimitConfig,
    handler: (req, res) => {
        logger.warn('Rate limit global excedido', {
            ip: req.ip,
            url: req.originalUrl,
        });
        res.status(429).json({
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Muitas requisições. Tente novamente mais tarde.',
            },
        });
    },
});
app.use('/api/', globalLimiter);

// ========================================
// MIDDLEWARES DE PARSING
// ========================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========================================
// SANITIZAÇÃO
// ========================================

// Sanitizar automaticamente todos os inputs
app.use(sanitize);

// ========================================
// ROTAS
// ========================================

// Health check robusto (validação de dependências)
import healthRoutes from './routes/health.js';
app.use('/health', healthRoutes);

// Rotas da API (todos os módulos)
app.use('/api', routes);

// ========================================
// REQUEST TRACKING
// ========================================

// Log de fim de requisição (deve vir antes do error handling)
app.use(requestEndMiddleware);

// ========================================
// ERROR HANDLING
// ========================================

// 404 - Rota não encontrada
app.use(notFound);

// Error handler global
app.use(errorHandler);

export default app;
