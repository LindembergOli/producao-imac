// Vercel Function: POST /api/auth/login
import bcrypt from 'bcryptjs';
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
        const { email, password } = req.body;

        // Validação básica
        if (!email || !password) {
            return error(res, {
                message: 'Email e senha são obrigatórios',
                statusCode: 400,
                code: 'VALIDATION_ERROR',
            });
        }

        // Buscar usuário
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                password: true,
            },
        });

        if (!user) {
            return error(res, {
                message: 'Credenciais inválidas',
                statusCode: 401,
                code: 'INVALID_CREDENTIALS',
            });
        }

        // Verificar senha
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return error(res, {
                message: 'Credenciais inválidas',
                statusCode: 401,
                code: 'INVALID_CREDENTIALS',
            });
        }

        // Gerar tokens
        const accessToken = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'dev-secret',
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
            { expiresIn: '7d' }
        );

        // Remover senha do retorno
        const { password: _, ...userWithoutPassword } = user;

        return success(res, {
            data: {
                user: userWithoutPassword,
                accessToken,
                refreshToken,
            },
            message: 'Login realizado com sucesso',
        });
    } catch (err) {
        console.error('Login error:', err);
        return error(res, {
            message: 'Erro ao fazer login',
            statusCode: 500,
            code: 'INTERNAL_ERROR',
        });
    }
}

export default withCors(handler);
