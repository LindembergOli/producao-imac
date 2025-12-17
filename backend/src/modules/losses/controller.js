import * as lossService from './service.js';
import { success } from '../../utils/responses.js';

export const getAll = async (req, res, next) => {
    try {
        const records = await lossService.getAll();
        return success(res, { data: records });
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
        const record = await lossService.create(req.body);
        return success(res, { data: record, message: 'Perda registrada', statusCode: 201 });
    } catch (err) {
        next(err);
    }
};

export const update = async (req, res, next) => {
    try {
        const record = await lossService.update(req.params.id, req.body);
        return success(res, { data: record, message: 'Perda atualizada' });
    } catch (err) {
        next(err);
    }
};

export const remove = async (req, res, next) => {
    try {
        await lossService.remove(req.params.id);
        return success(res, { data: null, message: 'Perda deletada' });
    } catch (err) {
        next(err);
    }
};
