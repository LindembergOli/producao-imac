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

const statusMap = {
    'Em Aberto': 'EM_ABERTO',
    'Fechado': 'FECHADO',
    'EM_ABERTO': 'EM_ABERTO',
    'FECHADO': 'FECHADO'
};
const FrontStatusEnum = z.enum([
    'Em Aberto', 'Fechado',
    'EM_ABERTO', 'FECHADO'
]);

const baseSchema = z.object({
    date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).transform(val => new Date(val)),
    sector: FrontSectorEnum.transform(val => sectorMap[val]),
    machine: z.string().min(2).max(100),
    requester: z.string().min(2).max(100),
    technician: z.string().max(100).optional().or(z.literal('')),
    problem: z.string().min(5).max(500),
    solution: z.string().max(500).optional().or(z.literal('')),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    durationHours: z.number().nonnegative(),
    status: FrontStatusEnum.transform(val => statusMap[val]),
});

export const createSchema = baseSchema.strict().transform(data => ({
    ...data,
    technician: data.technician === '' ? undefined : data.technician,
    solution: data.solution === '' ? undefined : data.solution
}));

export const updateSchema = baseSchema.partial().transform(data => ({
    ...data,
    technician: data.technician === '' ? undefined : data.technician,
    solution: data.solution === '' ? undefined : data.solution
}));

export const idParamSchema = z.object({
    id: z.string().regex(/^\d+$/),
});
