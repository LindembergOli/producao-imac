/**
 * MÓDULO: Produtos
 * CONTROLLER
 */

import * as productService from './service.js';
import { success } from '../../utils/responses.js';
import { validatePaginationParams } from '../../utils/pagination.js';
import { logAudit } from '../../middlewares/audit.js';
import logger from '../../utils/logger.js';

export const getAll = async (req, res, next) => {
    try {
        const { page, limit } = validatePaginationParams(req.query);
        const result = await productService.getAll(page, limit);
        return success(res, result);
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
        console.log('📦 Dados recebidos para criar produto:', JSON.stringify(req.body, null, 2));
        const product = await productService.create(req.body);

        // Auditar criação
        await logAudit({
            userId: req.user?.id,
            action: 'CREATE_RECORD',
            entity: 'Product',
            entityId: product.id,
            details: { ...req.body },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        return success(res, {
            data: product,
            message: 'Produto criado com sucesso',
            statusCode: 201,
        });
    } catch (err) {
        console.error('❌ Erro ao criar produto:', err.message);
        next(err);
    }
};

export const update = async (req, res, next) => {
    try {
        console.log('📝 Dados recebidos para atualizar produto:', JSON.stringify(req.body, null, 2));
        console.log('📝 ID do produto:', req.params.id);

        const product = await productService.update(req.params.id, req.body);

        // Auditar atualização
        await logAudit({
            userId: req.user?.id,
            action: 'UPDATE_RECORD',
            entity: 'Product',
            entityId: parseInt(req.params.id),
            details: { ...req.body },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        return success(res, {
            data: product,
            message: 'Produto atualizado com sucesso',
        });
    } catch (err) {
        console.error('❌ Erro ao atualizar produto:', err.message);
        next(err);
    }
};

export const remove = async (req, res, next) => {
    try {
        // Buscar produto antes de deletar para registrar detalhes
        const product = await productService.getById(req.params.id);

        await productService.remove(req.params.id);

        // Auditar deleção
        console.log('📝 Auditando DELETE...');
        await logAudit({
            userId: req.user?.id,
            action: 'DELETE_RECORD',
            entity: 'Product',
            entityId: parseInt(req.params.id),
            details: {
                name: product.name,
                sector: product.sector,
                unit: product.unit,
                unitCost: product.unitCost,
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });
        logger.info('✅ DELETE auditado com sucesso');

        return success(res, {
            data: null,
            message: 'Produto deletado com sucesso',
        });
    } catch (err) {
        next(err);
    }
};
