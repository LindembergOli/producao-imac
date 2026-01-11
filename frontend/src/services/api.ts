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
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number };

        if (!error.response) {
            return Promise.reject(error);
        }

        // Tratamento de Rate Limiting (429) - Exponential Backoff
        // Não retentar chamadas de verificação de sessão (auth/me) ou login para evitar bloqueio prolongado
        const isAuthRequest = originalRequest.url?.includes('/auth/me') || originalRequest.url?.includes('/auth/login');

        if (error.response.status === 429 && !isAuthRequest && (originalRequest._retryCount || 0) < 2) {
            originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
            const delay = 1000 * Math.pow(2, originalRequest._retryCount - 1); // 1s, 2s

            console.warn(`[429] Rate limit atingido. Tentativa ${originalRequest._retryCount} de 2 em ${delay}ms...`);

            // Esperar antes de tentar novamente
            await new Promise(resolve => setTimeout(resolve, delay));

            // Retentar requisição
            return api(originalRequest);
        }

        // Se token expirou (401) e não é uma tentativa de refresh
        if (error.response.status === 401 && !originalRequest._retry) {
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
