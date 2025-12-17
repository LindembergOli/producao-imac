/**
 * Validators Comuns - Schemas Zod Reutilizáveis
 * Proteção contra XSS, SQL Injection e validação de tipos
 */

import { z } from 'zod';

/**
 * String sanitizada (trim + proteção XSS básica)
 */
export const sanitizedString = (minLength = 1, maxLength = 255) =>
    z
        .string({
            required_error: 'Campo obrigatório',
            invalid_type_error: 'Deve ser uma string',
        })
        .trim()
        .min(minLength, `Mínimo de ${minLength} caracteres`)
        .max(maxLength, `Máximo de ${maxLength} caracteres`)
        .refine(
            (val) => {
                // Rejeitar tags HTML e scripts
                const dangerousPatterns = [
                    /<script/i,
                    /<\/script>/i,
                    /javascript:/i,
                    /on\w+\s*=/i, // onclick, onerror, etc
                    /<iframe/i,
                    /<object/i,
                    /<embed/i,
                ];
                return !dangerousPatterns.some((pattern) => pattern.test(val));
            },
            { message: 'Conteúdo não permitido detectado' }
        );

/**
 * String sanitizada opcional
 */
export const sanitizedStringOptional = (minLength = 1, maxLength = 255) =>
    sanitizedString(minLength, maxLength).optional();

/**
 * Validação de ID numérico
 */
export const idSchema = z.object({
    id: z.coerce
        .number({
            required_error: 'ID obrigatório',
            invalid_type_error: 'ID deve ser um número',
        })
        .int('ID deve ser um número inteiro')
        .positive('ID deve ser positivo'),
});

/**
 * Validação de email
 */
export const emailSchema = z
    .string({
        required_error: 'Email obrigatório',
        invalid_type_error: 'Email deve ser uma string',
    })
    .trim()
    .toLowerCase()
    .email('Email inválido')
    .max(255, 'Email muito longo');

/**
 * Validação de senha forte
 */
export const passwordSchema = z
    .string({
        required_error: 'Senha obrigatória',
        invalid_type_error: 'Senha deve ser uma string',
    })
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .max(100, 'Senha muito longa')
    .refine((val) => /[a-z]/.test(val), {
        message: 'Senha deve conter pelo menos uma letra minúscula',
    })
    .refine((val) => /[A-Z]/.test(val), {
        message: 'Senha deve conter pelo menos uma letra maiúscula',
    })
    .refine((val) => /[0-9]/.test(val), {
        message: 'Senha deve conter pelo menos um número',
    })
    .refine((val) => /[^a-zA-Z0-9]/.test(val), {
        message: 'Senha deve conter pelo menos um caractere especial (ex: !@#$%)',
    });

/**
 * Validação de data
 */
export const dateSchema = z.coerce.date({
    required_error: 'Data obrigatória',
    invalid_type_error: 'Data inválida',
});

/**
 * Validação de data opcional
 */
export const dateSchemaOptional = dateSchema.optional();

/**
 * Enums do Prisma
 */
export const sectorEnum = z.enum(
    ['CONFEITARIA', 'PAES', 'SALGADO', 'PAO_DE_QUEIJO', 'EMBALADORA'],
    {
        required_error: 'Setor obrigatório',
        invalid_type_error: 'Setor inválido',
    }
);

export const unitEnum = z.enum(['KG', 'UND'], {
    required_error: 'Unidade obrigatória',
    invalid_type_error: 'Unidade inválida',
});

export const lossTypeEnum = z.enum(['MASSA', 'EMBALAGEM', 'INSUMO'], {
    required_error: 'Tipo de perda obrigatório',
    invalid_type_error: 'Tipo de perda inválido',
});

export const errorCategoryEnum = z.enum(
    ['OPERACIONAL', 'EQUIPAMENTO', 'MATERIAL', 'QUALIDADE'],
    {
        required_error: 'Categoria obrigatória',
        invalid_type_error: 'Categoria inválida',
    }
);

export const maintenanceStatusEnum = z.enum(['EM_ABERTO', 'FECHADO'], {
    required_error: 'Status obrigatório',
    invalid_type_error: 'Status inválido',
});

export const absenceTypeEnum = z.enum(
    ['ATESTADO', 'FALTA_INJUSTIFICADA', 'BANCO_DE_HORAS'],
    {
        required_error: 'Tipo de ausência obrigatório',
        invalid_type_error: 'Tipo de ausência inválido',
    }
);

/**
 * Validação de número positivo
 */
export const positiveNumber = z
    .number({
        required_error: 'Número obrigatório',
        invalid_type_error: 'Deve ser um número',
    })
    .positive('Deve ser um número positivo');

/**
 * Validação de número não-negativo
 */
export const nonNegativeNumber = z
    .number({
        required_error: 'Número obrigatório',
        invalid_type_error: 'Deve ser um número',
    })
    .nonnegative('Não pode ser negativo');

/**
 * Validação de número inteiro positivo
 */
export const positiveInteger = z
    .number({
        required_error: 'Número obrigatório',
        invalid_type_error: 'Deve ser um número',
    })
    .int('Deve ser um número inteiro')
    .positive('Deve ser positivo');

/**
 * Validação de formato de hora (HH:MM)
 */
export const timeFormatSchema = z
    .string({
        required_error: 'Hora obrigatória',
        invalid_type_error: 'Hora deve ser uma string',
    })
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (use HH:MM)');

/**
 * Validação de formato mês/ano (MM/YYYY)
 */
export const monthYearSchema = z
    .string({
        required_error: 'Mês/Ano obrigatório',
        invalid_type_error: 'Mês/Ano deve ser uma string',
    })
    .regex(/^(0[1-9]|1[0-2])\/\d{4}$/, 'Formato inválido (use MM/YYYY)');
