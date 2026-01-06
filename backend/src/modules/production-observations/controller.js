/**
 * MÓDULO: Observações de Produção
 * CONTROLLER
 * 
 * Responsável por lidar com requisições HTTP e respostas.
 * Implementa auditoria completa de todas as operações.
 */

import * as service from './service.js';
import { success } from '../../utils/responses.js';
import { logAudit } from '../../middlewares/audit.js';

/**
 * GET /api/production-observations
 * Buscar todas as observações
 */
export const getAll = async (req, res, next) => {
    try {
        const records = await service.getAll();
        return success(res, { data: records });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/production-observations/:id
 * Buscar observação por ID
 */
export const getById = async (req, res, next) => {
    try {
        const record = await service.getById(req.params.id);
        return success(res, { data: record });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/production-observations
 * Criar nova observação
 */
export const create = async (req, res, next) => {
    try {
        const record = await service.create(req.body);

        // Log de auditoria
        await logAudit({
            userId: req.user?.id,
            action: 'CREATE_RECORD',
            entity: 'ProductionObservation',
            entityId: record.id,
            details: { ...req.body },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        return success(res, {
            data: record,
            message: 'Observação criada com sucesso',
            statusCode: 201
        });
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/production-observations/:id
 * Atualizar observação existente
 */
export const update = async (req, res, next) => {
    try {
        const record = await service.update(req.params.id, req.body);

        // Log de auditoria
        await logAudit({
            userId: req.user?.id,
            action: 'UPDATE_RECORD',
            entity: 'ProductionObservation',
            entityId: parseInt(req.params.id),
            details: { ...req.body },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        return success(res, {
            data: record,
            message: 'Observação atualizada com sucesso'
        });
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/production-observations/:id
 * Deletar observação (soft delete)
 */
export const remove = async (req, res, next) => {
    try {
        const record = await service.getById(req.params.id);
        await service.remove(req.params.id);

        // Log de auditoria
        await logAudit({
            userId: req.user?.id,
            action: 'DELETE_RECORD',
            entity: 'ProductionObservation',
            entityId: parseInt(req.params.id),
            details: {
                date: record.date,
                product: record.product,
                sector: record.sector,
                observationType: record.observationType,
                hadImpact: record.hadImpact
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        return success(res, {
            data: null,
            message: 'Observação deletada com sucesso'
        });
    } catch (err) {
        next(err);
    }
};
