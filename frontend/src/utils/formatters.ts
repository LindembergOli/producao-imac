/**
 * Formata número no padrão brasileiro (vírgula para decimal, ponto para milhares)
 * @param value - Número a ser formatado
 * @param decimals - Número de casas decimais (padrão: 2)
 * @returns String formatada no padrão brasileiro
 * 
 * Exemplos:
 * formatBrazilianNumber(1234.56, 2) => "1.234,56"
 * formatBrazilianNumber(52.8, 1) => "52,8"
 * formatBrazilianNumber(0.4, 1) => "0,4"
 */
export const formatBrazilianNumber = (value: number, decimals: number = 2): string => {
    return value.toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};
