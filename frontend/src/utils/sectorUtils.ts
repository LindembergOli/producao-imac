import { Sector } from '../types';

/**
 * Retorna os setores visíveis baseado no papel do usuário e contexto
 * 
 * @param userRole - Papel do usuário (ADMIN, SUPERVISOR, etc.)
 * @param context - Contexto onde os setores serão exibidos
 * @returns Array de setores visíveis
 */
export const getVisibleSectors = (
    userRole: string,
    context: 'employees' | 'other'
): Sector[] => {
    const allSectors = Object.values(Sector);

    // No módulo Employees, ADMIN vê todos os setores (incluindo Manutenção)
    if (context === 'employees' && userRole === 'ADMIN') {
        return allSectors;
    }

    // Em qualquer outro caso, ocultar Manutenção
    return allSectors.filter(s => s !== Sector.MANUTENCAO);
};
