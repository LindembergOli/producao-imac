/**
 * Testes de Autenticação
 * Testa endpoints de login, registro e refresh token
 */

import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/database.js';

describe('Autenticação', () => {
    // Limpar banco de dados antes dos testes
    beforeAll(async () => {
        await prisma.user.deleteMany({});
    });

    // Fechar conexão após testes
    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('POST /api/auth/register', () => {
        it('deve registrar um novo usuário', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'teste@imac.com',
                    password: 'Senha123',
                    name: 'Usuário Teste',
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.email).toBe('teste@imac.com');
        });

        it('deve rejeitar registro com email duplicado', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'teste@imac.com',
                    password: 'Senha123',
                    name: 'Outro Usuário',
                });

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
        });

        it('deve rejeitar senha fraca', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'teste2@imac.com',
                    password: '123',
                    name: 'Usuário Teste 2',
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/auth/login', () => {
        it('deve fazer login com credenciais válidas', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'teste@imac.com',
                    password: 'Senha123',
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('accessToken');
            expect(response.body.data).toHaveProperty('refreshToken');
            expect(response.body.data.user.email).toBe('teste@imac.com');
        });

        it('deve rejeitar login com senha incorreta', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'teste@imac.com',
                    password: 'SenhaErrada',
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('deve rejeitar login com email inexistente', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'naoexiste@imac.com',
                    password: 'Senha123',
                });

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/auth/me', () => {
        let token;

        beforeAll(async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'teste@imac.com',
                    password: 'Senha123',
                });
            token = response.body.data.accessToken;
        });

        it('deve retornar dados do usuário autenticado', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.email).toBe('teste@imac.com');
        });

        it('deve rejeitar requisição sem token', async () => {
            const response = await request(app)
                .get('/api/auth/me');

            expect(response.status).toBe(401);
        });

        it('deve rejeitar token inválido', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer token_invalido');

            expect(response.status).toBe(401);
        });
    });
});
