import jwt from 'jsonwebtoken';
import { prisma } from './prisma.js';
import { error } from './responses.js';

export async function verifyToken(req) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return null;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return null;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
        return decoded;
    } catch (err) {
        return null;
    }
}

export function withAuth(handler) {
    return async (req, res) => {
        const user = await verifyToken(req);

        if (!user) {
            return error(res, {
                message: 'Não autorizado',
                statusCode: 401,
                code: 'UNAUTHORIZED',
            });
        }

        // Adicionar usuário ao request para uso no handler
        req.user = user;

        return handler(req, res);
    };
}
