/**
 * MIDDLEWARE: Request ID / Correlation ID
 * 
 * Gera um identificador único para cada requisição, permitindo rastreamento
 * completo do fluxo de uma requisição através de todos os logs e sistemas.
 * 
 * Funcionalidades:
 * - Gera UUID v4 único para cada requisição
 * - Aceita requestId do cliente (header X-Request-ID)
 * - Propaga requestId no response header
 * - Disponibiliza requestId em req.requestId
 * 
 * Benefícios:
 * - Rastreamento end-to-end de requisições
 * - Correlação de logs distribuídos
 * - Debugging facilitado em produção
 * - Análise de performance por requisição
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

/**
 * Middleware para gerar e propagar Request ID
 * 
 * O requestId pode vir de três fontes (em ordem de prioridade):
 * 1. Header X-Request-ID enviado pelo cliente
 * 2. Header X-Correlation-ID (padrão alternativo)
 * 3. Gerado automaticamente (UUID v4)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 * 
 * @example
 * // No app.js
 * import { requestIdMiddleware } from './middlewares/requestId.js';
 * app.use(requestIdMiddleware);
 * 
 * // Em qualquer lugar do código
 * logger.info('Processando requisição', { requestId: req.requestId });
 */
export const requestIdMiddleware = (req, res, next) => {
    // Tentar obter requestId do cliente (útil para rastreamento cross-service)
    const clientRequestId = req.get('X-Request-ID') || req.get('X-Correlation-ID');

    // Usar requestId do cliente ou gerar novo
    req.requestId = clientRequestId || uuidv4();

    // Adicionar requestId aos response headers
    // Isso permite que o cliente correlacione a resposta com a requisição
    res.set('X-Request-ID', req.requestId);

    // Log de início da requisição com requestId
    logger.info('Requisição iniciada', {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        fromClient: !!clientRequestId // Indica se requestId veio do cliente
    });

    next();
};

/**
 * Middleware para logar fim da requisição
 * 
 * Deve ser adicionado após todas as rotas para capturar
 * o status final e tempo de resposta.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
export const requestEndMiddleware = (req, res, next) => {
    const start = Date.now();

    // Capturar quando a resposta é finalizada
    res.on('finish', () => {
        const duration = Date.now() - start;

        logger.info('Requisição finalizada', {
            requestId: req.requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userId: req.user?.id,
            userEmail: req.user?.email
        });
    });

    next();
};

/**
 * Helper para adicionar requestId ao contexto de erro
 * 
 * @param {Error} error - Objeto de erro
 * @param {string} requestId - Request ID
 * @returns {Error} Erro com requestId adicionado
 */
export const addRequestIdToError = (error, requestId) => {
    if (error && requestId) {
        error.requestId = requestId;
    }
    return error;
};
