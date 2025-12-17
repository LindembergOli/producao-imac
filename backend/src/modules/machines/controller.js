/**
 * MÓDULO: Máquinas
 * CONTROLLER - Camada de Controle
 * 
 * Endpoints:
 * - GET    /api/machines - Listar todas as máquinas
 * - GET    /api/machines/:id - Buscar máquina por ID
 * - GET    /api/machines/code/:code - Buscar por código
 * - GET    /api/machines/sector/:sector - Buscar por setor
 * - GET    /api/machines/stats - Estatísticas
 * - POST   /api/machines - Criar máquina
 * - PUT    /api/machines/:id - Atualizar máquina
 * - DELETE /api/machines/:id - Deletar máquina
 */

import * as machineService from './service.js';
import { success } from '../../utils/responses.js';

/**
 * GET /api/machines
 * Lista todas as máquinas
 */
export const getAll = async (req, res, next) => {
    try {
        const machines = await machineService.getAll();
        return success(res, { data: machines });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/machines/:id
 * Busca máquina por ID
 */
export const getById = async (req, res, next) => {
    try {
        const machine = await machineService.getById(req.params.id);
        return success(res, { data: machine });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/machines/code/:code
 * Busca máquina por código
 */
export const getByCode = async (req, res, next) => {
    try {
        const machine = await machineService.getByCode(req.params.code);
        return success(res, { data: machine });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/machines/sector/:sector
 * Busca máquinas por setor
 */
export const getBySector = async (req, res, next) => {
    try {
        const machines = await machineService.getBySector(req.params.sector);
        return success(res, { data: machines });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/machines/stats
 * Retorna estatísticas de máquinas
 */
export const getStats = async (req, res, next) => {
    try {
        const stats = await machineService.getStats();
        return success(res, { data: stats });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/machines
 * Cria uma nova máquina
 */
export const create = async (req, res, next) => {
    try {
        const machine = await machineService.create(req.body);
        return success(res, {
            data: machine,
            message: 'Máquina criada com sucesso',
            statusCode: 201,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/machines/:id
 * Atualiza dados de uma máquina
 */
export const update = async (req, res, next) => {
    try {
        const machine = await machineService.update(req.params.id, req.body);
        return success(res, {
            data: machine,
            message: 'Máquina atualizada com sucesso',
        });
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/machines/:id
 * Deleta uma máquina
 */
export const remove = async (req, res, next) => {
    try {
        await machineService.remove(req.params.id);
        return success(res, {
            data: null,
            message: 'Máquina deletada com sucesso',
        });
    } catch (err) {
        next(err);
    }
};
