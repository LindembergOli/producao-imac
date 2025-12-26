/**
 * MÓDULO: Usuários
 * CONTROLLER - Lógica de Negócios
 */

import prisma from '../../config/database.js';
import logger from '../../utils/logger.js';
import { logAudit } from '../../middlewares/audit.js';
import bcrypt from 'bcrypt';

/**
 * Lista todos os usuários
 * GET /api/users
 */
export const getAll = async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        res.json({
            success: true,
            data: users,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Busca um usuário por ID
 * GET /api/users/:id
 */
export const getById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = parseInt(id);

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'Usuário não encontrado.',
                },
            });
        }

        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Atualiza um usuário
 * PUT /api/users/:id
 */
export const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = parseInt(id);
        const { name, email, role, password } = req.body;

        // Verificar se usuário existe
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'Usuário não encontrado.',
                },
            });
        }

        // Verificar se email já está em uso por outro usuário
        if (email && email !== existingUser.email) {
            const emailExists = await prisma.user.findUnique({
                where: { email },
            });

            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'EMAIL_IN_USE',
                        message: 'Este email já está em uso por outro usuário.',
                    },
                });
            }
        }

        // Preparar dados para atualização
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (role) updateData.role = role;

        // Apenas atualizar senha se foi fornecida
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });

        logger.info(`Usuário atualizado: ${updatedUser.email} por ${req.user.email}`);

        // Auditar atualização (sem incluir senha)
        const auditDetails = { name, email, role };
        if (password) auditDetails.passwordChanged = true;

        await logAudit({
            userId: req.user?.id,
            action: 'UPDATE_RECORD',
            entity: 'User',
            entityId: userId,
            details: auditDetails,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        res.json({
            success: true,
            data: updatedUser,
            message: 'Usuário atualizado com sucesso.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Remove um usuário
 * DELETE /api/users/:id
 */
export const remove = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = parseInt(id);

        // Impedir auto-deleção
        if (req.user.id === userId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'SELF_DELETION',
                    message: 'Você não pode excluir sua própria conta.',
                },
            });
        }

        // Verificar se usuário existe
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'Usuário não encontrado.',
                },
            });
        }

        await prisma.user.delete({
            where: { id: userId },
        });

        logger.info(`Usuário removido: ${user.email} por ${req.user.email}`);

        // Auditar deleção
        await logAudit({
            userId: req.user?.id,
            action: 'DELETE_RECORD',
            entity: 'User',
            entityId: userId,
            details: {
                name: user.name,
                email: user.email,
                role: user.role,
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        res.json({
            success: true,
            message: 'Usuário removido com sucesso.',
        });
    } catch (error) {
        next(error);
    }
};
