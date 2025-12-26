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

const absenceMap = {
    'Atestado': 'ATESTADO',
    'Falta Injustificada': 'FALTA_INJUSTIFICADA',
    'Banco de Horas': 'BANCO_DE_HORAS',
    'ATESTADO': 'ATESTADO',
    'FALTA_INJUSTIFICADA': 'FALTA_INJUSTIFICADA',
    'BANCO_DE_HORAS': 'BANCO_DE_HORAS'
};
const FrontAbsenceTypeEnum = z.enum([
    'Atestado', 'Falta Injustificada', 'Banco de Horas',
    'ATESTADO', 'FALTA_INJUSTIFICADA', 'BANCO_DE_HORAS'
]);

const baseSchema = z.object({
    employeeName: z.string().min(2).max(100),
    sector: FrontSectorEnum.transform(val => sectorMap[val]),
    date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).transform(val => new Date(val)),
    absenceType: FrontAbsenceTypeEnum.transform(val => absenceMap[val]),
    daysAbsent: z.number().int().positive(),
});

export const createSchema = baseSchema.strict();

export const updateSchema = baseSchema.partial();

export const idParamSchema = z.object({
    id: z.string().regex(/^\d+$/),
});
