/**
 * Testes do AuthContext
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

// Mock do authService
vi.mock('../services/authService', () => ({
    authService: {
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        getMe: vi.fn(),
        isAuthenticated: vi.fn(),
    },
}));

// Componente de teste que usa o hook
function TestComponent() {
    const { user, isAuthenticated, loading } = useAuth();

    return (
        <div>
            <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
            <div data-testid="authenticated">{isAuthenticated ? 'yes' : 'no'}</div>
            <div data-testid="user">{user?.name || 'none'}</div>
        </div>
    );
}

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar provider sem erros', () => {
        (authService.isAuthenticated as any).mockReturnValue(false);
        (authService.getMe as any).mockResolvedValue(null);

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('deve mostrar usuário não autenticado inicialmente', async () => {
        (authService.isAuthenticated as any).mockReturnValue(false);
        (authService.getMe as any).mockResolvedValue(null);

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
        });
    });

    it('deve carregar dados do usuário se autenticado', async () => {
        const mockUser = {
            id: 1,
            email: 'teste@imac.com',
            name: 'Usuário Teste',
            role: 'admin',
        };

        (authService.isAuthenticated as any).mockReturnValue(true);
        (authService.getMe as any).mockResolvedValue(mockUser);

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('user')).toHaveTextContent('Usuário Teste');
            expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
        });
    });
});
