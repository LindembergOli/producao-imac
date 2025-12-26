/**
 * METRICS MIDDLEWARE - Coleta de Métricas de Performance
 * 
 * Coleta métricas básicas de performance de cada requisição:
 * - Tempo de resposta
 * - Status code
 * - Endpoint acessado
 * - Usuário (se autenticado)
 */

import logger from '../utils/logger.js';

/**
 * Middleware para coletar métricas de performance
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const metricsMiddleware = (req, res, next) => {
    const start = Date.now();

    // Capturar quando resposta é enviada
    res.on('finish', () => {
        const duration = Date.now() - start;

        // Logar métricas
        logger.info('Request metrics', {
            eventType: 'METRICS',
            requestId: req.requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration,
            userId: req.user?.id,
            userEmail: req.user?.email,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            contentLength: res.get('content-length'),
            timestamp: new Date().toISOString()
        });

        // Alertar se requisição demorou muito
        if (duration > 5000) {
            logger.warn('Slow request detected', {
                requestId: req.requestId,
                method: req.method,
                path: req.path,
                duration,
                threshold: 5000
            });
        }
    });

    next();
};

/**
 * Coleta estatísticas agregadas (em memória)
 * 
 * NOTA: Em produção, considere usar Redis ou similar
 * para persistir métricas entre restarts
 */
class MetricsCollector {
    constructor() {
        this.stats = {
            totalRequests: 0,
            requestsByMethod: {},
            requestsByPath: {},
            requestsByStatus: {},
            averageResponseTime: 0,
            slowRequests: 0
        };
    }

    record(method, path, statusCode, duration) {
        this.stats.totalRequests++;

        // Por método
        this.stats.requestsByMethod[method] = (this.stats.requestsByMethod[method] || 0) + 1;

        // Por path
        this.stats.requestsByPath[path] = (this.stats.requestsByPath[path] || 0) + 1;

        // Por status
        this.stats.requestsByStatus[statusCode] = (this.stats.requestsByStatus[statusCode] || 0) + 1;

        // Tempo médio de resposta
        const currentAvg = this.stats.averageResponseTime;
        const totalReqs = this.stats.totalRequests;
        this.stats.averageResponseTime = ((currentAvg * (totalReqs - 1)) + duration) / totalReqs;

        // Requisições lentas (>5s)
        if (duration > 5000) {
            this.stats.slowRequests++;
        }
    }

    getStats() {
        return {
            ...this.stats,
            averageResponseTime: parseFloat(this.stats.averageResponseTime.toFixed(2))
        };
    }

    reset() {
        this.stats = {
            totalRequests: 0,
            requestsByMethod: {},
            requestsByPath: {},
            requestsByStatus: {},
            averageResponseTime: 0,
            slowRequests: 0
        };
    }
}

export const metricsCollector = new MetricsCollector();
