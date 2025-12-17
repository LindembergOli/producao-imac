/**
 * MÓDULO: Produtos
 * ROUTES
 */

import { Router } from 'express';
import * as controller from './controller.js';
import * as validator from './validator.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/auth.js';
import { canAccessCadastro } from '../../middlewares/authorize.js';

const router = Router();
router.use(authenticate);

// Middleware para restringir acesso à seção Cadastro (apenas ADMIN e SUPERVISOR)

router.get('/sector/:sector', validate(validator.sectorParamSchema, 'params'), controller.getBySector);
router.get('/', controller.getAll);
router.get('/:id', validate(validator.idParamSchema, 'params'), controller.getById);
router.post('/', validate(validator.createSchema), canAccessCadastro, controller.create);
router.put('/:id', validate(validator.idParamSchema, 'params'), validate(validator.updateSchema), canAccessCadastro, controller.update);
router.delete('/:id', validate(validator.idParamSchema, 'params'), canAccessCadastro, controller.remove);

export default router;
