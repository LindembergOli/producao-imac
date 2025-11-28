/**
 * Configuração e Validação de Variáveis de Ambiente
 * Usa Zod para validação robusta
 */

import { z } from 'zod';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Schema de validação
const envSchema = z.object({
    // Ambiente
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // Servidor
    PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('3001'),
    HOST: z.string().default('localhost'),

    // Database
    DATABASE_URL: z.string().url('DATABASE_URL deve ser uma URL válida'),

    // JWT
    JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter no mínimo 32 caracteres'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET deve ter no mínimo 32 caracteres'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

    // CORS
    CORS_ORIGIN: z.string().url('CORS_ORIGIN deve ser uma URL válida').default('http://localhost:3000'),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).default('900000'),
    RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().positive()).default('100'),

    // Logging
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

// Validar e exportar configurações
let env;

try {
    env = envSchema.parse(process.env);
} catch (error) {
    console.error('❌ Erro na validação das variáveis de ambiente:');
    if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
            console.error(`  - ${err.path.join('.')}: ${err.message}`);
        });
    }
    process.exit(1);
}

export const config = {
    env: env.NODE_ENV,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',

    server: {
        port: env.PORT,
        host: env.HOST,
    },

    database: {
        url: env.DATABASE_URL,
    },

    jwt: {
        secret: env.JWT_SECRET,
        expiresIn: env.JWT_EXPIRES_IN,
        refreshSecret: env.JWT_REFRESH_SECRET,
        refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },

    cors: {
        origin: env.CORS_ORIGIN,
    },

    rateLimit: {
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    },

    logging: {
        level: env.LOG_LEVEL,
    },
};

// Log de configuração (apenas em desenvolvimento)
if (config.isDevelopment) {
    console.log('✅ Configurações carregadas com sucesso');
    console.log(`📍 Ambiente: ${config.env}`);
    console.log(`🚀 Servidor: ${config.server.host}:${config.server.port}`);
}

export default config;
