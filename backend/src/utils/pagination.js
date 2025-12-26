/**
 * HELPER DE PAGINAÇÃO
 * 
 * Utilitário para padronizar paginação em todas as listagens do sistema.
 * 
 * Uso:
 * - Calcular skip/take para queries
 * - Gerar metadata de paginação
 * - Validar parâmetros de paginação
 */

/**
 * Calcula skip e take para paginação
 * 
 * @param {number} page - Número da página (1-indexed)
 * @param {number} limit - Itens por página
 * @returns {Object} { skip, take }
 * 
 * @example
 * const { skip, take } = paginate(2, 20);
 * // { skip: 20, take: 20 }
 */
export const paginate = (page = 1, limit = 20) => {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20)); // Max 100 itens

    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    return { skip, take };
};

/**
 * Gera metadata de paginação
 * 
 * @param {number} page - Página atual
 * @param {number} limit - Itens por página
 * @param {number} total - Total de itens
 * @returns {Object} Metadata completa de paginação
 * 
 * @example
 * const metadata = getPaginationMetadata(2, 20, 150);
 * // {
 * //   page: 2,
 * //   limit: 20,
 * //   total: 150,
 * //   totalPages: 8,
 * //   hasNext: true,
 * //   hasPrev: true
 * // }
 */
export const getPaginationMetadata = (page, limit, total) => {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const totalNum = parseInt(total) || 0;

    const totalPages = Math.ceil(totalNum / limitNum);

    return {
        page: pageNum,
        limit: limitNum,
        total: totalNum,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
    };
};

/**
 * Cria resposta paginada padronizada
 * 
 * @param {Array} data - Dados da página
 * @param {number} page - Página atual
 * @param {number} limit - Itens por página
 * @param {number} total - Total de itens
 * @returns {Object} Resposta com data e pagination
 * 
 * @example
 * const response = createPaginatedResponse(products, 1, 20, 150);
 * // {
 * //   data: [...],
 * //   pagination: { page: 1, limit: 20, total: 150, ... }
 * // }
 */
export const createPaginatedResponse = (data, page, limit, total) => {
    return {
        data,
        pagination: getPaginationMetadata(page, limit, total)
    };
};

/**
 * Valida parâmetros de paginação
 * 
 * @param {Object} params - Query params (page, limit)
 * @returns {Object} Parâmetros validados
 * 
 * @example
 * const { page, limit } = validatePaginationParams(req.query);
 */
export const validatePaginationParams = (params = {}) => {
    const page = Math.max(1, parseInt(params.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.limit) || 20));

    return { page, limit };
};
