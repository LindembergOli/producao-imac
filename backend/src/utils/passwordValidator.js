import { z } from 'zod';

/**
 * Lista de senhas comuns que devem ser rejeitadas
 * 
 * Esta lista contém as senhas mais comumente usadas e facilmente quebradas.
 * Em produção, considere usar uma lista mais extensa.
 */
const COMMON_PASSWORDS = [
    'password', 'password123', '123456', '12345678', 'qwerty',
    'abc123', 'monkey', '1234567', 'letmein', 'trustno1',
    'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
    'ashley', 'bailey', 'passw0rd', 'shadow', '123123',
    'admin', 'admin123', 'root', 'toor', 'pass',
    '12345', '123456789', '1234567890', 'qwertyuiop'
];

/**
 * Validador de senha forte
 * 
 * Requisitos:
 * - Mínimo 8 caracteres
 * - Pelo menos 1 letra maiúscula
 * - Pelo menos 1 letra minúscula
 * - Pelo menos 1 número
 * - Pelo menos 1 caractere especial
 * - Não pode ser uma senha comum
 * 
 * @param {string} password - Senha a ser validada
 * @returns {object} Resultado da validação com sucesso e mensagem
 * 
 * @example
 * const result = validateStrongPassword('Senha@123');
 * if (!result.success) {
 *   console.error(result.message);
 * }
 */
export const validateStrongPassword = (password) => {
    // Verificar comprimento mínimo
    if (password.length < 8) {
        return {
            success: false,
            message: 'A senha deve ter no mínimo 8 caracteres'
        };
    }

    // Verificar letra maiúscula
    if (!/[A-Z]/.test(password)) {
        return {
            success: false,
            message: 'A senha deve conter pelo menos uma letra maiúscula'
        };
    }

    // Verificar letra minúscula
    if (!/[a-z]/.test(password)) {
        return {
            success: false,
            message: 'A senha deve conter pelo menos uma letra minúscula'
        };
    }

    // Verificar número
    if (!/[0-9]/.test(password)) {
        return {
            success: false,
            message: 'A senha deve conter pelo menos um número'
        };
    }

    // Verificar caractere especial
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return {
            success: false,
            message: 'A senha deve conter pelo menos um caractere especial (!@#$%^&* etc)'
        };
    }

    // Verificar se não é senha comum
    const lowerPassword = password.toLowerCase();
    if (COMMON_PASSWORDS.includes(lowerPassword)) {
        return {
            success: false,
            message: 'Esta senha é muito comum. Escolha uma senha mais forte'
        };
    }

    return {
        success: true,
        message: 'Senha válida'
    };
};

/**
 * Schema Zod para validação de senha forte
 * 
 * Use este schema em validadores de formulários
 */
export const strongPasswordSchema = z.string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres')
    .refine(
        (password) => validateStrongPassword(password).success,
        (password) => ({
            message: validateStrongPassword(password).message
        })
    );

/**
 * Validador de email
 * 
 * @param {string} email - Email a ser validado
 * @returns {boolean} True se válido
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validador de CPF (formato brasileiro)
 * 
 * @param {string} cpf - CPF a ser validado
 * @returns {boolean} True se válido
 */
export const isValidCPF = (cpf) => {
    // Remove caracteres não numéricos
    cpf = cpf.replace(/[^\d]/g, '');

    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    // Validação dos dígitos verificadores
    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;

    return true;
};

/**
 * Validador de data no formato DD/MM/YYYY
 * 
 * @param {string} date - Data a ser validada
 * @returns {boolean} True se válido
 */
export const isValidDate = (date) => {
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = date.match(dateRegex);

    if (!match) return false;

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    // Verificar dias por mês
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // Ano bissexto
    if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
        daysInMonth[1] = 29;
    }

    return day <= daysInMonth[month - 1];
};
