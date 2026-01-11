/**
 * MÓDULO: Autenticação
 * SERVICE - Lógica de Negócio
 * 
 * Gerencia toda a lógica de autenticação da aplicação, incluindo:
 * - Registro de novos usuários
 * - Login e geração de tokens JWT
 * - Renovação de tokens (refresh)
 * - Logout e invalidação de tokens
 * 
 * Segurança Implementada:
 * - Senhas hasheadas com bcrypt (10 rounds)
 * - Access tokens com expiração de 15 minutos
 * - Refresh tokens com expiração de 7 dias
 * - Invalidação de tokens no logout
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../../config/env.js';
import prisma from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';
import logger from '../../utils/logger.js';
import { maskSensitiveData } from '../../utils/helpers.js';
import { validateStrongPassword } from '../../utils/passwordValidator.js';
import { BusinessEvents, logAuthEvent } from '../../utils/businessLogger.js';

/**
 * Gera um Access Token JWT
 * 
 * @param {Object} user - Dados do usuário
 * @param {number} user.id - ID do usuário
 * @param {string} user.email - Email do usuário
 * @param {string} user.role - Role do usuário
 * @returns {string} Access token JWT
 * 
 * @private
 */
const generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
        },
        config.jwt.secret,
        {
            expiresIn: config.jwt.expiresIn, // 15 minutos
            issuer: 'imac-api',
            audience: 'imac-frontend',
        }
    );
};

/**
 * Gera um Refresh Token e salva no banco de dados
 * 
 * @param {number} userId - ID do usuário
 * @returns {Promise<string>} Refresh token gerado
 * 
 * @private
 */
const generateRefreshToken = async (userId) => {
    // Gerar token único
    const token = jwt.sign(
        { userId },
        config.jwt.refreshSecret,
        {
            expiresIn: config.jwt.refreshExpiresIn, // 7 dias
            issuer: 'imac-api',
        }
    );

    // Calcular data de expiração
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Salvar no banco
    await prisma.refreshToken.create({
        data: {
            token,
            userId,
            expiresAt,
        },
    });

    return token;
};

/**
 * Registra um novo usuário no sistema
 * 
 * Valida senha forte antes de criar o usuário.
 * 
 * @param {Object} data - Dados do usuário
 * @param {string} data.email - Email do usuário
 * @param {string} data.password - Senha do usuário
 * @param {string} data.name - Nome do usuário
 * @param {string} [data.role='user'] - Role do usuário (admin, supervisor, user)
 * 
 * @returns {Promise<Object>} Usuário criado (sem senha)
 * @throws {AppError} Se o email já estiver cadastrado ou senha for fraca
 */
export const register = async (data) => {
    const { email, password, name, role = 'user' } = data;

    // Validar senha forte
    const passwordValidation = validateStrongPassword(password);
    if (!passwordValidation.success) {
        throw new AppError(passwordValidation.message, 400);
    }

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new AppError('Email já cadastrado', 409);
    }

    // Hash da senha com bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário no banco
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
            role,
        },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
        },
    });

    logger.info('Novo usuário registrado', {
        userId: user.id,
        email: maskSensitiveData(user.email, 3),
        role: user.role,
    });

    return user;
};

/**
 * Realiza login do usuário
 * 
 * Implementa bloqueio de conta após 5 tentativas falhas.
 * Conta é desbloqueada automaticamente após 15 minutos.
 * 
 * @param {string} email - Email do usuário
 * @param {string} password - Senha do usuário
 * 
 * @returns {Promise<Object>} Objeto com user, accessToken e refreshToken
 * @throws {AppError} Se credenciais forem inválidas ou conta bloqueada
 */
export const login = async (email, password) => {
    // Buscar usuário por email
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        logger.warn('Tentativa de login com email inexistente', {
            email: maskSensitiveData(email, 3),
        });
        throw new AppError('Email ou senha inválidos', 401);
    }

    // Verificar se conta está bloqueada
    if (user.lockedUntil && new Date() < user.lockedUntil) {
        const minutesRemaining = Math.ceil((user.lockedUntil - new Date()) / 60000);
        logger.warn('Tentativa de login em conta bloqueada', {
            userId: user.id,
            email: maskSensitiveData(email, 3),
            minutesRemaining,
        });
        // Mensagem genérica - não revelar tempo exato ao usuário
        throw new AppError(
            'Conta temporariamente bloqueada por questões de segurança. Tente novamente mais tarde.',
            403
        );
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        // Incrementar tentativas falhas
        const failedAttempts = user.failedLoginAttempts + 1;
        const MAX_ATTEMPTS = 5;
        const LOCK_DURATION_MINUTES = 15;

        let updateData = {
            failedLoginAttempts: failedAttempts,
        };

        // Bloquear conta se atingiu limite
        if (failedAttempts >= MAX_ATTEMPTS) {
            const lockedUntil = new Date();
            lockedUntil.setMinutes(lockedUntil.getMinutes() + LOCK_DURATION_MINUTES);
            updateData.lockedUntil = lockedUntil;

            logger.warn('Conta bloqueada por tentativas excessivas', {
                userId: user.id,
                email: maskSensitiveData(email, 3),
                attempts: failedAttempts,
            });
        } else {
            logger.warn('Tentativa de login com senha inválida', {
                userId: user.id,
                email: maskSensitiveData(email, 3),
                attempts: failedAttempts,
                remainingAttempts: MAX_ATTEMPTS - failedAttempts,
            });
        }

        // Atualizar usuário
        await prisma.user.update({
            where: { id: user.id },
            data: updateData,
        });

        if (failedAttempts >= MAX_ATTEMPTS) {
            // Mensagem genérica - não revelar duração do bloqueio
            throw new AppError(
                'Conta temporariamente bloqueada por questões de segurança. Tente novamente mais tarde.',
                403
            );
        }

        // Mensagem genérica - não revelar tentativas restantes
        throw new AppError('Email ou senha inválidos', 401);
    }

    // Login bem-sucedido - resetar tentativas falhas e desbloquear
    await prisma.user.update({
        where: { id: user.id },
        data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
        },
    });

    // Gerar tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id);

    logger.info('Login bem-sucedido', {
        userId: user.id,
        email: maskSensitiveData(user.email, 3),
    });

    // Log de evento de negócio
    logAuthEvent(
        BusinessEvents.AUTH.LOGIN_SUCCESS,
        user.id,
        user.email,
        null, // requestId será adicionado pelo middleware
        { role: user.role },
        {}
    );

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
        accessToken,
        refreshToken,
    };
};

/**
 * Renova o access token usando um refresh token válido
 * 
 * @param {string} refreshToken - Refresh token
 * 
 * @returns {Promise<Object>} Novo access token e refresh token
 * @throws {AppError} Se o refresh token for inválido ou expirado
 */
export const refresh = async (refreshToken) => {
    // Buscar refresh token no banco
    const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
    });

    if (!storedToken) {
        throw new AppError('Refresh token inválido', 401);
    }

    // Verificar se token expirou
    if (new Date() > storedToken.expiresAt) {
        // Deletar token expirado
        await prisma.refreshToken.delete({
            where: { id: storedToken.id },
        });
        throw new AppError('Refresh token expirado', 401);
    }

    // Verificar assinatura do token
    try {
        jwt.verify(refreshToken, config.jwt.refreshSecret);
    } catch (error) {
        // Deletar token inválido
        await prisma.refreshToken.delete({
            where: { id: storedToken.id },
        });
        throw new AppError('Refresh token inválido', 401);
    }

    // Gerar novos tokens
    const newAccessToken = generateAccessToken(storedToken.user);
    const newRefreshToken = await generateRefreshToken(storedToken.user.id);

    // Deletar refresh token antigo
    await prisma.refreshToken.delete({
        where: { id: storedToken.id },
    });

    logger.info('Token renovado com sucesso', {
        userId: storedToken.user.id,
    });

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
    };
};

/**
 * Realiza logout invalidando o refresh token
 * 
 * @param {string} refreshToken - Refresh token a ser invalidado
 * @param {number} [userId] - ID do usuário (para log de evento)
 * @returns {Promise<void>}
 */
export const logout = async (refreshToken, userId = null) => {
    if (!refreshToken) {
        return; // Logout sem token é válido (limpar apenas no frontend)
    }

    // Deletar refresh token do banco
    await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
    });

    logger.info('Logout realizado', { token: maskSensitiveData(refreshToken, 8) });

    // Log de evento de negócio
    if (userId) {
        logAuthEvent(
            BusinessEvents.AUTH.LOGOUT,
            userId,
            null,
            null,
            {},
            {}
        );
    }
};

/**
 * Realiza logout de todos os dispositivos do usuário
 * Invalida todos os refresh tokens do usuário
 * 
 * @param {number} userId - ID do usuário
 * @returns {Promise<void>}
 */
export const logoutAll = async (userId) => {
    // Deletar todos os refresh tokens do usuário
    const result = await prisma.refreshToken.deleteMany({
        where: { userId },
    });

    logger.info('Logout de todos os dispositivos', {
        userId,
        tokensRemoved: result.count,
    });
};

/**
 * Verifica a validade de um access token
 * 
 * @param {string} token - Access token a ser verificado
 * @returns {Object} Payload do token decodificado
 * @throws {AppError} Se o token for inválido ou expirado
 */
export const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, config.jwt.secret, {
            issuer: 'imac-api',
            audience: 'imac-frontend',
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new AppError('Token expirado', 401);
        }
        throw new AppError('Token inválido', 401);
    }
};

/**
 * Busca informações do usuário pelo ID
 * 
 * @param {number} userId - ID do usuário
 * @returns {Promise<Object>} Dados do usuário (sem senha)
 * @throws {AppError} Se o usuário não for encontrado
 */
export const getUserById = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
        },
    });

    if (!user) {
        throw new AppError('Usuário não encontrado', 404);
    }

    return user;
};

/**
 * Solicita recuperação de senha
 * 
 * @param {string} email - Email do usuário
 * @returns {Promise<void>}
 */
export const forgotPassword = async (email) => {
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        // Por segurança, não informamos se o email existe ou não
        logger.info('Solicitação de recuperação para email deconhecido', { email: maskSensitiveData(email, 3) });
        return;
    }

    // Gerar token aleatório
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hora de validade

    // Salvar token no banco
    // Primeiro remove tokens antigos deste usuário
    await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
    });

    await prisma.passwordResetToken.create({
        data: {
            token,
            userId: user.id,
            expiresAt,
        },
    });

    // MOCK: Como não há serviço de email, logamos informações no logger
    // EM PRODUÇÃO: Substituir por envio real de email
    const resetLink = `${config.cors.origin}/reset-password?token=${token}`;

    // Log seguro (apenas em desenvolvimento)
    if (config.isDevelopment) {
        logger.info('Token de recuperação gerado (DEV)', {
            userId: user.id,
            email: maskSensitiveData(email, 3),
            resetLink: maskSensitiveData(resetLink, 20),
            tokenPreview: `${token.substring(0, 8)}...`,
        });
    } else {
        logger.info('Token de recuperação gerado', { userId: user.id });
    }
};

/**
 * Redefine a senha do usuário
 * 
 * Valida senha forte antes de redefinir.
 * 
 * @param {string} token - Token de recuperação
 * @param {string} newPassword - Nova senha
 * @returns {Promise<void>}
 * @throws {AppError} Se token inválido ou senha fraca
 */
export const resetPassword = async (token, newPassword) => {
    // Validar senha forte
    const passwordValidation = validateStrongPassword(newPassword);
    if (!passwordValidation.success) {
        throw new AppError(passwordValidation.message, 400);
    }

    // Buscar token no banco
    const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
    });

    if (!resetToken) {
        throw new AppError('Token inválido ou expirado', 400);
    }

    // Verificar expiração
    if (new Date() > resetToken.expiresAt) {
        await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
        throw new AppError('Token expirado', 400);
    }

    // Atualizar senha do usuário e resetar bloqueio
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: resetToken.userId },
        data: {
            password: hashedPassword,
            failedLoginAttempts: 0,
            lockedUntil: null,
        },
    });

    // Remover token
    await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
    });

    // Opcional: Invalidar sessões de login (Refresh Tokens)
    await prisma.refreshToken.deleteMany({
        where: { userId: resetToken.userId },
    });

    logger.info('Senha redefinida com sucesso', { userId: resetToken.userId });
};
