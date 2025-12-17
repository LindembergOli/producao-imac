/**
 * MÓDULO: Funcionários (Employees)
 * ROUTES - Definição de Rotas
 */

import { Router } from 'express';
import * as controller from './controller.js';
import * as validator from './validator.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/auth.js';
import { canAccessCadastro } from '../../middlewares/authorize.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Middleware para restringir acesso à seção Cadastro (apenas ADMIN e SUPERVISOR)
// LIDER_PRODUCAO não tem acesso a Employees (Cadastro)

/**
 * GET /api/employees/stats
 * Estatísticas de funcionários
 */
router.get('/stats', controller.getStats);

/**
 * GET /api/employees/sector/:sector
 * Buscar funcionários por setor
 */
router.get(
    '/sector/:sector',
    validate(validator.sectorParamSchema, 'params'),
    controller.getBySector
);

/**
 * GET /api/employees
 * Listar todos os funcionários
 */
router.get('/', controller.getAll);

/**
 * GET /api/employees/:id
 * Buscar funcionário por ID
 */
router.get(
    '/:id',
    validate(validator.idParamSchema, 'params'),
    controller.getById
);

/**
 * POST /api/employees
 * Criar novo funcionário
 */
router.post(
    '/',
    validate(validator.createSchema),
    canAccessCadastro,
    controller.create
);

/**
 * PUT /api/employees/:id
 * Atualizar funcionário
 */
router.put(
    '/:id',
    validate(validator.idParamSchema, 'params'),
    validate(validator.updateSchema),
    canAccessCadastro,
    controller.update
);

/**
 * DELETE /api/employees/:id
 * Deletar funcionário
 */
router.delete(
    '/:id',
    validate(validator.idParamSchema, 'params'),
    canAccessCadastro,
    controller.remove
);

export default router;
