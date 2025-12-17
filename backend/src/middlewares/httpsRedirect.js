/**
 * Middleware para Forçar HTTPS em Produção
 * Redireciona requisições HTTP para HTTPS
 */

import { config } from '../config/env.js';
import logger from '../utils/logger.js';

/**
 * Middleware que força HTTPS em ambiente de produção
 * Redireciona HTTP → HTTPS com status 301 (Moved Permanently)
 */
export const enforceHttps = (req, res, next) => {
    // Apenas em produção
    if (config.env !== 'production') {
        return next();
    }

    // Verificar se a requisição já é HTTPS
    const isHttps = req.secure ||
        req.headers['x-forwarded-proto'] === 'https' ||
        req.headers['x-forwarded-ssl'] === 'on';

    if (!isHttps) {
        const httpsUrl = `https://${req.headers.host}${req.url}`;

        logger.warn('HTTP request redirected to HTTPS', {
            originalUrl: req.url,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });

        return res.redirect(301, httpsUrl);
    }

    // Adicionar header HSTS (HTTP Strict Transport Security)
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    next();
};

/**
 * Middleware que rejeita requisições HTTP em produção
 * Alternativa mais restritiva ao enforceHttps
 */
export const requireHttps = (req, res, next) => {
    if (config.env !== 'production') {
        return next();
    }

    const isHttps = req.secure ||
        req.headers['x-forwarded-proto'] === 'https' ||
        req.headers['x-forwarded-ssl'] === 'on';

    if (!isHttps) {
        logger.warn('HTTP request rejected', {
            originalUrl: req.url,
            ip: req.ip
        });

        return res.status(403).json({
            success: false,
            message: 'HTTPS obrigatório. Use https:// em vez de http://'
        });
    }

    next();
};
