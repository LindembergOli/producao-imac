/**
 * Context de Autenticação
 * Gerencia estado global de autenticação da aplicação
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User } from '../services/authService';

interface AuthContextData {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    // Helpers de permissão
    canAccessCadastro: () => boolean;
    canCreate: () => boolean;
    canEdit: () => boolean;
    canDelete: () => boolean;
    isAdmin: () => boolean;
    isEspectador: () => boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Carregar usuário ao montar componente
    useEffect(() => {
        loadUser();
    }, []);

    /**
     * Carrega dados do usuário se houver token válido
     */
    const loadUser = async () => {
        try {
            if (authService.isAuthenticated()) {
                const user = await authService.getMe();
                setUser(user);
            }
        } catch (error) {
            console.error('Erro ao carregar usuário:', error);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Faz login do usuário
     */
    const login = async (email: string, password: string) => {
        try {
            setLoading(true);
            const response = await authService.login({ email, password });
            setUser(response.user);
        } catch (error) {
            setUser(null);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Registra novo usuário
     */
    const register = async (email: string, password: string, name: string) => {
        try {
            setLoading(true);
            const response = await authService.register({ email, password, name });
            setUser(response.user);
        } catch (error) {
            setUser(null);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Faz logout do usuário
     */
    const logout = async () => {
        try {
            setLoading(true);
            await authService.logout();
            setUser(null);
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    // ========================================
    // HELPERS DE PERMISSÃO
    // ========================================

    /**
     * Verifica se usuário pode acessar seção Cadastro
     * Apenas ADMIN e SUPERVISOR
     */
    const canAccessCadastro = () => {
        return user?.role === 'ADMIN' || user?.role === 'SUPERVISOR';
    };

    /**
     * Verifica se usuário pode criar registros
     * ADMIN, SUPERVISOR e LIDER_PRODUCAO
     */
    const canCreate = () => {
        return user?.role === 'ADMIN' || user?.role === 'SUPERVISOR' || user?.role === 'LIDER_PRODUCAO';
    };

    /**
     * Verifica se usuário pode editar registros
     * ADMIN, SUPERVISOR e LIDER_PRODUCAO
     */
    const canEdit = () => {
        return user?.role === 'ADMIN' || user?.role === 'SUPERVISOR' || user?.role === 'LIDER_PRODUCAO';
    };

    /**
     * Verifica se usuário pode deletar registros
     * ADMIN, SUPERVISOR e LIDER_PRODUCAO
     */
    const canDelete = () => {
        return user?.role === 'ADMIN' || user?.role === 'SUPERVISOR' || user?.role === 'LIDER_PRODUCAO';
    };

    /**
     * Verifica se usuário é ADMIN
     */
    const isAdmin = () => {
        return user?.role === 'ADMIN';
    };

    /**
     * Verifica se usuário é ESPECTADOR (read-only)
     */
    const isEspectador = () => {
        return user?.role === 'ESPECTADOR';
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isAuthenticated: !!user,
                login,
                logout,
                register,
                // Helpers de permissão
                canAccessCadastro,
                canCreate,
                canEdit,
                canDelete,
                isAdmin,
                isEspectador,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Hook para usar o contexto de autenticação
 */
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }

    return context;
};
