/**
 * Agregador de Rotas da API
 */

import express from 'express';
import employeeRoutes from './employees.js';
// Importar outras rotas conforme forem criadas
// import productRoutes from './products.js';
// import machineRoutes from './machines.js';
// etc...

const router = express.Router();

// Rotas públicas (sem autenticação)
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API IMAC Congelados - v1.0',
        endpoints: {
            employees: '/api/employees',
            products: '/api/products',
            machines: '/api/machines',
            production: '/api/production',
            losses: '/api/losses',
            errors: '/api/errors',
            maintenance: '/api/maintenance',
            absenteeism: '/api/absenteeism',
        },
    });
});

// Rotas de recursos
router.use('/employees', employeeRoutes);
// router.use('/products', productRoutes);
// router.use('/machines', machineRoutes);
// router.use('/production', productionRoutes);
// router.use('/losses', lossRoutes);
// router.use('/errors', errorRoutes);
// router.use('/maintenance', maintenanceRoutes);
// router.use('/absenteeism', absenteeismRoutes);

export default router;
