// Configuração do Prisma Client para Vercel Serverless
import { PrismaClient } from '@prisma/client';

// Singleton pattern para evitar múltiplas instâncias
const globalForPrisma = global;

export const prisma = globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;
