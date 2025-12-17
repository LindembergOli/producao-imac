/**
 * MIDDLEWARE: Sanitização de Dados
 * 
 * Sanitiza automaticamente todos os dados recebidos no body, query e params
 * para prevenir ataques XSS e injeção de código.
 * 
 * Aplica sanitização em:
 * - req.body (dados do corpo da requisição)
 * - req.query (parâmetros de query string)
 * - req.params (parâmetros de rota)
 */

import { sanitizeString } from '../utils/helpers.js';

/**
 * Sanitiza recursivamente um objeto
 * 
 * @param {*} obj - Objeto a ser sanitizado
 * @returns {*} Objeto sanitizado
 */
const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
        return sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }

    if (obj !== null && typeof obj === 'object') {
        const sanitized = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                sanitized[key] = sanitizeObject(obj[key]);
            }
        }
        return sanitized;
    }

    return obj;
};

/**
 * Middleware de sanitização
 * Sanitiza body, query e params automaticamente
 */
export const sanitize = (req, res, next) => {
    // Sanitizar body
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }

    // Sanitizar query
    if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query);
    }

    // Sanitizar params
    if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params);
    }

    next();
};
