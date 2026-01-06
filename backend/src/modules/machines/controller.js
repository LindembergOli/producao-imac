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
import { logAudit } from '../../middlewares/audit.js';

/**
 * GET /api/machines
 * Lista todas as máquinas cadastradas.
 * 
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} res - Objeto de resposta Express.
 * @param {Function} next - Função de middleware para tratamento de erros.
 * @returns {Object} JSON com a lista de máquinas.
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
 * Busca uma máquina específica pelo ID.
 * 
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} req.params - Parâmetros da rota.
 * @param {string} req.params.id - ID da máquina.
 * @param {Object} res - Objeto de resposta Express.
 * @param {Function} next - Função de middleware para tratamento de erros.
 * @returns {Object} JSON com os dados da máquina.
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
 * Busca uma máquina pelo código de identificação.
 * 
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.params.code - Código da máquina.
 * @returns {Object} JSON com os dados da máquina.
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
 * Busca máquinas filtradas por setor.
 * 
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.params.sector - Nome do setor.
 * @returns {Object} JSON com a lista de máquinas do setor.
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
 * Retorna estatísticas gerais das máquinas.
 * 
 * @param {Object} req - Objeto de requisição.
 * @param {Object} res - Objeto de resposta.
 * @param {Function} next - Middleware de erro.
 * @returns {Object} JSON com estatísticas.
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
 * Cria um novo registro de máquina.
 * 
 * @param {Object} req - Objeto de requisição.
 * @param {Object} req.body - Dados da nova máquina (nome, setor, código, etc).
 * @param {Object} res - Objeto de resposta.
 * @param {Function} next - Middleware de erro.
 * @returns {Object} JSON com a máquina criada.
 */
export const create = async (req, res, next) => {
    try {
        const machine = await machineService.create(req.body);

        // Auditar criação
        await logAudit({
            userId: req.user?.id,
            action: 'CREATE_RECORD',
            entity: 'Machine',
            entityId: machine.id,
            details: { ...req.body },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

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
 * Atualiza os dados de uma máquina existente.
 * 
 * @param {Object} req - Objeto de requisição.
 * @param {string} req.params.id - ID da máquina.
 * @param {Object} req.body - Dados a serem atualizados.
 * @param {Object} res - Objeto de resposta.
 * @param {Function} next - Middleware de erro.
 * @returns {Object} JSON com a máquina atualizada.
 */
export const update = async (req, res, next) => {
    try {
        const machine = await machineService.update(req.params.id, req.body);

        // Auditar atualização
        await logAudit({
            userId: req.user?.id,
            action: 'UPDATE_RECORD',
            entity: 'Machine',
            entityId: parseInt(req.params.id),
            details: { ...req.body },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

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
        // Buscar máquina antes de deletar para registrar detalhes
        const machine = await machineService.getById(req.params.id);

        await machineService.remove(req.params.id);

        // Auditar deleção com detalhes
        await logAudit({
            userId: req.user?.id,
            action: 'DELETE_RECORD',
            entity: 'Machine',
            entityId: parseInt(req.params.id),
            details: {
                name: machine.name,
                sector: machine.sector,
                code: machine.code,
                model: machine.model,
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        return success(res, {
            data: null,
            message: 'Máquina deletada com sucesso',
        });
    } catch (err) {
        next(err);
    }
};
