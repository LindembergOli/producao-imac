/**
 * MIDDLEWARE DE MONITORING DE PERFORMANCE
 * 
 * Monitora tempo de resposta de requisições e identifica gargalos.
 * 
 * Funcionalidades:
 * - Log de requisições lentas (> 1s)
 * - Métricas de tempo de resposta
 * - Alertas de performance
 */

import logger from '../utils/logger.js';

// Threshold para requisições lentas (ms)
const SLOW_REQUEST_THRESHOLD = 1000;

/**
 * Middleware de monitoring de performance
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const performanceMonitor = (req, res, next) => {
    const start = Date.now();

    // Capturar quando a resposta terminar
    res.on('finish', () => {
        const duration = Date.now() - start;

        // Log de requisições lentas
        if (duration > SLOW_REQUEST_THRESHOLD) {
            logger.warn('Requisição lenta detectada', {
                method: req.method,
                path: req.path,
                duration: `${duration}ms`,
                statusCode: res.statusCode,
                requestId: req.requestId,
                user: req.user?.id
            });
        } else {
            logger.debug('Requisição processada', {
                method: req.method,
                path: req.path,
                duration: `${duration}ms`,
                statusCode: res.statusCode,
                requestId: req.requestId
            });
        }
    });

    next();
};

export default performanceMonitor;
