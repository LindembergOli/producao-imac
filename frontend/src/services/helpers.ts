/**
 * Helper para extrair dados de respostas da API
 * Suporta tanto respostas paginadas quanto arrays diretos
 */

export function extractData(response: any): any {
    // Caso 1: response.data é um array diretamente
    if (Array.isArray(response.data)) {
        return response.data;
    }

    // Caso 2: response.data.data existe (padrão da API)
    if (response.data && response.data.data !== undefined) {
        if (Array.isArray(response.data.data)) {
            return response.data.data;
        }
        // Se response.data.data não é um array, mas existe, retorna-o
        return response.data.data;
    }

    // Caso 3: response é um array diretamente
    if (Array.isArray(response)) {
        return response;
    }

    // Caso 4: retornar response.data como fallback, ou o próprio response se response.data não existir
    return response.data || response;
}
