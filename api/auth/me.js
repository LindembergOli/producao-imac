// Vercel Function: GET /api/auth/me
import { prisma } from '../_lib/prisma.js';
import { withCors } from '../_lib/cors.js';
import { withAuth } from '../_lib/auth.js';
import { success, error } from '../_lib/responses.js';

async function handler(req, res) {
    if (req.method !== 'GET') {
        return error(res, {
            message: 'Method not allowed',
            statusCode: 405,
            code: 'METHOD_NOT_ALLOWED',
        });
    }

    try {
        // req.user vem do middleware withAuth
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                // Não retornar senha
            },
        });

        if (!user) {
            return error(res, {
                message: 'Usuário não encontrado',
                statusCode: 404,
                code: 'USER_NOT_FOUND',
            });
        }

        return success(res, {
            data: user,
        });
    } catch (err) {
        console.error('Me error:', err);
        return error(res, {
            message: 'Erro ao buscar perfil',
            statusCode: 500,
            code: 'INTERNAL_ERROR',
        });
    }
}

export default withCors(withAuth(handler));
