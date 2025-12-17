/**
 * MÓDULO: Usuários
 * ROUTES - Definição de Rotas
 */

import { Router } from 'express';
import * as controller from './controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/authorize.js';

const router = Router();

// Todas as rotas requerem autenticação e papel de ADMIN
router.use(authenticate, requireRole(['ADMIN']));

/**
 * GET /api/users
 * Lista todos os usuários
 */
router.get('/', controller.getAll);

/**
 * DELETE /api/users/:id
 * Remove um usuário
 */
router.delete('/:id', controller.remove);

export default router;
