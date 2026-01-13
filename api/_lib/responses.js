// Utilitários de resposta padronizada
export function success(res, { data = null, message = 'Success', statusCode = 200 } = {}) {
    return res.status(statusCode).json({
        success: true,
        data,
        message,
    });
}

export function error(res, { message = 'Error', statusCode = 500, code = 'INTERNAL_ERROR', details = null } = {}) {
    return res.status(statusCode).json({
        success: false,
        error: {
            code,
            message,
            details,
        },
    });
}

export default { success, error };
