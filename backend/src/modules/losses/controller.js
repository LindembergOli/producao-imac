import * as lossService from './service.js';
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
        const paginatedResponse = await lossService.getAll();
        // paginatedResponse já vem no formato { data: [...], pagination: {...} }
        return res.status(200).json({
            success: true,
            ...paginatedResponse
        });
    } catch (err) {
        next(err);
    }
};

export const getById = async (req, res, next) => {
    try {
        const record = await lossService.getById(req.params.id);
        return success(res, { data: record });
    } catch (err) {
        next(err);
    }
};

export const create = async (req, res, next) => {
    try {
        // Normalizar produto para maiúsculas e setor sem acentos
        const normalizedData = {
            ...req.body,
            ...(req.body.sector && { sector: normalizeSector(req.body.sector) }),
            ...(req.body.product && { product: req.body.product.toUpperCase() }),
        };

        const record = await lossService.create(normalizedData);

        await logAudit({
            userId: req.user?.id,
            action: 'CREATE_RECORD',
            entity: 'Loss',
            entityId: record.id,
            details: { ...req.body },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });
        return success(res, { data: record, message: 'Perda registrada', statusCode: 201 });
    } catch (err) {
        next(err);
    }
};

export const update = async (req, res, next) => {
    try {
        // Normalizar produto para maiúsculas e setor sem acentos
        const normalizedData = {
            ...req.body,
            ...(req.body.sector && { sector: normalizeSector(req.body.sector) }),
            ...(req.body.product && { product: req.body.product.toUpperCase() }),
        };

        const record = await lossService.update(req.params.id, normalizedData);

        await logAudit({
            userId: req.user?.id,
            action: 'UPDATE_RECORD',
            entity: 'Loss',
            entityId: parseInt(req.params.id),
            details: { ...req.body },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });
        return success(res, { data: record, message: 'Perda atualizada' });
    } catch (err) {
        next(err);
    }
};

export const remove = async (req, res, next) => {
    try {
        const record = await lossService.getById(req.params.id);
        await lossService.remove(req.params.id);

        await logAudit({
            userId: req.user?.id,
            action: 'DELETE_RECORD',
            entity: 'Loss',
            entityId: parseInt(req.params.id),
            details: {
                date: record.date,
                product: record.product,
                lossType: record.lossType,
                quantity: record.quantity,
                sector: record.sector,
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });
        return success(res, { data: null, message: 'Perda deletada' });
    } catch (err) {
        next(err);
    }
};
