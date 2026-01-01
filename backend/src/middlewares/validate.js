/**
 * Middleware de Validação com Zod
 * Protege contra XSS, SQL Injection, NoSQL Injection e payloads malformados
 */

import { ZodError } from 'zod';
import logger from '../utils/logger.js';

/**
 * Middleware genérico de validação
 * @param {Object} schema - Schema Zod para validação
 * @param {string} source - Fonte dos dados: 'body', 'params', 'query' (padrão: 'body')
 * @returns {Function} Middleware Express
 */
export const validate = (schema, source = 'body') => {
    return async (req, res, next) => {
        try {
            // Selecionar fonte de dados
            const dataToValidate = req[source];

            // Normalizar setor ANTES da validação (remover acentos)
            if (dataToValidate && dataToValidate.sector) {
                dataToValidate.sector = dataToValidate.sector
                    .toUpperCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
                    .replace(/Ç/g, 'C');
            }

            // Validar com Zod
            const validatedData = await schema.parseAsync(dataToValidate);

            // Substituir dados originais pelos validados e sanitizados
            req[source] = validatedData;

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                // Formatar erros do Zod
                const formattedErrors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code,
                }));

                // Log de tentativa de payload inválido
                logger.warn('Validação falhou', {
                    ip: req.ip,
                    url: req.originalUrl,
                    method: req.method,
                    errors: formattedErrors,
                    // Não logar dados sensíveis completos
                    dataKeys: Object.keys(req[source] || {}),
                });

                return res.status(400).json({
                    success: false,
                    message: 'Dados inválidos',
                    errors: formattedErrors,
                });
            }

            // Erro inesperado
            logger.error('Erro no middleware de validação', {
                error: error.message,
                stack: error.stack,
            });

            return res.status(500).json({
                success: false,
                message: 'Erro ao validar dados',
            });
        }
    };
};

/**
 * Middleware para validar múltiplas fontes
 * @param {Object} schemas - Objeto com schemas para body, params, query
 * @returns {Function} Middleware Express
 */
export const validateMultiple = (schemas) => {
    return async (req, res, next) => {
        try {
            const errors = [];

            // Validar cada fonte especificada
            for (const [source, schema] of Object.entries(schemas)) {
                if (schema && req[source]) {
                    try {
                        const validatedData = await schema.parseAsync(req[source]);
                        req[source] = validatedData;
                    } catch (error) {
                        if (error instanceof ZodError) {
                            errors.push(...error.errors.map((err) => ({
                                source,
                                field: err.path.join('.'),
                                message: err.message,
                                code: err.code,
                            })));
                        }
                    }
                }
            }

            if (errors.length > 0) {
                logger.warn('Validação múltipla falhou', {
                    ip: req.ip,
                    url: req.originalUrl,
                    method: req.method,
                    errors,
                });

                return res.status(400).json({
                    success: false,
                    message: 'Dados inválidos',
                    errors,
                });
            }

            next();
        } catch (error) {
            logger.error('Erro no middleware de validação múltipla', {
                error: error.message,
                stack: error.stack,
            });

            return res.status(500).json({
                success: false,
                message: 'Erro ao validar dados',
            });
        }
    };
};
