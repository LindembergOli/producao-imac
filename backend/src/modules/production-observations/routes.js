/**
 * MÓDULO: Observações de Produção
 * ROUTES
 * 
 * Define as rotas HTTP com middlewares de segurança:
 * - Autenticação JWT
 * - Autorização RBAC
 * - Validação de dados
 * - Auditoria automática
 */

import { Router } from 'express';
import * as controller from './controller.js';
import * as validator from './validator.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/auth.js';
import { canCreate, canEdit, canDelete } from '../../middlewares/authorize.js';
import { auditFieldsMiddleware } from '../../middlewares/auditFields.js';

const router = Router();

// Todas as rotas exigem autenticação
router.use(authenticate);

/**
 * GET /api/production-observations
 * Buscar todas as observações
 * Acesso: Todos os usuários autenticados
 */
router.get('/', controller.getAll);

/**
 * GET /api/production-observations/:id
 * Buscar observação por ID
 * Acesso: Todos os usuários autenticados
 */
router.get('/:id',
    validate(validator.idParamSchema, 'params'),
    controller.getById
);

/**
 * POST /api/production-observations
 * Criar nova observação
 * Acesso: ADMIN, SUPERVISOR, LIDER_PRODUCAO
 */
router.post('/',
    validate(validator.createSchema),
    canCreate,
    auditFieldsMiddleware,
    controller.create
);

/**
 * PUT /api/production-observations/:id
 * Atualizar observação existente
 * Acesso: ADMIN, SUPERVISOR, LIDER_PRODUCAO
 */
router.put('/:id',
    validate(validator.idParamSchema, 'params'),
    validate(validator.updateSchema),
    canEdit,
    auditFieldsMiddleware,
    controller.update
);

/**
 * DELETE /api/production-observations/:id
 * Deletar observação (soft delete)
 * Acesso: ADMIN, SUPERVISOR, LIDER_PRODUCAO
 */
router.delete('/:id',
    validate(validator.idParamSchema, 'params'),
    canDelete,
    controller.remove
);

export default router;
