/**
 * Logger Estruturado com Winston
 * Implementa rotação diária de logs para evitar crescimento indefinido
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '../config/env.js';

// Definir formato de log
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Formato para console (desenvolvimento)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;

        // Adicionar metadados se existirem
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }

        return msg;
    })
);

// Configuração de rotação diária para logs de erro
const errorRotateTransport = new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',      // Máximo 20MB por arquivo
    maxFiles: '14d',     // Manter logs por 14 dias
    zippedArchive: true, // Comprimir logs antigos
});

// Configuração de rotação diária para todos os logs
const combinedRotateTransport = new DailyRotateFile({
    filename: 'logs/combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',      // Máximo 20MB por arquivo
    maxFiles: '30d',     // Manter logs por 30 dias
    zippedArchive: true, // Comprimir logs antigos
});

// Criar logger
const logger = winston.createLogger({
    level: config.logging.level,
    format: logFormat,
    defaultMeta: { service: 'imac-backend' },
    transports: [
        errorRotateTransport,
        combinedRotateTransport,
    ],
});

// Em desenvolvimento, logar também no console
if (config.isDevelopment) {
    logger.add(
        new winston.transports.Console({
            format: consoleFormat,
        })
    );
}

/**
 * Middleware para logar requisições HTTP.
 * Registra método, URL, status, duração e IP.
 * 
 * @param {Object} req - Objeto de requisição.
 * @param {Object} res - Objeto de resposta.
 * @param {Function} next - Função next.
 */
export const httpLogger = (req, res, next) => {
    const start = Date.now();

    // Logar quando a resposta terminar
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent'),
        };

        // Logar com nível apropriado
        if (res.statusCode >= 500) {
            logger.error('HTTP Request', logData);
        } else if (res.statusCode >= 400) {
            logger.warn('HTTP Request', logData);
        } else {
            logger.info('HTTP Request', logData);
        }
    });

    next();
};

// Exportar logger
export default logger;
