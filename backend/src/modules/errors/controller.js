import * as errorService from './service.js';
import { success } from '../../utils/responses.js';
import { logAudit } from '../../middlewares/audit.js';

// Função para normalizar setor (remover acentos)
const normalizeSector = (sector) => {
    if (!sector) return sector;
    return sector
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/Ç/g, 'C');
};

export const getAll = async (req, res, next) => {
    try {
        const records = await errorService.getAll();
        return success(res, { data: records });
    } catch (err) {
        next(err);
    }
};

export const getById = async (req, res, next) => {
    try {
        const record = await errorService.getById(req.params.id);
        return success(res, { data: record });
    } catch (err) {
        next(err);
    }
};

export const create = async (req, res, next) => {
    try {
        // Normalizar campos de texto para maiúsculas e remover acentos do setor
        const normalizedData = {
            ...req.body,
            ...(req.body.sector && { sector: normalizeSector(req.body.sector) }),
            ...(req.body.product && { product: req.body.product.toUpperCase() }),
            ...(req.body.description && { description: req.body.description.toUpperCase() }),
            ...(req.body.action && { action: req.body.action.toUpperCase() }),
        };

        const record = await errorService.create(normalizedData);

        await logAudit({
            userId: req.user?.id,
            action: 'CREATE_RECORD',
            entity: 'Error',
            entityId: record.id,
            details: { ...req.body },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });
        return success(res, { data: record, message: 'Erro registrado', statusCode: 201 });
    } catch (err) {
        next(err);
    }
};

export const update = async (req, res, next) => {
    try {
        // Normalizar campos de texto para maiúsculas e remover acentos do setor
        const normalizedData = {
            ...req.body,
            ...(req.body.sector && { sector: normalizeSector(req.body.sector) }),
            ...(req.body.product && { product: req.body.product.toUpperCase() }),
            ...(req.body.description && { description: req.body.description.toUpperCase() }),
            ...(req.body.action && { action: req.body.action.toUpperCase() }),
        };

        const record = await errorService.update(req.params.id, normalizedData);

        await logAudit({
            userId: req.user?.id,
            action: 'UPDATE_RECORD',
            entity: 'Error',
            entityId: parseInt(req.params.id),
            details: { ...req.body },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });
        return success(res, { data: record, message: 'Erro atualizado' });
    } catch (err) {
        next(err);
    }
};

export const remove = async (req, res, next) => {
    try {
        const record = await errorService.getById(req.params.id);
        await errorService.remove(req.params.id);

        await logAudit({
            userId: req.user?.id,
            action: 'DELETE_RECORD',
            entity: 'Error',
            entityId: parseInt(req.params.id),
            details: {
                date: record.date,
                product: record.product,
                category: record.category,
                description: record.description,
                sector: record.sector,
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });
        return success(res, { data: null, message: 'Erro deletado' });
    } catch (err) {
        next(err);
    }
};
