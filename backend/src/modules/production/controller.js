/**
 * MÓDULO: Velocidade de Produção
 * CONTROLLER - Camada de Controle
 * 
 * Gerencia o registro e consulta de velocidades de produção.
 */

import * as productionService from './service.js';
import { success } from '../../utils/responses.js';
import { logAudit } from '../../middlewares/audit.js';

/**
 * GET /api/production-speed
 * Lista registros de velocidade de produção com paginação.
 * 
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} res - Objeto de resposta Express.
 * @param {Function} next - Middleware de erro.
 * @returns {Object} JSON com lista paginada.
 */
export const getAll = async (req, res, next) => {
    try {
        const records = await productionService.getAll();
        return success(res, { data: records });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/production-speed/:id
 * Busca um registro por ID.
 * 
 * @param {Object} req - Objeto de requisição.
 * @param {string} req.params.id - ID do registro.
 * @returns {Object} JSON com o registro.
 */
export const getById = async (req, res, next) => {
    try {
        const record = await productionService.getById(req.params.id);
        return success(res, { data: record });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/production-speed
 * Cria um novo registro de velocidade de produção.
 * 
 * @param {Object} req - Objeto de requisição.
 * @param {Object} req.body - Dados do registro (produto, setor, totalRealizado, etc).
 * @returns {Object} JSON com o registro criado.
 */
export const create = async (req, res, next) => {
    try {
        const record = await productionService.create(req.body);

        await logAudit({
            userId: req.user?.id,
            action: 'CREATE_RECORD',
            entity: 'ProductionSpeed',
            entityId: record.id,
            details: { ...req.body },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });
        return success(res, { data: record, message: 'Registro criado', statusCode: 201 });
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/production-speed/:id
 * Atualiza um registro existente.
 * 
 * @param {Object} req - Objeto de requisição.
 * @param {string} req.params.id - ID do registro.
 * @param {Object} req.body - Dados a atualizar.
 * @returns {Object} JSON com o registro atualizado.
 */
export const update = async (req, res, next) => {
    try {
        const record = await productionService.update(req.params.id, req.body);

        await logAudit({
            userId: req.user?.id,
            action: 'UPDATE_RECORD',
            entity: 'ProductionSpeed',
            entityId: parseInt(req.params.id),
            details: { ...req.body },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });
        return success(res, { data: record, message: 'Registro atualizado' });
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/production-speed/:id
 * Remove um registro (soft delete).
 * 
 * @param {Object} req - Objeto de requisição.
 * @param {string} req.params.id - ID do registro.
 * @returns {Object} JSON confirmando a deleção.
 */
export const remove = async (req, res, next) => {
    try {
        const record = await productionService.getById(req.params.id);
        await productionService.remove(req.params.id);

        await logAudit({
            userId: req.user?.id,
            action: 'DELETE_RECORD',
            entity: 'ProductionSpeed',
            entityId: parseInt(req.params.id),
            details: {
                mesAno: record.mesAno,
                produto: record.produto,
                sector: record.sector,
                velocidade: record.velocidade,
                totalRealizado: record.totalRealizado,
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });
        return success(res, { data: null, message: 'Registro deletado' });
    } catch (err) {
        next(err);
    }
};
