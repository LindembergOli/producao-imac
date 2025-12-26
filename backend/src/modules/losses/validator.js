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

const lossTypeMap = {
    'Massa': 'MASSA',
    'Embalagem': 'EMBALAGEM',
    'Insumo': 'INSUMO',
    'MASSA': 'MASSA',
    'EMBALAGEM': 'EMBALAGEM',
    'INSUMO': 'INSUMO'
};
const FrontLossTypeEnum = z.enum([
    'Massa', 'Embalagem', 'Insumo',
    'MASSA', 'EMBALAGEM', 'INSUMO'
]);

const UnitEnum = z.enum(['KG', 'UND']);

const baseSchema = z.object({
    date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).transform(val => new Date(val)),
    sector: FrontSectorEnum.transform(val => sectorMap[val]),
    product: z.string().min(2).max(100),
    lossType: FrontLossTypeEnum.transform(val => lossTypeMap[val]),
    quantity: z.number().positive(),
    unit: UnitEnum,
    unitCost: z.number().nonnegative(),
    totalCost: z.number().nonnegative(),
});

export const createSchema = baseSchema.strict();

export const updateSchema = baseSchema.partial();

export const idParamSchema = z.object({
    id: z.string().regex(/^\d+$/),
});
