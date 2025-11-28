/**
 * Configuração Express App
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import routes from './routes/index.js';

const app = express();

// ========================================
// MIDDLEWARES DE SEGURANÇA
// ========================================

// Helmet - Security headers
app.use(helmet());

// CORS
app.use(cors({
    origin: config.cors.origin,
    credentials: true,
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: 'Muitas requisições. Tente novamente mais tarde.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// ========================================
// MIDDLEWARES DE PARSING
// ========================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========================================
// ROTAS
// ========================================

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API IMAC Congelados funcionando',
        timestamp: new Date().toISOString(),
        environment: config.env,
    });
});

// Rotas da API
app.use('/api', routes);

// ========================================
// ERROR HANDLING
// ========================================

// 404 - Rota não encontrada
app.use(notFound);

// Error handler global
app.use(errorHandler);

export default app;
