import { Router } from 'express';
import * as controller from './controller.js';
import * as validator from './validator.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/auth.js';
import { canCreate, canEdit, canDelete } from '../../middlewares/authorize.js';

const router = Router();
router.use(authenticate);

router.get('/', controller.getAll);
router.get('/:id', validate(validator.idParamSchema, 'params'), controller.getById);
router.post('/', validate(validator.createSchema), canCreate, controller.create);
router.put('/:id', validate(validator.idParamSchema, 'params'), validate(validator.updateSchema), canEdit, controller.update);
router.delete('/:id', validate(validator.idParamSchema, 'params'), canDelete, controller.remove);

export default router;
