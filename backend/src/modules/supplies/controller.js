/**
 * MÓDULO: Supplies (Insumos)
 * CONTROLLER
 */

import * as supplyService from './service.js';
import { success } from '../../utils/responses.js';
import { validatePaginationParams } from '../../utils/pagination.js';
import { logAudit } from '../../middlewares/audit.js';
import logger from '../../utils/logger.js';

export const getAll = async (req, res, next) => {
    try {
        const { page, limit } = validatePaginationParams(req.query);
        const result = await supplyService.getAll(page, limit);
        return success(res, result);
    } catch (err) {
        next(err);
    }
};

export const getById = async (req, res, next) => {
    try {
        const supply = await supplyService.getById(req.params.id);
        return success(res, { data: supply });
    } catch (err) {
        next(err);
    }
};

export const getBySector = async (req, res, next) => {
    try {
        const supplies = await supplyService.getBySector(req.params.sector);
        return success(res, { data: supplies });
    } catch (err) {
        next(err);
    }
};

export const create = async (req, res, next) => {
    try {
        const supply = await supplyService.create(req.body);

        // Auditar criação
        await logAudit({
            userId: req.user?.id,
            action: 'CREATE_RECORD',
            entity: 'Supply',
            entityId: supply.id,
            details: { ...req.body },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        return success(res, {
            data: supply,
            message: 'Supply criado com sucesso',
            statusCode: 201,
        });
    } catch (err) {
        logger.error('Erro ao criar supply', { error: err.message, stack: err.stack });
        next(err);
    }
};

export const update = async (req, res, next) => {
    try {
        const supply = await supplyService.update(req.params.id, req.body);

        // Auditar atualização
        await logAudit({
            userId: req.user?.id,
            action: 'UPDATE_RECORD',
            entity: 'Supply',
            entityId: parseInt(req.params.id),
            details: { ...req.body },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        return success(res, {
            data: supply,
            message: 'Supply atualizado com sucesso',
        });
    } catch (err) {
        logger.error('Erro ao atualizar supply', { error: err.message, supplyId: req.params.id });
        next(err);
    }
};

export const remove = async (req, res, next) => {
    try {
        // Buscar supply antes de deletar para registrar detalhes
        const supply = await supplyService.getById(req.params.id);

        await supplyService.remove(req.params.id);

        // Auditar deleção
        await logAudit({
            userId: req.user?.id,
            action: 'DELETE_RECORD',
            entity: 'Supply',
            entityId: parseInt(req.params.id),
            details: {
                name: supply.name,
                sector: supply.sector,
                unit: supply.unit,
                unitCost: supply.unitCost,
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        return success(res, {
            data: null,
            message: 'Supply deletado com sucesso',
        });
    } catch (err) {
        next(err);
    }
};
