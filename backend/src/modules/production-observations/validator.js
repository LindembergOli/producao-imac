/**
 * MÓDULO: Observações de Produção
 * VALIDATOR
 * 
 * Schemas de validação usando Zod para garantir integridade dos dados.
 */

import { z } from 'zod';

// Mapeamento de setores (frontend -> backend)
const sectorMap = {
    'Confeitaria': 'CONFEITARIA',
    'Pães': 'PAES',
    'Salgado': 'SALGADO',
    'Pão de Queijo': 'PAO_DE_QUEIJO',
    'Embaladora': 'EMBALADORA',
    // Backend Compat
    'CONFEITARIA': 'CONFEITARIA',
    'PAES': 'PAES',
    'SALGADO': 'SALGADO',
    'PAO_DE_QUEIJO': 'PAO_DE_QUEIJO',
    'PAO DE QUEIJO': 'PAO_DE_QUEIJO',
    'PÃO DE QUEIJO': 'PAO_DE_QUEIJO',
    'EMBALADORA': 'EMBALADORA',
    // Frontend enum values (uppercase with accents)
    'PÃES': 'PAES',
};

// Enum de setores permitidos
const FrontSectorEnum = z.enum([
    'Confeitaria', 'Pães', 'Salgado', 'Pão de Queijo', 'Embaladora',
    'CONFEITARIA', 'PAES', 'SALGADO', 'PAO_DE_QUEIJO', 'PAO DE QUEIJO', 'PÃO DE QUEIJO', 'EMBALADORA',
    'PÃES'
]);

/**
 * Schema base para observações de produção
 */
const baseSchema = z.object({
    // Data no formato YYYY-MM-DD
    date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data deve ser YYYY-MM-DD')
        .refine(val => !isNaN(Date.parse(val)), 'Data inválida'),

    // Setor (com transformação para formato do banco)
    sector: FrontSectorEnum.transform(val => sectorMap[val]),

    // Nome do produto
    product: z.string()
        .min(2, 'Produto deve ter no mínimo 2 caracteres')
        .max(100, 'Produto deve ter no máximo 100 caracteres')
        .trim(),

    // Tipo de observação (campo livre)
    observationType: z.string()
        .min(2, 'Tipo de observação deve ter no mínimo 2 caracteres')
        .max(100, 'Tipo de observação deve ter no máximo 100 caracteres')
        .trim(),

    // Descrição detalhada
    description: z.string()
        .min(10, 'Descrição deve ter no mínimo 10 caracteres')
        .max(5000, 'Descrição deve ter no máximo 5000 caracteres')
        .trim(),

    // Se houve impacto na produção
    hadImpact: z.boolean({
        required_error: 'Campo "Houve impacto?" é obrigatório',
        invalid_type_error: 'Campo "Houve impacto?" deve ser verdadeiro ou falso'
    })
});

/**
 * Schema para criação (todos os campos obrigatórios)
 * Não permite campos extras
 */
export const createSchema = baseSchema.strict();

/**
 * Schema para atualização (todos os campos opcionais)
 * Permite atualização parcial
 */
export const updateSchema = baseSchema.partial();

/**
 * Schema para validação de ID nos parâmetros da URL
 */
export const idParamSchema = z.object({
    id: z.string().regex(/^\d+$/, 'ID deve ser um número válido'),
});
