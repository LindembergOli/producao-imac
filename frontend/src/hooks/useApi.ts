import { useState, useCallback } from 'react';

interface UseApiOptions<T> {
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
}

export function useApi<T = any>(
    apiFunction: (...args: any[]) => Promise<T>,
    options?: UseApiOptions<T>
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const execute = useCallback(
        async (...args: any[]) => {
            try {
                setLoading(true);
                setError(null);
                const result = await apiFunction(...args);
                setData(result);
                if (options?.onSuccess) {
                    options.onSuccess(result);
                }
                return result;
            } catch (err: any) {
                const errorMessage = err.response?.data?.message || err.message || 'Erro inesperado';
                setError(errorMessage);
                if (options?.onError) {
                    options.onError(err);
                }
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [apiFunction, options]
    );

    return {
        data,
        loading,
        error,
        execute,
        setData, // Para atualizações otimistas ou manuais
    };
}
