/**
 * UTILITÁRIO: Funções Auxiliares
 * 
 * Contém funções auxiliares reutilizáveis em toda a aplicação.
 * Inclui validações, formatações e utilitários gerais.
 */

/**
 * Verifica se um valor é um email válido
 * 
 * @param {string} email - Email a ser validado
 * @returns {boolean} True se o email for válido
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Verifica se uma senha atende aos requisitos mínimos
 * 
 * @param {string} password - Senha a ser validada
 * @returns {boolean} True se a senha for válida
 */
export const isValidPassword = (password) => {
    // Mínimo 6 caracteres
    return password && password.length >= 6;
};

/**
 * Sanitiza uma string removendo caracteres perigosos
 * 
 * @param {string} str - String a ser sanitizada
 * @returns {string} String sanitizada
 */
export const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;

    return str
        .trim()
        .replace(/[<>]/g, '') // Remove < e >
        .replace(/javascript:/gi, '') // Remove javascript:
        .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Formata um número como moeda brasileira
 * 
 * @param {number} value - Valor a ser formatado
 * @returns {string} Valor formatado como R$ X.XXX,XX
 */
export const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

/**
 * Formata uma data para o padrão brasileiro
 * 
 * @param {Date|string} date - Data a ser formatada
 * @returns {string} Data formatada como DD/MM/YYYY
 */
export const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Gera um código único baseado em timestamp
 * 
 * @param {string} [prefix=''] - Prefixo opcional para o código
 * @returns {string} Código único gerado
 */
export const generateUniqueCode = (prefix = '') => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${timestamp}-${random}`;
};

/**
 * Calcula a diferença em dias entre duas datas
 * 
 * @param {Date|string} date1 - Primeira data
 * @param {Date|string} date2 - Segunda data
 * @returns {number} Diferença em dias
 */
export const daysBetween = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

/**
 * Verifica se uma data está no passado
 * 
 * @param {Date|string} date - Data a ser verificada
 * @returns {boolean} True se a data estiver no passado
 */
export const isPastDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    return d < now;
};

/**
 * Remove propriedades undefined ou null de um objeto
 * 
 * @param {Object} obj - Objeto a ser limpo
 * @returns {Object} Objeto sem propriedades undefined/null
 */
export const removeEmpty = (obj) => {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, v]) => v != null)
    );
};

/**
 * Cria um objeto de paginação
 * 
 * @param {number} page - Página atual
 * @param {number} limit - Limite de itens por página
 * @returns {Object} Objeto com skip e take para Prisma
 */
export const getPagination = (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const take = limit;
    return { skip, take };
};

/**
 * Valida se um valor está dentro de um enum
 * 
 * @param {*} value - Valor a ser validado
 * @param {Object} enumObj - Objeto enum
 * @returns {boolean} True se o valor estiver no enum
 */
export const isValidEnum = (value, enumObj) => {
    return Object.values(enumObj).includes(value);
};

/**
 * Converte uma string para slug (URL-friendly)
 * 
 * @param {string} str - String a ser convertida
 * @returns {string} String em formato slug
 */
export const slugify = (str) => {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '-') // Substitui espaços por hífens
        .replace(/-+/g, '-') // Remove hífens duplicados
        .trim();
};

/**
 * Mascara dados sensíveis para logs
 * 
 * @param {string} str - String a ser mascarada
 * @param {number} [visibleChars=4] - Número de caracteres visíveis no final
 * @returns {string} String mascarada
 */
export const maskSensitiveData = (str, visibleChars = 4) => {
    if (!str || str.length <= visibleChars) return '***';
    const visible = str.slice(-visibleChars);
    const masked = '*'.repeat(str.length - visibleChars);
    return masked + visible;
};
