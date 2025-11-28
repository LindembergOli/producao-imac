/**
 * Configuração do Prisma Client
 */

import { PrismaClient } from '@prisma/client';
import { config } from './env.js';

const prisma = new PrismaClient({
    log: config.isDevelopment ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});

export default prisma;
