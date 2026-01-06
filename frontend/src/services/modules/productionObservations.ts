/**
 * SERVICE: Observações de Produção
 * 
 * Responsável pela comunicação com a API de observações de produção.
 * Implementa todas as operações CRUD.
 */

import api from '../api';
import type { ProductionObservationRecord } from '../../types';

/**
 * Service para gerenciar observações de produção
 */
export const productionObservationsService = {
    /**
     * Buscar todas as observações
     * @returns Promise com array de observações
     */
    getAll: () =>
        api.get('/production-observations')
            .then(res => res.data.data.data),

    /**
     * Buscar observação por ID
     * @param id - ID da observação
     * @returns Promise com dados da observação
     */
    getById: (id: number) =>
        api.get<{ data: ProductionObservationRecord }>(`/production-observations/${id}`)
            .then(res => res.data.data),

    /**
     * Criar nova observação
     * @param data - Dados da observação (sem ID)
     * @returns Promise com observação criada
     */
    create: (data: Omit<ProductionObservationRecord, 'id'>) =>
        api.post<{ data: ProductionObservationRecord }>('/production-observations', data)
            .then(res => res.data.data),

    /**
     * Atualizar observação existente
     * @param id - ID da observação
     * @param data - Dados para atualizar (parcial)
     * @returns Promise com observação atualizada
     */
    update: (id: number, data: Partial<Omit<ProductionObservationRecord, 'id'>>) =>
        api.put<{ data: ProductionObservationRecord }>(`/production-observations/${id}`, data)
            .then(res => res.data.data),

    /**
     * Deletar observação
     * @param id - ID da observação
     * @returns Promise void
     */
    delete: (id: number) =>
        api.delete(`/production-observations/${id}`)
            .then(res => res.data)
};
