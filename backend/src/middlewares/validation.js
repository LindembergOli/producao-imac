/**
 * Middleware de Validação de Requisições
 * Usa Zod para validar body, query e params
 */

export const validate = (schema) => {
    return async (req, res, next) => {
        try {
            const validated = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });

            req.body = validated.body || req.body;
            req.query = validated.query || req.query;
            req.params = validated.params || req.params;

            next();
        } catch (error) {
            next(error);
        }
    };
};
