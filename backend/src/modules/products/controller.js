/**
 * MÓDULO: Produtos
 * CONTROLLER
 */

import * as productService from './service.js';
import { success } from '../../utils/responses.js';

export const getAll = async (req, res, next) => {
    try {
        const products = await productService.getAll();
        return success(res, { data: products });
    } catch (err) {
        next(err);
    }
};

export const getById = async (req, res, next) => {
    try {
        const product = await productService.getById(req.params.id);
        return success(res, { data: product });
    } catch (err) {
        next(err);
    }
};

export const getBySector = async (req, res, next) => {
    try {
        const products = await productService.getBySector(req.params.sector);
        return success(res, { data: products });
    } catch (err) {
        next(err);
    }
};

export const create = async (req, res, next) => {
    try {
        const product = await productService.create(req.body);
        return success(res, {
            data: product,
            message: 'Produto criado com sucesso',
            statusCode: 201,
        });
    } catch (err) {
        next(err);
    }
};

export const update = async (req, res, next) => {
    try {
        const product = await productService.update(req.params.id, req.body);
        return success(res, {
            data: product,
            message: 'Produto atualizado com sucesso',
        });
    } catch (err) {
        next(err);
    }
};

export const remove = async (req, res, next) => {
    try {
        await productService.remove(req.params.id);
        return success(res, {
            data: null,
            message: 'Produto deletado com sucesso',
        });
    } catch (err) {
        next(err);
    }
};
