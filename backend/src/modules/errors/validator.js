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

const errorCategoryMap = {
    'Operacional': 'OPERACIONAL',
    'Equipamento': 'EQUIPAMENTO',
    'Material': 'MATERIAL',
    'Qualidade': 'QUALIDADE',
    'OPERACIONAL': 'OPERACIONAL',
    'EQUIPAMENTO': 'EQUIPAMENTO',
    'MATERIAL': 'MATERIAL',
    'QUALIDADE': 'QUALIDADE'
};
const FrontErrorCategoryEnum = z.enum([
    'Operacional', 'Equipamento', 'Material', 'Qualidade',
    'OPERACIONAL', 'EQUIPAMENTO', 'MATERIAL', 'QUALIDADE'
]);

const baseSchema = z.object({
    date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).transform(val => new Date(val)),
    sector: FrontSectorEnum.transform(val => sectorMap[val]),
    product: z.string().min(2).max(100),
    description: z.string().min(5).max(500),
    action: z.string().max(500).optional().or(z.literal('')),
    category: FrontErrorCategoryEnum.transform(val => errorCategoryMap[val]),
    cost: z.number().nonnegative(),
    wastedQty: z.number().nonnegative().optional(),
});

export const createSchema = baseSchema.strict().transform(data => ({
    ...data,
    action: data.action === '' ? undefined : data.action
}));

export const updateSchema = baseSchema.partial().transform(data => ({
    ...data,
    action: data.action === '' ? undefined : data.action
}));

export const idParamSchema = z.object({
    id: z.string().regex(/^\d+$/),
});
