/**
 * SERVIÇO: Produtos
 */

import api from '../api';
import type { Product } from '../../types';


export const productsService = {
    getAll: async (): Promise<Product[]> => {
        const response = await api.get('/products');
        return response.data.data;
    },

    getById: async (id: number): Promise<Product> => {
        const response = await api.get(`/products/${id}`);
        return response.data.data;
    },

    getBySector: async (sector: string): Promise<Product[]> => {
        const response = await api.get(`/products/sector/${sector}`);
        return response.data.data;
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
