/**
 * MÓDULO: Funcionários (Employees)
 * CONTROLLER - Camada de Controle
 * 
 * Endpoints:
 * - GET    /api/employees - Listar todos os funcionários
 * - GET    /api/employees/:id - Buscar funcionário por ID
 * - GET    /api/employees/sector/:sector - Buscar por setor
 * - GET    /api/employees/stats - Estatísticas
 * - POST   /api/employees - Criar funcionário
 * - PUT    /api/employees/:id - Atualizar funcionário
 * - DELETE /api/employees/:id - Deletar funcionário
 */

import * as employeeService from './service.js';
import { success } from '../../utils/responses.js';
import { logAudit } from '../../middlewares/audit.js';

/**
 * GET /api/employees
 * Lista todos os funcionários.
 * 
 * @param {Object} req - Objeto de requisição.
 * @param {Object} res - Objeto de resposta.
 * @param {Function} next - Middleware de erro.
 * @returns {Object} Lista de funcionários.
 */
export const getAll = async (req, res, next) => {
    try {
        const employees = await employeeService.getAll();
        return success(res, { data: employees });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/employees/:id
 * Busca funcionário por ID.
 * 
 * @param {Object} req - Objeto de requisição.
 * @param {string} req.params.id - ID.
 * @returns {Object} Funcionário encontrado.
 */
export const getById = async (req, res, next) => {
    try {
        const employee = await employeeService.getById(req.params.id);
        return success(res, { data: employee });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/employees/sector/:sector
 * Busca funcionários por setor.
 * 
 * @param {Object} req - Objeto de requisição.
 * @param {string} req.params.sector - Setor.
 * @returns {Object} Lista de funcionários.
 */
export const getBySector = async (req, res, next) => {
    try {
        const employees = await employeeService.getBySector(req.params.sector);
        return success(res, { data: employees });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/employees/stats
 * Retorna estatísticas de funcionários.
 * 
 * @returns {Object} Estatísticas.
 */
export const getStats = async (req, res, next) => {
    try {
        const stats = await employeeService.getStats();
        return success(res, { data: stats });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/employees
 * Cria um novo funcionário.
 * 
 * @param {Object} req - Objeto de requisição.
 * @param {Object} req.body - Dados do funcionário.
 * @returns {Object} Funcionário criado.
 */
export const create = async (req, res, next) => {
    try {
        const employee = await employeeService.create(req.body);

        // Auditar criação
        await logAudit({
            userId: req.user?.id,
            action: 'CREATE_RECORD',
            entity: 'Employee',
            entityId: employee.id,
            details: { ...req.body },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        return success(res, {
            data: employee,
            message: 'Funcionário criado com sucesso',
            statusCode: 201,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/employees/:id
 * Atualiza dados de um funcionário.
 * 
 * @param {Object} req - Objeto de requisição.
 * @param {string} req.params.id - ID.
 * @param {Object} req.body - Dados a atualizar.
 * @returns {Object} Funcionário atualizado.
 */
export const update = async (req, res, next) => {
    try {
        const employee = await employeeService.update(req.params.id, req.body);

        // Auditar atualização
        await logAudit({
            userId: req.user?.id,
            action: 'UPDATE_RECORD',
            entity: 'Employee',
            entityId: parseInt(req.params.id),
            details: { ...req.body },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        return success(res, {
            data: employee,
            message: 'Funcionário atualizado com sucesso',
        });
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/employees/:id
 * Deleta um funcionário.
 * 
 * @param {Object} req - Objeto de requisição.
 * @param {string} req.params.id - ID.
 * @returns {Object} Confirmação de deleção.
 */
export const remove = async (req, res, next) => {
    try {
        // Buscar funcionário antes de deletar para registrar detalhes
        const employee = await employeeService.getById(req.params.id);

        await employeeService.remove(req.params.id);

        // Auditar deleção com detalhes
        await logAudit({
            userId: req.user?.id,
            action: 'DELETE_RECORD',
            entity: 'Employee',
            entityId: parseInt(req.params.id),
            details: {
                name: employee.name,
                sector: employee.sector,
                position: employee.position,
                cpf: employee.cpf,
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        return success(res, {
            data: null,
            message: 'Funcionário deletado com sucesso',
        });
    } catch (err) {
        next(err);
    }
};
