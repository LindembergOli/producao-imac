import * as productionService from './service.js';
import { success } from '../../utils/responses.js';

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
        return success(res, { data: record, message: 'Registro criado', statusCode: 201 });
    } catch (err) {
        next(err);
    }
};

export const update = async (req, res, next) => {
    try {
        const record = await productionService.update(req.params.id, req.body);
        return success(res, { data: record, message: 'Registro atualizado' });
    } catch (err) {
        next(err);
    }
};

export const remove = async (req, res, next) => {
    try {
        await productionService.remove(req.params.id);
        return success(res, { data: null, message: 'Registro deletado' });
    } catch (err) {
        next(err);
    }
};
