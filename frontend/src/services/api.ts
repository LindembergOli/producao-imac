/**
 * CLIENTE HTTP BASE
 * 
 * Configuração centralizada do Axios para comunicação com a API.
 * Inclui interceptors para autenticação automática e tratamento de erros.
 */

import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Criar instância do Axios
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 segundos
});

/**
 * Interceptor de Requisição
 * Adiciona automaticamente o token de autenticação em todas as requisições
 */
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

/**
 * Interceptor de Resposta
 * Trata erros globalmente e renova token automaticamente se expirado
 */
api.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Se token expirou (401) e não é uma tentativa de refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');

                if (refreshToken) {
                    // Tentar renovar o token
                    const response = await axios.post(
                        `${api.defaults.baseURL}/auth/refresh`,
                        { refreshToken }
                    );

                    const { accessToken, refreshToken: newRefreshToken } = response.data.data;

                    // Salvar novos tokens
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', newRefreshToken);

                    // Atualizar header da requisição original
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                    // Tentar novamente a requisição original
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Se refresh falhar, fazer logout
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
