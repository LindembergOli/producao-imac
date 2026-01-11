import React, { Component, ErrorInfo, ReactNode } from 'react';
import { TriangleAlert, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary
 * Captura erros de renderização na árvore de componentes e mostra uma UI de fallback.
 */
class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-gray-100 dark:border-slate-700">
                        <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                            <TriangleAlert size={40} className="text-red-600 dark:text-red-400" />
                        </div>

                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                            Algo deu errado
                        </h1>

                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Desculpe, ocorreu um erro inesperado na aplicação.
                            Nossa equipe já foi notificada.
                        </p>

                        {/* Detalhes do erro (apenas em dev) */}
                        {import.meta.env.DEV && this.state.error && (
                            <div className="bg-gray-100 dark:bg-slate-900 p-3 rounded text-left text-xs text-red-500 mb-6 overflow-auto max-h-32 font-mono">
                                {this.state.error.toString()}
                            </div>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center justify-center w-full bg-imac-primary text-white px-6 py-3 rounded-lg hover:opacity-90 font-semibold transition-all shadow-sm"
                        >
                            <RefreshCw size={18} className="mr-2" />
                            Recarregar Página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
