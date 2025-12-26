import * as productionService from './service.js';
import { success } from '../../utils/responses.js';
import { logAudit } from '../../middlewares/audit.js';

export const getAll = async (req, res, next) => {
    try {
        const records = await productionService.getAll();
        return success(res, { data: records });
    } catch (err) {
        next(err);
    }
};

export const getById = async (req, res, next) => {
    try {
        const record = await productionService.getById(req.params.id);
        return success(res, { data: record });
    } catch (err) {
        next(err);
    }
};

export const create = async (req, res, next) => {
    try {
        const record = await productionService.create(req.body);

        await logAudit({
            userId: req.user?.id,
            action: 'CREATE_RECORD',
            entity: 'ProductionSpeed',
            entityId: record.id,
            details: { ...req.body },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });
        return success(res, { data: record, message: 'Registro criado', statusCode: 201 });
    } catch (err) {
        next(err);
    }
};

export const update = async (req, res, next) => {
    try {
        const record = await productionService.update(req.params.id, req.body);

        await logAudit({
            userId: req.user?.id,
            action: 'UPDATE_RECORD',
            entity: 'ProductionSpeed',
            entityId: parseInt(req.params.id),
            details: { ...req.body },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });
        return success(res, { data: record, message: 'Registro atualizado' });
    } catch (err) {
        next(err);
    }
};

export const remove = async (req, res, next) => {
    try {
        const record = await productionService.getById(req.params.id);
        await productionService.remove(req.params.id);

        await logAudit({
            userId: req.user?.id,
            action: 'DELETE_RECORD',
            entity: 'ProductionSpeed',
            entityId: parseInt(req.params.id),
            details: {
                mesAno: record.mesAno,
                produto: record.produto,
                sector: record.sector,
                velocidade: record.velocidade,
                totalRealizado: record.totalRealizado,
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });
        return success(res, { data: null, message: 'Registro deletado' });
    } catch (err) {
        next(err);
    }
};
