/**
 * MÓDULO: Funcionários (Employees)
 * VALIDATOR - Validação de Dados
 */

import { z } from 'zod';

// Mapa de setores (Frontend -> Backend)
const sectorMap = {
    'Confeitaria': 'CONFEITARIA',
    'Pães': 'PAES',
    'Salgado': 'SALGADO',
    'Pão de Queijo': 'PAO_DE_QUEIJO',
    'Embaladora': 'EMBALADORA',
    'Manutenção': 'MANUTENCAO',
    'CONFEITARIA': 'CONFEITARIA',
    'PAES': 'PAES',
    'SALGADO': 'SALGADO',
    'PAO_DE_QUEIJO': 'PAO_DE_QUEIJO',
    'PAO DE QUEIJO': 'PAO_DE_QUEIJO',
    'PÃO DE QUEIJO': 'PAO_DE_QUEIJO',
    'EMBALADORA': 'EMBALADORA',
    'MANUTENCAO': 'MANUTENCAO'
};

// Enum de setores aceito pelo frontend
const FrontSectorEnum = z.enum([
    'Confeitaria', 'Pães', 'Salgado', 'Pão de Queijo', 'Embaladora', 'Manutenção',
    'CONFEITARIA', 'PAES', 'SALGADO', 'PAO_DE_QUEIJO', 'PAO DE QUEIJO', 'PÃO DE QUEIJO', 'EMBALADORA', 'MANUTENCAO'
], {
    required_error: 'Setor é obrigatório',
    invalid_type_error: 'Setor inválido',
});

/**
 * Schema para criação de funcionário
 * POST /api/employees
 */
export const createSchema = z.object({
    name: z.string({
        required_error: 'Nome é obrigatório',
    }).min(2, 'Nome deve ter no mínimo 2 caracteres').max(100).trim(),

    sector: FrontSectorEnum.transform(val => sectorMap[val]),

    role: z.string().max(100).trim().optional().or(z.literal('')),
}).strict().transform(data => ({
    ...data,
    role: data.role === '' ? undefined : data.role
}));

/**
 * Schema para atualização de funcionário
 * PUT /api/employees/:id
 */
export const updateSchema = z.object({
    name: z.string().min(2).max(100).trim().optional(),
    sector: FrontSectorEnum.transform(val => sectorMap[val]).optional(),
    role: z.string().max(100).trim().optional().or(z.literal('')),
}).strict().transform(data => ({
    ...data,
    role: data.role === '' ? undefined : data.role
}));

/**
 * Schema para parâmetro de ID
 */
export const idParamSchema = z.object({
    id: z.string().regex(/^\d+$/, 'ID deve ser um número'),
});

/**
 * Schema para parâmetro de setor
 * Aceita tanto o formato do front quanto do back na URL, por flexibilidade
 */
export const sectorParamSchema = z.object({
    sector: z.string().transform(val => {
        // Se for um dos valores mapeados (front), converte
        if (sectorMap[val]) return sectorMap[val];
        // Se for um valor do backend (uppercase), retorna ele mesmo (assumindo válido) -> validação extra seria ideal mas vamos manter simples
        return val.toUpperCase();
    }),
});
