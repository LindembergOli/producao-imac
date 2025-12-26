import * as maintenanceService from './service.js';
import { success } from '../../utils/responses.js';
import { logAudit } from '../../middlewares/audit.js';

export const getAll = async (req, res, next) => {
    try {
        const records = await maintenanceService.getAll();
        return success(res, { data: records });
    } catch (err) {
        next(err);
    }
};

export const getById = async (req, res, next) => {
    try {
        const record = await maintenanceService.getById(req.params.id);
        return success(res, { data: record });
    } catch (err) {
        next(err);
    }
};

export const create = async (req, res, next) => {
    try {
        const record = await maintenanceService.create(req.body);
        
        await logAudit({
            userId: req.user?.id,
            action: 'CREATE_RECORD',
            entity: 'Maintenance',
            entityId: record.id,
            details: { ...req.body },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });
        return success(res, { data: record, message: 'Manutenção registrada', statusCode: 201 });
    } catch (err) {
        next(err);
    }
};

export const update = async (req, res, next) => {
    try {
        const record = await maintenanceService.update(req.params.id, req.body);
        
        await logAudit({
            userId: req.user?.id,
            action: 'UPDATE_RECORD',
            entity: 'Maintenance',
            entityId: parseInt(req.params.id),
            details: { ...req.body },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });
        return success(res, { data: record, message: 'Manutenção atualizada' });
    } catch (err) {
        next(err);
    }
};

export const remove = async (req, res, next) => {
    try {
        const record = await maintenanceService.getById(req.params.id);
        await maintenanceService.remove(req.params.id);
        
        await logAudit({
            userId: req.user?.id,
            action: 'DELETE_RECORD',
            entity: 'Maintenance',
            entityId: parseInt(req.params.id),
            details: {
                date: record.date,
                machine: record.machine,
                problem: record.problem,
                status: record.status,
                sector: record.sector,
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });
        return success(res, { data: null, message: 'Manutenção deletada' });
    } catch (err) {
        next(err);
    }
};
