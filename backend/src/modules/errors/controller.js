import * as errorService from './service.js';
import { success } from '../../utils/responses.js';

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
        const record = await errorService.create(req.body);
        return success(res, { data: record, message: 'Erro registrado', statusCode: 201 });
    } catch (err) {
        next(err);
    }
};

export const update = async (req, res, next) => {
    try {
        const record = await errorService.update(req.params.id, req.body);
        return success(res, { data: record, message: 'Erro atualizado' });
    } catch (err) {
        next(err);
    }
};

export const remove = async (req, res, next) => {
    try {
        await errorService.remove(req.params.id);
        return success(res, { data: null, message: 'Erro deletado' });
    } catch (err) {
        next(err);
    }
};
