// Vercel Function: POST /api/auth/logout
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

    // Como usamos JWT stateless no client-side, o logout é apenas um retorno de sucesso
    // O frontend é responsável por limpar o localStorage
    return success(res, {
        message: 'Logout realizado com sucesso',
    });
}

export default withCors(handler);
