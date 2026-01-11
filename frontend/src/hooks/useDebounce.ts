import { useState, useEffect } from 'react';

/**
 * Hook personalizado para debouncing de valores.
 * Útil para atrasar buscas ou filtragens enquanto o usuário digita.
 * 
 * @param value Valor a ser observado
 * @param delay Tempo de atraso em ms (default: 500ms)
 * @returns O valor "atrasado" que só atualiza após o delay
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Configura o timer para atualizar o valor
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Limpa o timer se o valor mudar antes do delay terminar
        // (cancelando a atualização anterior)
        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}
