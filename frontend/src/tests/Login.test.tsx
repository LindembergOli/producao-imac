/**
 * Testes da Página de Login
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Login } from '../pages/Login';
import { AuthProvider } from '../contexts/AuthContext';

// Mock do authService
vi.mock('../services/authService');

describe('Login Page', () => {
    it('deve renderizar formulário de login', () => {
        render(
            <AuthProvider>
                <Login />
            </AuthProvider>
        );

        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    });

    it('deve mostrar título correto', () => {
        render(
            <AuthProvider>
                <Login />
            </AuthProvider>
        );

        expect(screen.getByText('IMAC Congelados')).toBeInTheDocument();
        expect(screen.getByText('Sistema de Controle de Produção')).toBeInTheDocument();
    });

    it('deve ter campos de input funcionais', () => {
        render(
            <AuthProvider>
                <Login />
            </AuthProvider>
        );

        const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
        const passwordInput = screen.getByLabelText(/senha/i) as HTMLInputElement;

        fireEvent.change(emailInput, { target: { value: 'teste@imac.com' } });
        fireEvent.change(passwordInput, { target: { value: 'senha123' } });

        expect(emailInput.value).toBe('teste@imac.com');
        expect(passwordInput.value).toBe('senha123');
    });
});
