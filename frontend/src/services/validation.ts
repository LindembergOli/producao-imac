/**
 * Serviço de Validação de Dados
 * Valida inputs do usuário para prevenir erros e ataques
 */

import type { Sector, Unit, LossType, ErrorCategory, MaintenanceStatus, AbsenceType } from '../types';

/**
 * Valida se um valor é um número válido
 */
export function isValidNumber(value: any, min?: number, max?: number): boolean {
    const num = Number(value);

    if (isNaN(num) || !isFinite(num)) {
        return false;
    }

    if (min !== undefined && num < min) {
        return false;
    }

    if (max !== undefined && num > max) {
        return false;
    }

    return true;
}

/**
 * Valida se um valor é uma string não vazia
 */
export function isValidString(value: any, minLength = 1, maxLength = 1000): boolean {
    if (typeof value !== 'string') {
        return false;
    }

    const trimmed = value.trim();

    if (trimmed.length < minLength || trimmed.length > maxLength) {
        return false;
    }

    return true;
}

/**
 * Valida formato de data (YYYY-MM-DD)
 */
export function isValidDate(dateString: string): boolean {
    if (!dateString || typeof dateString !== 'string') {
        return false;
    }

    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) {
        return false;
    }

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Valida formato de hora (HH:MM)
 */
export function isValidTime(timeString: string): boolean {
    if (!timeString || typeof timeString !== 'string') {
        return false;
    }

    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(timeString);
}

/**
 * Valida se um valor está em um enum
 */
export function isValidEnum<T extends Record<string, string>>(
    value: any,
    enumObj: T
): value is T[keyof T] {
    return Object.values(enumObj).includes(value);
}

/**
 * Valida email (básico)
 */
export function isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
        return false;
    }

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Sanitiza string removendo caracteres perigosos
 */
export function sanitizeString(value: string): string {
    if (typeof value !== 'string') {
        return '';
    }

    // Remove caracteres de controle e normaliza espaços
    return value
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove caracteres de controle
        .trim()
        .replace(/\s+/g, ' '); // Normaliza espaços múltiplos
}

/**
 * Valida e sanitiza número
 */
export function sanitizeNumber(value: any, defaultValue = 0): number {
    const num = Number(value);

    if (isNaN(num) || !isFinite(num)) {
        return defaultValue;
    }

    return num;
}

/**
 * Valida array de dados
 */
export function isValidArray(value: any, minLength = 0): boolean {
    return Array.isArray(value) && value.length >= minLength;
}

/**
 * Valida objeto não nulo
 */
export function isValidObject(value: any): boolean {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Valida ID (número positivo)
 */
export function isValidId(id: any): boolean {
    return isValidNumber(id, 1);
}

/**
 * Valida dados de funcionário
 */
export function validateEmployee(data: any): boolean {
    return (
        isValidObject(data) &&
        isValidId(data.id) &&
        isValidEnum(data.sector, {} as Record<string, Sector>) &&
        isValidString(data.name, 2, 100)
    );
}

/**
 * Valida dados de produto
 */
export function validateProduct(data: any): boolean {
    return (
        isValidObject(data) &&
        isValidId(data.id) &&
        isValidEnum(data.sector, {} as Record<string, Sector>) &&
        isValidString(data.name, 2, 100) &&
        isValidEnum(data.unit, {} as Record<string, Unit>)
    );
}

/**
 * Valida dados de máquina
 */
export function validateMachine(data: any): boolean {
    return (
        isValidObject(data) &&
        isValidId(data.id) &&
        isValidEnum(data.sector, {} as Record<string, Sector>) &&
        isValidString(data.name, 2, 100) &&
        isValidString(data.code, 2, 50)
    );
}

/**
 * Previne XSS em strings
 */
export function preventXSS(value: string): string {
    if (typeof value !== 'string') {
        return '';
    }

    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Valida range de datas
 */
export function isValidDateRange(startDate: string, endDate: string): boolean {
    if (!isValidDate(startDate) || !isValidDate(endDate)) {
        return false;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    return start <= end;
}

/**
 * Limita string ao tamanho máximo
 */
export function truncateString(value: string, maxLength: number): string {
    if (typeof value !== 'string') {
        return '';
    }

    if (value.length <= maxLength) {
        return value;
    }

    return value.substring(0, maxLength - 3) + '...';
}
