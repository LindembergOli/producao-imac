/**
 * Testes de Endpoints de Produção
 * Testa CRUD de velocidade, perdas, erros, manutenção e absenteísmo
 */

import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/database.js';

describe('Endpoints de Produção', () => {
    let token;
    let userId;

    // Setup: criar usuário e fazer login
    beforeAll(async () => {
        await prisma.user.deleteMany({});

        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'producao@imac.com',
                password: 'Senha123',
                name: 'Usuário Produção',
            });

        userId = registerResponse.body.data.id;

        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'producao@imac.com',
                password: 'Senha123',
            });

        token = loginResponse.body.data.accessToken;
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('Velocidade de Produção', () => {
        it('deve listar registros de velocidade', async () => {
            const response = await request(app)
                .get('/api/production/speed')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('deve rejeitar acesso sem autenticação', async () => {
            const response = await request(app)
                .get('/api/production/speed');

            expect(response.status).toBe(401);
        });
    });

    describe('Perdas', () => {
        it('deve listar registros de perdas', async () => {
            const response = await request(app)
                .get('/api/production/losses')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('Erros', () => {
        it('deve listar registros de erros', async () => {
            const response = await request(app)
                .get('/api/production/errors')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('Manutenção', () => {
        it('deve listar registros de manutenção', async () => {
            const response = await request(app)
                .get('/api/production/maintenance')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('Absenteísmo', () => {
        it('deve listar registros de absenteísmo', async () => {
            const response = await request(app)
                .get('/api/production/absenteeism')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });
});
