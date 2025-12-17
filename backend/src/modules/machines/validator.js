/**
 * MÓDULO: Máquinas
 * VALIDATOR - Validação de Dados
 */

import { z } from 'zod';

const sectorMap = {
    'Confeitaria': 'CONFEITARIA',
    'Pães': 'PAES',
    'Salgado': 'SALGADO',
    'Pão de Queijo': 'PAO_DE_QUEIJO',
    'Embaladora': 'EMBALADORA'
};

const FrontSectorEnum = z.enum(['Confeitaria', 'Pães', 'Salgado', 'Pão de Queijo', 'Embaladora'], {
    required_error: 'Setor é obrigatório',
    invalid_type_error: 'Setor inválido',
});

export const createSchema = z.object({
    name: z.string({
        required_error: 'Nome é obrigatório',
    }).min(2, 'Nome deve ter no mínimo 2 caracteres').max(100).trim(),

    code: z.string({
        required_error: 'Código é obrigatório',
    }).min(2, 'Código deve ter no mínimo 2 caracteres').max(50).trim().toUpperCase(),

    sector: FrontSectorEnum.transform(val => sectorMap[val]),
}).strict();

export const updateSchema = z.object({
    name: z.string().min(2).max(100).trim().optional(),
    code: z.string().min(2).max(50).trim().toUpperCase().optional(),
    sector: FrontSectorEnum.transform(val => sectorMap[val]).optional(),
}).strict();

export const idParamSchema = z.object({
    id: z.string().regex(/^\d+$/, 'ID deve ser um número'),
});

export const codeParamSchema = z.object({
    code: z.string().min(1, 'Código não pode ser vazio'),
});

export const sectorParamSchema = z.object({
    sector: z.string().transform(val => sectorMap[val] || val.toUpperCase()),
});
