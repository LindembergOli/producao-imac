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

export const productsService = {
    getAll: async (): Promise<Product[]> => {
        const response = await api.get('/products');
        // Extrai dados da resposta paginada e transforma setores
        const products = Array.isArray(response.data) ? response.data : response.data.data;
        return products.map(transformProduct);
    },

    getById: async (id: number): Promise<Product> => {
        const response = await api.get(`/products/${id}`);
        return transformProduct(response.data.data);
    },

    getBySector: async (sector: string): Promise<Product[]> => {
        const response = await api.get(`/products/sector/${sector}`);
        return response.data.data.map(transformProduct);
    },

    create: async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
        const response = await api.post('/products', data);
        return response.data.data;
    },

    update: async (id: number, data: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product> => {
        const response = await api.put(`/products/${id}`, data);
        return response.data.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/products/${id}`);
    },
};
