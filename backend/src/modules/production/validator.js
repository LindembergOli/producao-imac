import { z } from 'zod';

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
    'EMBALADORA': 'EMBALADORA'
};

const FrontSectorEnum = z.enum([
    'Confeitaria', 'Pães', 'Salgado', 'Pão de Queijo', 'Embaladora',
    'CONFEITARIA', 'PAES', 'SALGADO', 'PAO_DE_QUEIJO', 'EMBALADORA'
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
