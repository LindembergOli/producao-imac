/**
 * MÓDULO: Produtos
 * VALIDATOR
 */

import { z } from 'zod';

const sectorMap = {
    'Confeitaria': 'CONFEITARIA',
    'Pães': 'PAES',
    'Salgado': 'SALGADO',
    'Pão de Queijo': 'PAO_DE_QUEIJO',
    'Embaladora': 'EMBALADORA'
};

const FrontSectorEnum = z.enum(['Confeitaria', 'Pães', 'Salgado', 'Pão de Queijo', 'Embaladora']);
const UnitEnum = z.enum(['KG', 'UND']);

export const createSchema = z.object({
    name: z.string().min(2).max(100).trim(),
    sector: FrontSectorEnum.transform(val => sectorMap[val]),
    unit: UnitEnum,
    yield: z.number().positive().optional(),
    unit_cost: z.number().nonnegative().optional(), // Aceita snake_case do front
    notes: z.string().max(500).trim().optional().or(z.literal('')),
}).strict().transform(data => ({
    ...data,
    unitCost: data.unit_cost, // Converte para camelCase para o Prisma
    unit_cost: undefined,
    notes: data.notes === '' ? undefined : data.notes
}));

export const updateSchema = z.object({
    name: z.string().min(2).max(100).trim().optional(),
    sector: FrontSectorEnum.transform(val => sectorMap[val]).optional(),
    unit: UnitEnum.optional(),
    yield: z.number().positive().optional(),
    unit_cost: z.number().nonnegative().optional(),
    notes: z.string().max(500).trim().optional().or(z.literal('')),
}).strict().transform(data => ({
    ...data,
    unitCost: data.unit_cost,
    unit_cost: undefined,
    notes: data.notes === '' ? undefined : data.notes
}));

export const idParamSchema = z.object({
    id: z.string().regex(/^\d+$/),
});

export const sectorParamSchema = z.object({
    sector: z.string().transform(val => sectorMap[val] || val.toUpperCase()),
});
