/**
 * MÓDULO: Máquinas
 * ROUTES - Definição de Rotas
 * 
 * Define todas as rotas do módulo de máquinas e aplica
 * os middlewares apropriados (validação, autenticação).
 */

import { Router } from 'express';
import * as controller from './controller.js';
import * as validator from './validator.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/auth.js';
import { canCreate, canEdit, canDelete } from '../../middlewares/authorize.js';
import { auditFieldsMiddleware } from '../../middlewares/auditFields.js';
import { softDelete } from '../../middlewares/softDelete.js';

const router = Router();
router.use(authenticate); router.get(
    '/sector/:sector',
    validate(validator.sectorParamSchema, 'params'),
    controller.getBySector
);

/**
 * GET /api/machines
 * Listar todas as máquinas
 */
router.get('/', controller.getAll);

/**
 * GET /api/machines/:id
 * Buscar máquina por ID
 */
router.get(
    '/:id',
    validate(validator.idParamSchema, 'params'),
    controller.getById
);

/**
 * POST /api/machines
 * Criar nova máquina
 */
router.post(
    '/',
    validate(validator.createSchema),
    canCreate,
    auditFieldsMiddleware,
    controller.create
);

/**
 * PUT /api/machines/:id
 * Atualizar máquina
 */
router.put(
    '/:id',
    validate(validator.idParamSchema, 'params'),
    validate(validator.updateSchema),
    canEdit,
    auditFieldsMiddleware,
    controller.update
);

/**
 * DELETE /api/machines/:id
 * Deletar máquina
 */
router.delete(
    '/:id',
    validate(validator.idParamSchema, 'params'),
    canDelete,
    controller.remove
);

export default router;
