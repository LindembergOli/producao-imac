/**
 * MÓDULO: Produtos
 * CONTROLLER - Camada de Controle
 * 
 * Gerencia as operações HTTP relacionadas aos produtos.
 * Integra com o serviço de produtos e registra auditoria.
 */

import * as productService from './service.js';
import { success } from '../../utils/responses.js';
import { validatePaginationParams } from '../../utils/pagination.js';
import { logAudit } from '../../middlewares/audit.js';
import logger from '../../utils/logger.js';

/**
 * GET /api/products
 * Lista todos os produtos com paginação.
 * 
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} req.query - Query params (page, limit).
 * @param {Object} res - Objeto de resposta Express.
 * @param {Function} next - Middleware de erro.
 * @returns {Object} JSON com lista de produtos paginada.
 */
export const getAll = async (req, res, next) => {
    try {
        const { page, limit } = validatePaginationParams(req.query);
        const result = await productService.getAll(page, limit);
        return success(res, result);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/products/:id
 * Busca um produto pelo ID.
 * 
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.params.id - ID do produto.
 * @param {Object} res - Objeto de resposta Express.
 * @param {Function} next - Middleware de erro.
 * @returns {Object} JSON com os dados do produto.
 */
export const getById = async (req, res, next) => {
    try {
        const product = await productService.getById(req.params.id);
        return success(res, { data: product });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/products/sector/:sector
 * Busca produtos por setor.
 * 
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.params.sector - Nome do setor.
 * @param {Object} res - Objeto de resposta Express.
 * @param {Function} next - Middleware de erro.
 * @returns {Object} JSON com lista de produtos do setor.
 */
export const getBySector = async (req, res, next) => {
    try {
        const products = await productService.getBySector(req.params.sector);
        return success(res, { data: products });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/products
 * Cria um novo produto.
 * 
 * @param {Object} req - Objeto de requisição Express.
 * @param {Object} req.body - Dados do produto (nome, setor, custo, etc).
 * @param {Object} res - Objeto de resposta Express.
 * @param {Function} next - Middleware de erro.
 * @returns {Object} JSON com o produto criado.
 */
export const create = async (req, res, next) => {
    try {
        const product = await productService.create(req.body);

        // Auditar criação
        await logAudit({
            userId: req.user?.id,
            action: 'CREATE_RECORD',
            entity: 'Product',
            entityId: product.id,
            details: { ...req.body },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        return success(res, {
            data: product,
            message: 'Produto criado com sucesso',
            statusCode: 201,
        });
    } catch (err) {
        logger.error('Erro ao criar produto', { error: err.message, stack: err.stack });
        next(err);
    }
};

/**
 * PUT /api/products/:id
 * Atualiza um produto existente.
 * 
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.params.id - ID do produto.
 * @param {Object} req.body - Dados a serem atualizados.
 * @param {Object} res - Objeto de resposta Express.
 * @param {Function} next - Middleware de erro.
 * @returns {Object} JSON com o produto atualizado.
 */
export const update = async (req, res, next) => {
    try {
        const product = await productService.update(req.params.id, req.body);

        // Auditar atualização
        await logAudit({
            userId: req.user?.id,
            action: 'UPDATE_RECORD',
            entity: 'Product',
            entityId: parseInt(req.params.id),
            details: { ...req.body },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        return success(res, {
            data: product,
            message: 'Produto atualizado com sucesso',
        });
    } catch (err) {
        logger.error('Erro ao atualizar produto', { error: err.message, productId: req.params.id });
        next(err);
    }
};

/**
 * DELETE /api/products/:id
 * Deleta um produto (soft delete).
 * 
 * @param {Object} req - Objeto de requisição Express.
 * @param {string} req.params.id - ID do produto.
 * @param {Object} res - Objeto de resposta Express.
 * @param {Function} next - Middleware de erro.
 * @returns {Object} JSON confirmando a deleção.
 */
export const remove = async (req, res, next) => {
    try {
        // Buscar produto antes de deletar para registrar detalhes
        const product = await productService.getById(req.params.id);

        await productService.remove(req.params.id);

        // Auditar deleção
        await logAudit({
            userId: req.user?.id,
            action: 'DELETE_RECORD',
            entity: 'Product',
            entityId: parseInt(req.params.id),
            details: {
                name: product.name,
                sector: product.sector,
                unit: product.unit,
                unitCost: product.unitCost,
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        return success(res, {
            data: null,
            message: 'Produto deletado com sucesso',
        });
    } catch (err) {
        next(err);
    }
};
