/**
 * SERVIÇO: Produtos
 */

import api from '../api';
import type { Product } from '../../types';

interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

// Mapeamento reverso: backend enum -> frontend display (MAIÚSCULAS)
const reverseSectorMap: Record<string, string> = {
    'CONGELADOS': 'CONGELADOS',
    'RESFRIADOS': 'RESFRIADOS',
    'TEMPEROS': 'TEMPEROS',
    'EMBALAGEM': 'EMBALAGEM',
    'EXPEDICAO': 'EXPEDIÇÃO',
    'MANUTENCAO': 'MANUTENÇÃO',
    'PAO_DE_QUEIJO': 'PÃO DE QUEIJO',
    'PAES': 'PÃES',
    'SALGADO': 'SALGADO',
    'CONFEITARIA': 'CONFEITARIA',
    'EMBALADORA': 'EMBALADORA',
};

const transformProduct = (product: any): Product => {
    return {
        ...product,
        sector: reverseSectorMap[product.sector] || product.sector,
    };
};

/**
 * Serviço de Produtos
 * Gerencia o catálogo de produtos produzidos pela fábrica.
 */
export const productsService = {
    /**
     * Lista todos os produtos cadastrados.
     * @returns {Promise<Product[]>} Lista de produtos formatados.
     */
    getAll: async (): Promise<Product[]> => {
        const response = await api.get('/products');
        // Extrai dados da resposta paginada e transforma setores
        const products = Array.isArray(response.data) ? response.data : response.data.data;
        return products.map(transformProduct);
    },

    /**
     * Busca um produto pelo ID.
     * @param {number} id - ID do produto.
     * @returns {Promise<Product>} O produto encontrado.
     */
    getById: async (id: number): Promise<Product> => {
        const response = await api.get(`/products/${id}`);
        return transformProduct(response.data.data);
    },

    /**
     * Busca produtos por setor de produção.
     * @param {string} sector - Nome do setor.
     * @returns {Promise<Product[]>} Lista de produtos do setor.
     */
    getBySector: async (sector: string): Promise<Product[]> => {
        const response = await api.get(`/products/sector/${sector}`);
        return response.data.data.map(transformProduct);
    },

    /**
     * Cria um novo produto.
     * @param {Omit<Product, 'id' | 'createdAt' | 'updatedAt'>} data - Dados do novo produto.
     * @returns {Promise<Product>} O produto criado.
     */
    create: async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
        const response = await api.post('/products', data);
        return response.data.data;
    },

    /**
     * Atualiza um produto existente.
     * @param {number} id - ID do produto.
     * @param {Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>} data - Dados a serem atualizados.
     * @returns {Promise<Product>} O produto atualizado.
     */
    update: async (id: number, data: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product> => {
        const response = await api.put(`/products/${id}`, data);
        return response.data.data;
    },

    /**
     * Remove um produto.
     * @param {number} id - ID do produto.
     * @returns {Promise<void>}
     */
    delete: async (id: number): Promise<void> => {
        await api.delete(`/products/${id}`);
    },
};
