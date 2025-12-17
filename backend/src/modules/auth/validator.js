/**
 * MÓDULO: Autenticação
 * VALIDATOR - Validação de Dados
 * 
 * Define schemas de validação usando Zod para todos os endpoints
 * do módulo de autenticação. Garante que os dados recebidos estão
 * no formato correto antes de processar.
 * 
 * Validações Implementadas:
 * - Tipos de dados corretos
 * - Campos obrigatórios
 * - Formatos válidos (email, senha)
 * - Tamanhos mínimos e máximos
 * - Sanitização de strings
 */

import { z } from 'zod';

/**
 * Schema para validação de email
 * Verifica formato e normaliza para lowercase
 */
const emailSchema = z
    .string({
        required_error: 'Email é obrigatório',
        invalid_type_error: 'Email deve ser uma string',
    })
    .email('Email inválido')
    .toLowerCase()
    .trim();

/**
 * Schema para validação de senha
 * Mínimo 6 caracteres
 */
const passwordSchema = z
    .string({
        required_error: 'Senha é obrigatória',
        invalid_type_error: 'Senha deve ser uma string',
    })
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(100, 'Senha muito longa');

/**
 * Schema para validação de nome
 * Remove espaços extras e valida tamanho
 */
const nameSchema = z
    .string({
        required_error: 'Nome é obrigatório',
        invalid_type_error: 'Nome deve ser uma string',
    })
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome muito longo')
    .trim()
    .transform((val) => val.replace(/\s+/g, ' ')); // Remove espaços extras

/**
 * Schema para validação de role
 * Apenas valores permitidos: ADMIN, SUPERVISOR, LIDER_PRODUCAO, ESPECTADOR
 */
const roleSchema = z
    .enum(['ADMIN', 'SUPERVISOR', 'LIDER_PRODUCAO', 'ESPECTADOR'], {
        invalid_type_error: 'Role inválido',
        required_error: 'Role é obrigatório',
    })
    .default('ESPECTADOR');

/**
 * Schema de validação para registro de usuário
 * POST /api/auth/register
 * 
 * Campos:
 * - email: string (email válido)
 * - password: string (mín. 6 caracteres)
 * - name: string (2-100 caracteres)
 * - role: enum (ADMIN|SUPERVISOR|LIDER_PRODUCAO|ESPECTADOR) - opcional, padrão: ESPECTADOR
 */
export const registerSchema = z
    .object({
        email: emailSchema,
        password: passwordSchema,
        name: nameSchema,
        role: roleSchema.optional(),
    })
    .strict(); // Rejeita campos extras não definidos

/**
 * Schema de validação para login
 * POST /api/auth/login
 * 
 * Campos:
 * - email: string (email válido)
 * - password: string (qualquer tamanho, será verificado no service)
 */
export const loginSchema = z
    .object({
        email: emailSchema,
        password: z.string({
            required_error: 'Senha é obrigatória',
            invalid_type_error: 'Senha deve ser uma string',
        }),
    })
    .strict();

/**
 * Schema de validação para refresh token
 * POST /api/auth/refresh
 * 
 * Campos:
 * - refreshToken: string (não vazio)
 */
export const refreshSchema = z
    .object({
        refreshToken: z
            .string({
                required_error: 'Refresh token é obrigatório',
                invalid_type_error: 'Refresh token deve ser uma string',
            })
            .min(1, 'Refresh token não pode ser vazio'),
    })
    .strict();

/**
 * Schema de validação para logout
 * POST /api/auth/logout
 * 
 * Campos:
 * - refreshToken: string (opcional)
 */
export const logoutSchema = z
    .object({
        refreshToken: z
            .string({
                invalid_type_error: 'Refresh token deve ser uma string',
            })
            .optional(),
    })
    .strict();

/**
 * Exporta todos os schemas para uso nos middlewares de validação
 */
export const authValidators = {
    register: registerSchema,
    login: loginSchema,
    refresh: refreshSchema,
    logout: logoutSchema,
};
