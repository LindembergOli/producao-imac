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

const FrontSectorEnum = z.enum([
    'Confeitaria', 'Pães', 'Salgado', 'Pão de Queijo', 'Embaladora', 'Manutenção',
    'CONFEITARIA', 'PAES', 'SALGADO', 'PAO_DE_QUEIJO', 'PAO DE QUEIJO', 'PÃO DE QUEIJO', 'EMBALADORA', 'MANUTENCAO'
]);
const UnitEnum = z.enum(['KG', 'UND']);

export const createSchema = z.object({
    name: z.string().min(2).max(100).trim(),
    sector: FrontSectorEnum.transform(val => sectorMap[val]),
    unit: UnitEnum,
    yield: z.number().positive().optional(),
    unitCost: z.number().nonnegative().optional(), // Aceita camelCase do front
    notes: z.string().max(500).trim().optional().or(z.literal('')),
}).strict().transform(data => ({
    ...data,
    notes: data.notes === '' ? undefined : data.notes
}));

export const updateSchema = z.object({
    name: z.string().min(2).max(100).trim().optional(),
    sector: z.string().optional().transform(val => {
        // Se já está no formato do banco (CONFEITARIA, PAES, etc), retorna como está
        if (['CONFEITARIA', 'PAES', 'SALGADO', 'PAO_DE_QUEIJO', 'EMBALADORA', 'MANUTENCAO'].includes(val)) {
            return val;
        }
        // Se está no formato do frontend (Confeitaria, Pães, etc), transforma
        return sectorMap[val] || val;
    }),
    unit: UnitEnum.optional(),
    yield: z.number().positive().optional(),
    unitCost: z.number().nonnegative().optional(),
    notes: z.string().max(500).trim().optional().or(z.literal('')),
}).passthrough(); // Permite campos extras

export const idParamSchema = z.object({
    id: z.string().regex(/^\d+$/),
});

export const sectorParamSchema = z.object({
    sector: z.string().transform(val => sectorMap[val] || val.toUpperCase()),
});
