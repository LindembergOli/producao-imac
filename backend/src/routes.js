/**
 * ROTAS PRINCIPAIS DA API
 * 
 * Centraliza e organiza todas as rotas dos módulos da aplicação.
 * Cada módulo é montado em seu próprio prefixo de rota.
 * 
 * Estrutura de Rotas:
 * - /api/auth - Autenticação (login, register, refresh, logout)
 * - /api/employees - Funcionários
 * - /api/products - Produtos
 * - /api/production - Velocidade de produção
 * - /api/losses - Perdas de produção
 * - /api/errors - Erros de produção
 * - /api/maintenance - Manutenção de máquinas
 * - /api/absenteeism - Absenteísmo
 */

import { Router } from 'express';

// Importar rotas dos módulos
import authRoutes from './modules/auth/routes.js';
import employeeRoutes from './modules/employees/routes.js';
import productRoutes from './modules/products/routes.js';
import productionRoutes from './modules/production/routes.js';
import lossRoutes from './modules/losses/routes.js';
import errorRoutes from './modules/errors/routes.js';
import maintenanceRoutes from './modules/maintenance/routes.js';
import absenteeismRoutes from './modules/absenteeism/routes.js';
import machineRoutes from './modules/machines/routes.js';
import userRoutes from './modules/users/routes.js';

const router = Router();

// Montar rotas dos módulos
router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/products', productRoutes);
router.use('/production', productionRoutes);
router.use('/losses', lossRoutes);
router.use('/errors', errorRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/absenteeism', absenteeismRoutes);
router.use('/machines', machineRoutes);
router.use('/users', userRoutes);

export default router;
