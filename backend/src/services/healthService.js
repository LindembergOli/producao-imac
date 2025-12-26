/**
 * HEALTH SERVICE - Validação de Saúde do Sistema
 * 
 * Valida todas as dependências críticas do sistema para garantir
 * que está funcionando corretamente.
 * 
 * Validações:
 * - Conexão com banco de dados
 * - Uso de memória
 * - Uso de disco
 * - Uptime do servidor
 */

import prisma from '../config/database.js';
import os from 'os';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

/**
 * Verifica saúde da conexão com banco de dados
 * 
 * MELHORIA: Timeout de 5 segundos para evitar travamento
 * 
 * @returns {Promise<Object>} Status e tempo de resposta
 */
const checkDatabase = async () => {
    const start = Date.now();
    const TIMEOUT = 5000; // 5 segundos

    try {
        // Criar promise de timeout
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Database check timeout')), TIMEOUT)
        );

        // Fazer query simples para testar conexão
        const queryPromise = prisma.$queryRaw`SELECT 1`;

        // Race: primeira que resolver/rejeitar vence
        await Promise.race([queryPromise, timeoutPromise]);

        const responseTime = Date.now() - start;

        return {
            status: responseTime < 1000 ? 'healthy' : 'warning',
            responseTime,
            message: responseTime < 1000
                ? 'Database connection OK'
                : 'Database responding slowly'
        };
    } catch (error) {
        const responseTime = Date.now() - start;

        return {
            status: 'unhealthy',
            responseTime,
            error: error.message,
            message: error.message.includes('timeout')
                ? 'Database connection timeout'
                : 'Database connection failed'
        };
    }
};

/**
 * Verifica uso de memória
 * 
 * @returns {Object} Status e uso de memória
 */
const checkMemory = () => {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const usagePercentage = (usedMemory / totalMemory) * 100;

    let status = 'healthy';
    let message = 'Memory usage normal';

    if (usagePercentage > 90) {
        status = 'unhealthy';
        message = 'Memory usage critical';
    } else if (usagePercentage > 75) {
        status = 'warning';
        message = 'Memory usage high';
    }

    return {
        status,
        message,
        usagePercentage: parseFloat(usagePercentage.toFixed(2)),
        usedMB: parseFloat((usedMemory / 1024 / 1024).toFixed(2)),
        totalMB: parseFloat((totalMemory / 1024 / 1024).toFixed(2)),
        freeMB: parseFloat((freeMemory / 1024 / 1024).toFixed(2))
    };
};

/**
 * Verifica uso de disco (apenas em sistemas Unix/Linux)
 * 
 * @returns {Promise<Object>} Status e uso de disco
 */
const checkDisk = async () => {
    try {
        // Comando funciona em Linux/Mac, pode falhar no Windows
        const { stdout } = await execAsync('df -h / | tail -1');
        const parts = stdout.trim().split(/\s+/);
        const usagePercentage = parseInt(parts[4]);

        let status = 'healthy';
        let message = 'Disk usage normal';

        if (usagePercentage > 90) {
            status = 'unhealthy';
            message = 'Disk usage critical';
        } else if (usagePercentage > 75) {
            status = 'warning';
            message = 'Disk usage high';
        }

        return {
            status,
            message,
            usagePercentage,
            available: parts[3],
            used: parts[2],
            total: parts[1]
        };
    } catch (error) {
        // Em Windows ou se comando falhar, retornar status desconhecido
        return {
            status: 'unknown',
            message: 'Disk check not available on this platform',
            error: error.message
        };
    }
};

/**
 * Verifica informações do sistema
 * 
 * @returns {Object} Informações do sistema
 */
const getSystemInfo = () => {
    return {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        uptime: process.uptime(),
        hostname: os.hostname(),
        cpus: os.cpus().length
    };
};

/**
 * Cache de healthcheck para reduzir carga
 */
let cachedHealth = null;
let cacheTimestamp = 0;
const CACHE_TTL = 10000; // 10 segundos

/**
 * Executa todas as verificações de saúde
 * 
 * MELHORIA: Cache de 10 segundos para reduzir carga no banco
 * 
 * @param {boolean} [useCache=true] - Usar cache se disponível
 * @returns {Promise<Object>} Status completo do sistema
 */
export const performHealthCheck = async (useCache = true) => {
    // Verificar se cache é válido
    if (useCache && cachedHealth && (Date.now() - cacheTimestamp) < CACHE_TTL) {
        return {
            ...cachedHealth,
            cached: true,
            cacheAge: Date.now() - cacheTimestamp
        };
    }

    const startTime = Date.now();

    // Executar todas as verificações em paralelo
    const [database, memory, disk] = await Promise.all([
        checkDatabase(),
        Promise.resolve(checkMemory()),
        checkDisk()
    ]);

    const systemInfo = getSystemInfo();

    // Determinar status geral
    const checks = { database, memory, disk };
    const hasUnhealthy = Object.values(checks).some(check => check.status === 'unhealthy');
    const hasWarning = Object.values(checks).some(check => check.status === 'warning');

    let overallStatus = 'healthy';
    if (hasUnhealthy) {
        overallStatus = 'unhealthy';
    } else if (hasWarning) {
        overallStatus = 'warning';
    }

    const health = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: systemInfo.uptime,
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        checkDuration: Date.now() - startTime,
        checks: {
            database,
            memory,
            disk
        },
        system: systemInfo
    };

    // Atualizar cache
    cachedHealth = health;
    cacheTimestamp = Date.now();

    return health;
};
