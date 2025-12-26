/**
 * MÓDULO: Usuários
 * ROUTES - Definição de Rotas
 */

import { Router } from 'express';
import * as controller from './controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/authorize.js';
import { auditUpdate, auditDelete } from '../../middlewares/audit.js';

const router = Router();

// Todas as rotas requerem autenticação e papel de ADMIN
router.use(authenticate, requireRole(['ADMIN']));

/**
 * GET /api/users
 * Lista todos os usuários
 */
router.get('/', controller.getAll);

/**
 * GET /api/users/:id
 * Busca um usuário por ID
 */
router.get('/:id', controller.getById);

/**
 * PUT /api/users/:id
 * Atualiza um usuário
 */
router.put('/:id', controller.update, auditUpdate('User'));

/**
 * DELETE /api/users/:id
 * Remove um usuário
 */
router.delete('/:id', controller.remove, auditDelete('User'));

export default router;
