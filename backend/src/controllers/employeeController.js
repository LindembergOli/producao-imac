/**
 * Controller - Employees
 */

import { employeeService } from '../services/employeeService.js';

export const employeeController = {
    // GET /api/employees
    async getAll(req, res, next) {
        try {
            const employees = await employeeService.getAllEmployees();

            res.json({
                success: true,
                data: employees,
                count: employees.length,
            });
        } catch (error) {
            next(error);
        }
    },

    // GET /api/employees/:id
    async getById(req, res, next) {
        try {
            const employee = await employeeService.getEmployeeById(req.params.id);

            res.json({
                success: true,
                data: employee,
            });
        } catch (error) {
            next(error);
        }
    },

    // GET /api/employees/sector/:sector
    async getBySector(req, res, next) {
        try {
            const employees = await employeeService.getEmployeesBySector(req.params.sector);

            res.json({
                success: true,
                data: employees,
                count: employees.length,
            });
        } catch (error) {
            next(error);
        }
    },

    // POST /api/employees
    async create(req, res, next) {
        try {
            const employee = await employeeService.createEmployee(req.body);

            res.status(201).json({
                success: true,
                message: 'Funcionário criado com sucesso',
                data: employee,
            });
        } catch (error) {
            next(error);
        }
    },

    // PUT /api/employees/:id
    async update(req, res, next) {
        try {
            const employee = await employeeService.updateEmployee(req.params.id, req.body);

            res.json({
                success: true,
                message: 'Funcionário atualizado com sucesso',
                data: employee,
            });
        } catch (error) {
            next(error);
        }
    },

    // DELETE /api/employees/:id
    async delete(req, res, next) {
        try {
            await employeeService.deleteEmployee(req.params.id);

            res.json({
                success: true,
                message: 'Funcionário deletado com sucesso',
            });
        } catch (error) {
            next(error);
        }
    },

    // GET /api/employees/stats
    async getStats(req, res, next) {
        try {
            const stats = await employeeService.getEmployeeStats();

            res.json({
                success: true,
                data: stats,
            });
        } catch (error) {
            next(error);
        }
    },
};
