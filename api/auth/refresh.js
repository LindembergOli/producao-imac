// Vercel Function: POST /api/auth/refresh
import jwt from 'jsonwebtoken';
import { prisma } from '../_lib/prisma.js';
import { withCors } from '../_lib/cors.js';
import { success, error } from '../_lib/responses.js';

async function handler(req, res) {
    if (req.method !== 'POST') {
        return error(res, {
            message: 'Method not allowed',
            statusCode: 405,
            code: 'METHOD_NOT_ALLOWED',
        });
    }

    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return error(res, {
                message: 'Refresh token é obrigatório',
                statusCode: 400,
                code: 'VALIDATION_ERROR',
            });
        }

        // Verificar token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret');
        } catch (err) {
            return error(res, {
                message: 'Refresh token inválido ou expirado',
                statusCode: 401,
                code: 'INVALID_TOKEN',
            });
        }

        // Buscar usuário
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!user) {
            return error(res, {
                message: 'Usuário não encontrado',
                statusCode: 404,
                code: 'USER_NOT_FOUND',
            });
        }

        // Gerar novos tokens
        const newAccessToken = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'dev-secret',
            { expiresIn: '15m' }
        );

        const newRefreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
            { expiresIn: '7d' }
        );

        return success(res, {
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            },
            message: 'Tokens atualizados com sucesso',
        });
    } catch (err) {
        console.error('Refresh error:', err);
        return error(res, {
            message: 'Erro ao atualizar token',
            statusCode: 500,
            code: 'INTERNAL_ERROR',
        });
    }
}

export default withCors(handler);
