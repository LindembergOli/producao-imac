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
    if (value === undefined || value === null) return '-';
    return value.toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

/**
 * Formata número para rótulos de gráficos (vírgula decimal, oculta .00)
 * @param value - Número a ser formatado
 * @returns String formatada no padrão brasileiro, sem decimais se forem .00
 * 
 * Exemplos:
 * formatChartNumber(1234) => "1.234"
 * formatChartNumber(1234.56) => "1.234,56"
 * formatChartNumber(52.00) => "52"
 * formatChartNumber(52.8) => "52,8"
 */
export const formatChartNumber = (value: number): string => {
    const num = Number(value);
    if (isNaN(num)) return '0';

    // Se o número é inteiro, não mostrar decimais
    if (num % 1 === 0) {
        return num.toLocaleString('pt-BR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }

    // Se tem decimais, mostrar com 2 casas
    return num.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

/**
 * Formata texto para exibição amigável (Title Case, remove underscores)
 * Útil para exibir Enums ou chaves de banco de dados.
 * 
 * Exemplos:
 * formatText("PAO_DE_QUEIJO") => "Pão De Queijo" (com mapeamento específico se houver)
 * formatText("FALTA_INJUSTIFICADA") => "Falta Injustificada"
 */
export const formatText = (value: string): string => {
    if (!value) return '-';

    // Mapeamentos específicos para corrigir acentuação perdida
    const map: Record<string, string> = {
        'PAO_DE_QUEIJO': 'Pão de Queijo',
        'PAES': 'Pães',
        'MANUTENCAO': 'Manutenção',
        'PRODUCAO': 'Produção',
        'CONFEITARIA': 'Confeitaria',
        'SALGADO': 'Salgado',
        'EMBALADORA': 'Embaladora',
        'ATESTADO': 'Atestado',
        'FALTA_INJUSTIFICADA': 'Falta Injustificada',
        'BANCO_DE_HORAS': 'Banco de Horas',
        'OPERACIONAL': 'Operacional',
        'EQUIPAMENTO': 'Equipamento',
        'MATERIAL': 'Material',
        'QUALIDADE': 'Qualidade',
        'EM_ABERTO': 'Em Aberto',
        'FECHADO': 'Fechado'
    };

    const upperVal = String(value).toUpperCase();
    if (map[upperVal]) {
        return map[upperVal];
    }

    // Fallback genérico: Substituir _ por espaço e Capitalizar primeira letra de cada palavra
    return String(value)
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/(?:^|\s)\S/g, function (a) { return a.toUpperCase(); });
};
