/**
 * Server Entry Point
 */

import app from './app.js';
import { config } from './config/env.js';
import prisma from './config/database.js';
import logger from './utils/logger.js';

const startServer = async () => {
    try {
        // Testar conexão com banco de dados
        await prisma.$connect();
        logger.info('Conectado ao banco de dados PostgreSQL');

        // Iniciar servidor
        app.listen(config.server.port, config.server.host, () => {
            logger.info(`Servidor rodando em http://${config.server.host}:${config.server.port}`);
            logger.info(`Ambiente: ${config.env}`);
            logger.info(`CORS habilitado para: ${config.cors.origin}`);
        });
    } catch (error) {
        logger.error('Erro ao iniciar servidor', { error: error.message });
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.warn('SIGTERM recebido. Encerrando servidor...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.warn('SIGINT recebido. Encerrando servidor...');
    await prisma.$disconnect();
    process.exit(0);
});

startServer();
