/**
 * HEALTH ROUTES - Endpoint de Healthcheck
 * 
 * Fornece endpoint para verificar saúde do sistema.
 * Útil para load balancers, monitoramento e debugging.
 */

import express from 'express';
import { performHealthCheck } from '../services/healthService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /health
 * 
 * Retorna status de saúde do sistema
 * 
 * Responses:
 * - 200: Sistema saudável
 * - 503: Sistema com problemas
 */
router.get('/', async (req, res) => {
    try {
        const health = await performHealthCheck();

        // Log do healthcheck
        logger.info('Healthcheck executado', {
            requestId: req.requestId,
            status: health.status,
            duration: health.checkDuration
        });

        // Retornar 503 se sistema não estiver saudável
        const statusCode = health.status === 'unhealthy' ? 503 : 200;

        res.status(statusCode).json(health);
    } catch (error) {
        logger.error('Erro ao executar healthcheck', {
            requestId: req.requestId,
            error: error.message,
            stack: error.stack
        });

        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Healthcheck failed',
            message: error.message
        });
    }
});

/**
 * GET /health/ready
 * 
 * Verifica se sistema está pronto para receber tráfego
 * (Kubernetes readiness probe)
 */
router.get('/ready', async (req, res) => {
    try {
        const health = await performHealthCheck();

        if (health.status === 'unhealthy') {
            return res.status(503).json({
                ready: false,
                reason: 'System unhealthy'
            });
        }

        res.json({ ready: true });
    } catch (error) {
        res.status(503).json({
            ready: false,
            reason: error.message
        });
    }
});

/**
 * GET /health/live
 * 
 * Verifica se aplicação está viva
 * (Kubernetes liveness probe)
 */
router.get('/live', (req, res) => {
    res.json({
        alive: true,
        timestamp: new Date().toISOString()
    });
});

export default router;
