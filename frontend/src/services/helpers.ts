
/**
 * Helper para extrair dados de respostas da API
 * Suporta tanto respostas paginadas quanto arrays diretos
 */

export const extractData = <T>(response: any): T[] => {
    console.log('🔍 extractData - Input:', response);

    // Se response.data é um array, retorna diretamente
    if (Array.isArray(response.data)) {
        console.log('✅ extractData - Case 1: response.data is array');
        return response.data;
    }

    // Se response.data tem propriedade 'data' (resposta paginada)
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        console.log('✅ extractData - Case 2: response.data.data exists');
        // Verifica se data é array
        if (Array.isArray(response.data.data)) {
            console.log('✅ extractData - Case 2a: response.data.data is array, length:', response.data.data.length);
            return response.data.data;
        }
    }

    // Se response é um array direto
    if (Array.isArray(response)) {
        console.log('✅ extractData - Case 3: response is array');
        return response;
    }

    // Fallback: retorna array vazio para evitar erros
    console.warn('❌ extractData: formato de resposta inesperado', response);
    return [];
};
