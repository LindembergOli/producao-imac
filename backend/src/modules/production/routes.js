import { Router } from 'express';
import * as controller from './controller.js';
import * as validator from './validator.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/auth.js';
import { canCreate, canEdit, canDelete } from '../../middlewares/authorize.js';
import { auditFieldsMiddleware } from '../../middlewares/auditFields.js';
import { softDelete } from '../../middlewares/softDelete.js';

const router = Router();
router.use(authenticate);

// Middleware para registros de produção (ADMIN, SUPERVISOR, LIDER_PRODUCAO)

router.get('/', controller.getAll);
router.get('/:id', validate(validator.idParamSchema, 'params'), controller.getById);
router.post('/', validate(validator.createSchema), canCreate, auditFieldsMiddleware, controller.create);
router.put('/:id', validate(validator.idParamSchema, 'params'), validate(validator.updateSchema), canEdit, auditFieldsMiddleware, controller.update);
router.delete('/:id', validate(validator.idParamSchema, 'params'), canDelete, controller.remove);

export default router;
