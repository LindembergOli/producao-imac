/**
 * MÓDULO: Usuários
 * CONTROLLER - Lógica de Negócios
 */

import prisma from '../../config/database.js';
import logger from '../../utils/logger.js';

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

        res.json({
            success: true,
            message: 'Usuário removido com sucesso.',
        });
    } catch (error) {
        next(error);
    }
};
