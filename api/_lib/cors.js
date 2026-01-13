// Configuração de CORS para Vercel Functions
export const corsHeaders = {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
    'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
};

// Helper para adicionar CORS headers na resposta
export function withCors(handler) {
    return async (req, res) => {
        // Adicionar CORS headers
        Object.entries(corsHeaders).forEach(([key, value]) => {
            res.setHeader(key, value);
        });

        // Handle OPTIONS request
        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }

        return handler(req, res);
    };
}

export default withCors;
