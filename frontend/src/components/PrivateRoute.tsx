/**
 * Componente PrivateRoute
 * Protege rotas que requerem autenticação
 */

import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
    children: React.ReactNode;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    // Mostrar loading enquanto verifica autenticação
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-imac-primary"></div>
                    <p className="mt-4 text-slate-600 dark:text-slate-400">Carregando...</p>
                </div>
            </div>
        );
    }

    // Se não autenticado, não renderiza o conteúdo
    // (o App.tsx vai mostrar a tela de login)
    if (!isAuthenticated) {
        return null;
    }

    // Se autenticado, renderiza o conteúdo protegido
    return <>{children}</>;
};
