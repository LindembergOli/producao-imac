/**
 * SISTEMA DE CACHE SIMPLES
 * 
 * Cache em memória para dados estáticos ou pouco alterados.
 * 
 * Funcionalidades:
 * - Cache com TTL (Time To Live)
 * - Invalidação manual
 * - Limpeza automática
 * 
 * Uso:
 * - Cachear produtos e máquinas
 * - Reduzir consultas ao banco
 */

import logger from './logger.js';

// Armazenamento do cache
const cache = new Map();

/**
 * Obtém valor do cache ou executa função
 * 
 * @param {string} key - Chave do cache
 * @param {number} ttl - Time to live em milissegundos
 * @param {Function} fetchFn - Função para buscar dados se não estiver em cache
 * @returns {Promise<any>} Dados do cache ou da função
 * 
 * @example
 * const products = await getCached('products:all', 60000, async () => {
 *   return await prisma.product.findMany();
 * });
 */
export const getCached = async (key, ttl, fetchFn) => {
    const cached = cache.get(key);

    // Verificar se existe e não expirou
    if (cached && Date.now() - cached.timestamp < ttl) {
        logger.debug('Cache hit', { key });
        return cached.data;
    }

    // Buscar dados
    logger.debug('Cache miss', { key });
    const data = await fetchFn();

    // Armazenar no cache
    cache.set(key, {
        data,
        timestamp: Date.now()
    });

    return data;
};

/**
 * Invalida cache por chave
 * 
 * @param {string} key - Chave do cache
 * 
 * @example
 * invalidateCache('products:all');
 */
export const invalidateCache = (key) => {
    if (cache.has(key)) {
        cache.delete(key);
        logger.debug('Cache invalidated', { key });
    }
};

/**
 * Invalida cache por padrão
 * 
 * @param {string} pattern - Padrão para invalidar (ex: 'products:')
 * 
 * @example
 * invalidateCachePattern('products:'); // Invalida todos os caches de produtos
 */
export const invalidateCachePattern = (pattern) => {
    let count = 0;

    for (const key of cache.keys()) {
        if (key.startsWith(pattern)) {
            cache.delete(key);
            count++;
        }
    }

    if (count > 0) {
        logger.debug('Cache pattern invalidated', { pattern, count });
    }
};

/**
 * Limpa todo o cache
 * 
 * @example
 * clearCache();
 */
export const clearCache = () => {
    const size = cache.size;
    cache.clear();
    logger.info('Cache cleared', { size });
};

/**
 * Obtém estatísticas do cache
 * 
 * @returns {Object} Estatísticas
 * 
 * @example
 * const stats = getCacheStats();
 * // { size: 10, keys: [...] }
 */
export const getCacheStats = () => {
    return {
        size: cache.size,
        keys: Array.from(cache.keys())
    };
};

/**
 * Limpa cache expirado
 * Deve ser executado periodicamente
 * 
 * @example
 * // Executar a cada 5 minutos
 * setInterval(cleanExpiredCache, 5 * 60 * 1000);
 */
export const cleanExpiredCache = () => {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of cache.entries()) {
        // Se não tem TTL definido, manter
        if (!value.ttl) continue;

        // Se expirou, remover
        if (now - value.timestamp > value.ttl) {
            cache.delete(key);
            cleaned++;
        }
    }

    if (cleaned > 0) {
        logger.debug('Expired cache cleaned', { cleaned });
    }
};

// Limpar cache expirado a cada 5 minutos
setInterval(cleanExpiredCache, 5 * 60 * 1000);
