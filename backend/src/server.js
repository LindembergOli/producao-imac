/**
 * Server Entry Point
 */

import app from './app.js';
import { config } from './config/env.js';
import prisma from './config/database.js';

const startServer = async () => {
    try {
        // Testar conexão com banco de dados
        await prisma.$connect();
        console.log('✅ Conectado ao banco de dados PostgreSQL');

        // Iniciar servidor
        app.listen(config.server.port, config.server.host, () => {
            console.log(`🚀 Servidor rodando em http://${config.server.host}:${config.server.port}`);
            console.log(`📍 Ambiente: ${config.env}`);
            console.log(`🔒 CORS habilitado para: ${config.cors.origin}`);
        });
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('⚠️  SIGTERM recebido. Encerrando servidor...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('⚠️  SIGINT recebido. Encerrando servidor...');
    await prisma.$disconnect();
    process.exit(0);
});

startServer();
