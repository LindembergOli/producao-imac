import * as maintenanceService from './service.js';
import { success } from '../../utils/responses.js';

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
        return success(res, { data: record, message: 'Manutenção registrada', statusCode: 201 });
    } catch (err) {
        next(err);
    }
};

export const update = async (req, res, next) => {
    try {
        const record = await maintenanceService.update(req.params.id, req.body);
        return success(res, { data: record, message: 'Manutenção atualizada' });
    } catch (err) {
        next(err);
    }
};

export const remove = async (req, res, next) => {
    try {
        await maintenanceService.remove(req.params.id);
        return success(res, { data: null, message: 'Manutenção deletada' });
    } catch (err) {
        next(err);
    }
};
