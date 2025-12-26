/**
 * BUSINESS LOGGER - Logs de Eventos de Negócio
 * 
 * Sistema especializado para logar eventos importantes do negócio,
 * facilitando análise de comportamento, auditoria e troubleshooting.
 * 
 * Diferença entre logger técnico e businessLogger:
 * - Logger técnico: Erros, warnings, debug (foco em sistema)
 * - Business logger: Eventos de negócio (foco em ações do usuário)
 * 
 * SEGURANÇA: Sanitiza automaticamente dados sensíveis
 */

import logger from './logger.js';

/**
 * Lista de campos sensíveis que nunca devem ser logados
 * 
 * IMPORTANTE: Adicione aqui qualquer campo que contenha dados sensíveis
 */
const SENSITIVE_FIELDS = [
    'password', 'senha', 'pass', 'pwd',
    'token', 'accessToken', 'refreshToken', 'jwt',
    'secret', 'apiKey', 'api_key', 'privateKey',
    'cpf', 'rg', 'ssn', 'taxId',
    'creditCard', 'cardNumber', 'cvv', 'cvc', 'pin',
    'bankAccount', 'accountNumber', 'routingNumber'
];

/**
 * Remove campos sensíveis de um objeto
 * 
 * @param {any} data - Dados a serem sanitizados
 * @returns {any} Dados sanitizados
 * 
 * @example
 * sanitizeDetails({ password: '123', name: 'João' })
 * // Retorna: { password: '[REDACTED]', name: 'João' }
 */
const sanitizeDetails = (data) => {
    if (!data || typeof data !== 'object') {
        return data;
    }

    // Arrays
    if (Array.isArray(data)) {
        return data.map(item => sanitizeDetails(item));
    }

    // Objetos
    const sanitized = {};

    for (const [key, value] of Object.entries(data)) {
        // Verificar se é campo sensível (case-insensitive)
        const isSensitive = SENSITIVE_FIELDS.some(
            field => key.toLowerCase().includes(field.toLowerCase())
        );

        if (isSensitive) {
            sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
            // Recursivo para objetos aninhados
            sanitized[key] = sanitizeDetails(value);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
};

/**
 * Eventos de negócio disponíveis
 * 
 * Organize por módulo para facilitar manutenção
 */
export const BusinessEvents = {
    // Autenticação
    AUTH: {
        LOGIN_SUCCESS: 'AUTH.LOGIN_SUCCESS',
        LOGIN_FAILED: 'AUTH.LOGIN_FAILED',
        LOGOUT: 'AUTH.LOGOUT',
        PASSWORD_RESET_REQUESTED: 'AUTH.PASSWORD_RESET_REQUESTED',
        PASSWORD_RESET_COMPLETED: 'AUTH.PASSWORD_RESET_COMPLETED',
        ACCOUNT_LOCKED: 'AUTH.ACCOUNT_LOCKED',
        ACCOUNT_UNLOCKED: 'AUTH.ACCOUNT_UNLOCKED',
    },

    // Produção
    PRODUCTION: {
        RECORD_CREATED: 'PRODUCTION.RECORD_CREATED',
        RECORD_UPDATED: 'PRODUCTION.RECORD_UPDATED',
        RECORD_DELETED: 'PRODUCTION.RECORD_DELETED',
        GOAL_ACHIEVED: 'PRODUCTION.GOAL_ACHIEVED',
        GOAL_MISSED: 'PRODUCTION.GOAL_MISSED',
        SPEED_CALCULATED: 'PRODUCTION.SPEED_CALCULATED',
    },

    // Erros de Produção
    ERROR: {
        RECORD_CREATED: 'ERROR.RECORD_CREATED',
        RECORD_RESOLVED: 'ERROR.RECORD_RESOLVED',
        RECORD_ESCALATED: 'ERROR.RECORD_ESCALATED',
        THRESHOLD_EXCEEDED: 'ERROR.THRESHOLD_EXCEEDED',
    },

    // Perdas
    LOSS: {
        RECORDED: 'LOSS.RECORDED',
        THRESHOLD_EXCEEDED: 'LOSS.THRESHOLD_EXCEEDED',
        PATTERN_DETECTED: 'LOSS.PATTERN_DETECTED',
    },

    // Manutenção
    MAINTENANCE: {
        SCHEDULED: 'MAINTENANCE.SCHEDULED',
        STARTED: 'MAINTENANCE.STARTED',
        COMPLETED: 'MAINTENANCE.COMPLETED',
        OVERDUE: 'MAINTENANCE.OVERDUE',
        CANCELLED: 'MAINTENANCE.CANCELLED',
    },

    // Usuários
    USER: {
        CREATED: 'USER.CREATED',
        UPDATED: 'USER.UPDATED',
        DELETED: 'USER.DELETED',
        ROLE_CHANGED: 'USER.ROLE_CHANGED',
    },
};

/**
 * Criar lista flat de todos os eventos válidos para validação
 */
const VALID_EVENTS = new Set([
    ...Object.values(BusinessEvents.AUTH),
    ...Object.values(BusinessEvents.PRODUCTION),
    ...Object.values(BusinessEvents.ERROR),
    ...Object.values(BusinessEvents.LOSS),
    ...Object.values(BusinessEvents.MAINTENANCE),
    ...Object.values(BusinessEvents.USER),
]);

/**
 * Loga um evento de negócio
 * 
 * SEGURANÇA: Sanitiza automaticamente dados sensíveis antes de logar
 * VALIDAÇÃO: Verifica se evento é válido
 * 
 * @param {Object} params - Parâmetros do evento
 * @param {string} params.event - Tipo de evento (use BusinessEvents)
 * @param {number} [params.userId] - ID do usuário que executou a ação
 * @param {string} [params.userEmail] - Email do usuário
 * @param {string} [params.requestId] - Request ID para correlação
 * @param {Object} [params.details] - Detalhes específicos do evento
 * @param {Object} [params.metadata] - Metadados adicionais (IP, user-agent, etc)
 * 
 * @example
 * logBusinessEvent({
 *   event: BusinessEvents.PRODUCTION.GOAL_ACHIEVED,
 *   userId: req.user.id,
 *   userEmail: req.user.email,
 *   requestId: req.requestId,
 *   details: {
 *     sector: 'CONFEITARIA',
 *     product: 'Bolo de Chocolate',
 *     goal: 1000,
 *     achieved: 1050,
 *     percentage: 105
 *   },
 *   metadata: {
 *     ip: req.ip,
 *     userAgent: req.get('user-agent')
 *   }
 * });
 */
export const logBusinessEvent = ({
    event,
    userId = null,
    userEmail = null,
    requestId = null,
    details = {},
    metadata = {}
}) => {
    // Validar evento
    if (!VALID_EVENTS.has(event)) {
        logger.warn('Invalid business event', {
            event,
            message: 'Evento não está na lista de eventos válidos. Verifique BusinessEvents.'
        });
        return; // Não logar evento inválido
    }

    // Sanitizar dados sensíveis automaticamente
    const sanitizedDetails = sanitizeDetails(details);
    const sanitizedMetadata = sanitizeDetails(metadata);

    logger.info('Business Event', {
        eventType: 'BUSINESS',
        event,
        userId,
        userEmail,
        requestId,
        details: sanitizedDetails,
        metadata: sanitizedMetadata,
        timestamp: new Date().toISOString()
    });
};

/**
 * Helper para logar evento de autenticação
 */
export const logAuthEvent = (event, userId, userEmail, requestId, details = {}, metadata = {}) => {
    logBusinessEvent({
        event,
        userId,
        userEmail,
        requestId,
        details,
        metadata
    });
};

/**
 * Helper para logar evento de produção
 */
export const logProductionEvent = (event, userId, userEmail, requestId, details = {}, metadata = {}) => {
    logBusinessEvent({
        event,
        userId,
        userEmail,
        requestId,
        details,
        metadata
    });
};

/**
 * Helper para logar evento de erro
 */
export const logErrorEvent = (event, userId, userEmail, requestId, details = {}, metadata = {}) => {
    logBusinessEvent({
        event,
        userId,
        userEmail,
        requestId,
        details,
        metadata
    });
};

/**
 * Helper para logar evento de perda
 */
export const logLossEvent = (event, userId, userEmail, requestId, details = {}, metadata = {}) => {
    logBusinessEvent({
        event,
        userId,
        userEmail,
        requestId,
        details,
        metadata
    });
};

/**
 * Helper para logar evento de manutenção
 */
export const logMaintenanceEvent = (event, userId, userEmail, requestId, details = {}, metadata = {}) => {
    logBusinessEvent({
        event,
        userId,
        userEmail,
        requestId,
        details,
        metadata
    });
};

/**
 * Helper para logar evento de usuário
 */
export const logUserEvent = (event, userId, userEmail, requestId, details = {}, metadata = {}) => {
    logBusinessEvent({
        event,
        userId,
        userEmail,
        requestId,
        details,
        metadata
    });
};
