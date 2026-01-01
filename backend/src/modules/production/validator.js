import { z } from 'zod';

const sectorMap = {
    'Confeitaria': 'CONFEITARIA',
    'Pães': 'PAES',
    'Salgado': 'SALGADO',
    'Pão de Queijo': 'PAO_DE_QUEIJO',
    'Embaladora': 'EMBALADORA',
    'Manutenção': 'MANUTENCAO',
    // Backend Compat
    'CONFEITARIA': 'CONFEITARIA',
    'PAES': 'PAES',
    'SALGADO': 'SALGADO',
    'PAO_DE_QUEIJO': 'PAO_DE_QUEIJO',
    'PAO DE QUEIJO': 'PAO_DE_QUEIJO',
    'PÃO DE QUEIJO': 'PAO_DE_QUEIJO',
    'EMBALADORA': 'EMBALADORA',
    'MANUTENCAO': 'MANUTENCAO',
    // Frontend enum values (uppercase with accents)
    'PÃES': 'PAES',
    'MANUTENÇÃO': 'MANUTENCAO'
};

const FrontSectorEnum = z.enum([
    'Confeitaria', 'Pães', 'Salgado', 'Pão de Queijo', 'Embaladora', 'Manutenção',
    'CONFEITARIA', 'PAES', 'SALGADO', 'PAO_DE_QUEIJO', 'PAO DE QUEIJO', 'PÃO DE QUEIJO', 'EMBALADORA', 'MANUTENCAO',
    'PÃES', 'MANUTENÇÃO'
]);

const baseSchema = z.object({
    mesAno: z.string().regex(/^\d{2}\/\d{4}$/, 'Formato deve ser MM/YYYY'),
    sector: FrontSectorEnum.transform(val => sectorMap[val]),
    produto: z.string().min(2).max(100),
    metaMes: z.number().nonnegative(),
    dailyProduction: z.array(z.object({
        programado: z.number().nonnegative(),
        realizado: z.number().nonnegative(),
    })),
    totalProgramado: z.number().nonnegative(),
    totalRealizado: z.number().nonnegative(),
    velocidade: z.number().nonnegative(),
});

export const createSchema = baseSchema.strict();

export const updateSchema = baseSchema.partial();

export const idParamSchema = z.object({
    id: z.string().regex(/^\d+$/),
});
