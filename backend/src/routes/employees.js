/**
 * Rotas - Employees
 */

import express from 'express';
import { employeeController } from '../controllers/employeeController.js';
// import { authenticate } from '../middlewares/auth.js';
// import { validate } from '../middlewares/validation.js';
// import { employeeSchemas } from '../utils/validators.js';

const router = express.Router();

// Todas as rotas podem ser protegidas com authenticate middleware
// router.use(authenticate);

// GET /api/employees/stats - Estatísticas (antes de /:id para não conflitar)
router.get('/stats', employeeController.getStats);

// GET /api/employees/sector/:sector
router.get('/sector/:sector', employeeController.getBySector);

// GET /api/employees
router.get('/', employeeController.getAll);

// GET /api/employees/:id
router.get('/:id', employeeController.getById);

// POST /api/employees
router.post(
    '/',
    // validate(employeeSchemas.create),
    employeeController.create
);

// PUT /api/employees/:id
router.put(
    '/:id',
    // validate(employeeSchemas.update),
    employeeController.update
);

// DELETE /api/employees/:id
router.delete('/:id', employeeController.delete);

export default router;
