/**
 * UTILITÁRIO: Respostas Padronizadas da API
 * 
 * Fornece funções auxiliares para criar respostas HTTP padronizadas
 * em toda a aplicação, garantindo consistência no formato das respostas.
 * 
 * Padrão de Resposta:
 * - Sucesso: { success: true, data: {...}, message: "..." }
 * - Erro: { success: false, error: { code: "...", message: "...", details: [...] } }
 */

/**
 * Cria uma resposta de sucesso padronizada
 * 
 * @param {Object} res - Objeto de resposta do Express
 * @param {Object} options - Opções da resposta
 * @param {*} options.data - Dados a serem retornados
 * @param {string} [options.message] - Mensagem de sucesso
 * @param {number} [options.statusCode=200] - Código HTTP de status
 * @returns {Object} Resposta JSON padronizada
 * 
 * @example
 * success(res, { 
 *   data: { id: 1, name: 'João' }, 
 *   message: 'Usuário criado com sucesso',
 *   statusCode: 201 
 * });
 */
export const success = (res, { data, message = 'Operação realizada com sucesso', statusCode = 200 }) => {
    return res.status(statusCode).json({
        success: true,
        data,
        message,
    });
};

/**
 * Cria uma resposta de erro padronizada
 * 
 * @param {Object} res - Objeto de resposta do Express
 * @param {Object} options - Opções da resposta de erro
 * @param {string} options.code - Código do erro (ex: 'VALIDATION_ERROR', 'NOT_FOUND')
 * @param {string} options.message - Mensagem de erro amigável
 * @param {Array} [options.details] - Detalhes adicionais do erro
 * @param {number} [options.statusCode=400] - Código HTTP de status
 * @returns {Object} Resposta JSON padronizada de erro
 * 
 * @example
 * error(res, {
 *   code: 'VALIDATION_ERROR',
 *   message: 'Dados inválidos',
 *   details: [{ field: 'email', message: 'Email inválido' }],
 *   statusCode: 400
 * });
 */
export const error = (res, { code, message, details = [], statusCode = 400 }) => {
    return res.status(statusCode).json({
        success: false,
        error: {
            code,
            message,
            details,
        },
    });
};

/**
 * Cria uma resposta de erro de validação
 * 
 * @param {Object} res - Objeto de resposta do Express
 * @param {Array} errors - Array de erros de validação
 * @returns {Object} Resposta JSON padronizada de erro de validação
 * 
 * @example
 * validationError(res, [
 *   { field: 'email', message: 'Email é obrigatório' },
 *   { field: 'password', message: 'Senha deve ter no mínimo 6 caracteres' }
 * ]);
 */
export const validationError = (res, errors) => {
    return error(res, {
        code: 'VALIDATION_ERROR',
        message: 'Erro de validação',
        details: errors,
        statusCode: 400,
    });
};

/**
 * Cria uma resposta de erro de autenticação
 * 
 * @param {Object} res - Objeto de resposta do Express
 * @param {string} [message='Não autorizado'] - Mensagem de erro
 * @returns {Object} Resposta JSON padronizada de erro de autenticação
 */
export const unauthorized = (res, message = 'Não autorizado') => {
    return error(res, {
        code: 'UNAUTHORIZED',
        message,
        statusCode: 401,
    });
};

/**
 * Cria uma resposta de erro de permissão
 * 
 * @param {Object} res - Objeto de resposta do Express
 * @param {string} [message='Acesso negado'] - Mensagem de erro
 * @returns {Object} Resposta JSON padronizada de erro de permissão
 */
export const forbidden = (res, message = 'Acesso negado') => {
    return error(res, {
        code: 'FORBIDDEN',
        message,
        statusCode: 403,
    });
};

/**
 * Cria uma resposta de erro de recurso não encontrado
 * 
 * @param {Object} res - Objeto de resposta do Express
 * @param {string} [message='Recurso não encontrado'] - Mensagem de erro
 * @returns {Object} Resposta JSON padronizada de erro 404
 */
export const notFound = (res, message = 'Recurso não encontrado') => {
    return error(res, {
        code: 'NOT_FOUND',
        message,
        statusCode: 404,
    });
};

/**
 * Cria uma resposta de erro interno do servidor
 * 
 * @param {Object} res - Objeto de resposta do Express
 * @param {string} [message='Erro interno do servidor'] - Mensagem de erro
 * @returns {Object} Resposta JSON padronizada de erro 500
 */
export const serverError = (res, message = 'Erro interno do servidor') => {
    return error(res, {
        code: 'INTERNAL_ERROR',
        message,
        statusCode: 500,
    });
};

/**
 * Cria uma resposta de erro de conflito
 * 
 * @param {Object} res - Objeto de resposta do Express
 * @param {string} message - Mensagem de erro
 * @returns {Object} Resposta JSON padronizada de erro de conflito
 */
export const conflict = (res, message) => {
    return error(res, {
        code: 'CONFLICT',
        message,
        statusCode: 409,
    });
};

/**
 * Cria uma resposta paginada
 * 
 * @param {Object} res - Objeto de resposta do Express
 * @param {Object} options - Opções da resposta paginada
 * @param {Array} options.data - Array de dados
 * @param {number} options.page - Página atual
 * @param {number} options.limit - Limite de itens por página
 * @param {number} options.total - Total de itens
 * @returns {Object} Resposta JSON padronizada com paginação
 */
export const paginated = (res, { data, page, limit, total }) => {
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
        success: true,
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    });
};
