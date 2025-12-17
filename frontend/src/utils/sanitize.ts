/**
 * Serviço de Sanitização
 * Usa DOMPurify para sanitizar HTML e prevenir XSS
 */

import DOMPurify from 'dompurify';

/**
 * Sanitiza HTML usando DOMPurify
 */
export function sanitizeHTML(dirty: string): string {
    if (typeof dirty !== 'string') {
        return '';
    }

    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'span'],
        ALLOWED_ATTR: []
    });
}

/**
 * Sanitiza texto simples (remove todas as tags HTML)
 */
export function sanitizeText(dirty: string): string {
    if (typeof dirty !== 'string') {
        return '';
    }

    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
    });
}

/**
 * Sanitiza URL
 */
export function sanitizeURL(url: string): string {
    if (typeof url !== 'string') {
        return '';
    }

    try {
        const parsed = new URL(url);

        // Apenas permite http e https
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return '';
        }

        return parsed.toString();
    } catch {
        return '';
    }
}

/**
 * Sanitiza objeto recursivamente
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }

    const sanitized = {} as T;

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key as keyof T] = sanitizeText(value) as any;
        } else if (Array.isArray(value)) {
            sanitized[key as keyof T] = value.map(item =>
                typeof item === 'string' ? sanitizeText(item) : item
            ) as any;
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key as keyof T] = sanitizeObject(value);
        } else {
            sanitized[key as keyof T] = value;
        }
    }

    return sanitized;
}

/**
 * Remove scripts de uma string
 */
export function removeScripts(dirty: string): string {
    if (typeof dirty !== 'string') {
        return '';
    }

    return dirty
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
}

/**
 * Sanitiza input de formulário
 */
export function sanitizeFormInput(input: string, allowHTML = false): string {
    if (typeof input !== 'string') {
        return '';
    }

    if (allowHTML) {
        return sanitizeHTML(input);
    }

    return sanitizeText(input);
}
