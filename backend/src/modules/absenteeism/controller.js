import * as absenteeismService from './service.js';
import { success } from '../../utils/responses.js';
import { logAudit } from '../../middlewares/audit.js';

export const getAll = async (req, res, next) => {
    try {
        const records = await absenteeismService.getAll();
        return success(res, { data: records });
    } catch (err) {
        next(err);
    }
};

export const getById = async (req, res, next) => {
    try {
        const record = await absenteeismService.getById(req.params.id);
        return success(res, { data: record });
    } catch (err) {
        next(err);
    }
};

export const create = async (req, res, next) => {
    try {
        const record = await absenteeismService.create(req.body);

        await logAudit({
            userId: req.user?.id,
            action: 'CREATE_RECORD',
            entity: 'Absenteeism',
            entityId: record.id,
            details: { ...req.body },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        return success(res, { data: record, message: 'Absenteísmo registrado', statusCode: 201 });
    } catch (err) {
        next(err);
    }
};

export const update = async (req, res, next) => {
    try {
        const record = await absenteeismService.update(req.params.id, req.body);

        await logAudit({
            userId: req.user?.id,
            action: 'UPDATE_RECORD',
            entity: 'Absenteeism',
            entityId: parseInt(req.params.id),
            details: { ...req.body },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        return success(res, { data: record, message: 'Absenteísmo atualizado' });
    } catch (err) {
        next(err);
    }
};

export const remove = async (req, res, next) => {
    try {
        const record = await absenteeismService.getById(req.params.id);
        await absenteeismService.remove(req.params.id);

        await logAudit({
            userId: req.user?.id,
            action: 'DELETE_RECORD',
            entity: 'Absenteeism',
            entityId: parseInt(req.params.id),
            details: {
                employeeName: record.employeeName,
                date: record.date,
                absenceType: record.absenceType,
                daysAbsent: record.daysAbsent,
                sector: record.sector,
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        return success(res, { data: null, message: 'Absenteísmo deletado' });
    } catch (err) {
        next(err);
    }
};
