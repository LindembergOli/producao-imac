# Guia de Contribuição - IMAC Congelados

## 🎯 Como Contribuir

Obrigado por considerar contribuir para o sistema! Este guia ajudará você a entender como o projeto está organizado e como fazer contribuições.

---

## 📋 Antes de Começar

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- Git
- Editor de código (VS Code recomendado)

### Conhecimentos Necessários

- JavaScript/Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- React (para frontend)

---

## 🏗️ Estrutura do Projeto

```
imac-congelados/
├── backend/
│   ├── src/
│   │   ├── modules/        # Módulos da aplicação
│   │   ├── middlewares/    # Middlewares
│   │   ├── utils/          # Utilitários
│   │   └── config/         # Configurações
│   └── prisma/             # Schema e migrations
└── frontend/               # Aplicação React
```

---

## 🔧 Como Adicionar um Novo Módulo

### 1. Criar Estrutura de Pastas

```bash
mkdir -p backend/src/modules/nome-modulo
cd backend/src/modules/nome-modulo
```

### 2. Criar Arquivos Básicos

**validator.js** (sempre criar primeiro):
```javascript
import { z } from 'zod';

export const createSchema = z.object({
    campo: z.string().min(1, 'Campo obrigatório'),
});

export const updateSchema = createSchema.partial();

export const idParamSchema = z.object({
    id: z.string().regex(/^\d+$/, 'ID deve ser numérico'),
});
```

**service.js**:
```javascript
import prisma from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';
import logger from '../../utils/logger.js';
import { paginate, createPaginatedResponse } from '../../utils/pagination.js';

export const getAll = async (page = 1, limit = 20) => {
    const { skip, take } = paginate(page, limit);
    
    const [data, total] = await Promise.all([
        prisma.model.findMany({
            where: { deletedAt: null },
            skip,
            take,
            orderBy: { createdAt: 'desc' }
        }),
        prisma.model.count({ where: { deletedAt: null } })
    ]);
    
    return createPaginatedResponse(data, page, limit, total);
};

export const getById = async (id) => {
    const record = await prisma.model.findUnique({
        where: { id: parseInt(id) }
    });
    
    if (!record || record.deletedAt) {
        throw new AppError('Registro não encontrado', 404);
    }
    
    return record;
};

export const create = async (data) => {
    const record = await prisma.model.create({ data });
    logger.info('Registro criado', { id: record.id });
    return record;
};

export const update = async (id, data) => {
    await getById(id);
    const record = await prisma.model.update({
        where: { id: parseInt(id) },
        data
    });
    logger.info('Registro atualizado', { id: record.id });
    return record;
};
```

**controller.js**:
```javascript
import * as service from './service.js';
import { success } from '../../utils/responses.js';
import { validatePaginationParams } from '../../utils/pagination.js';

export const getAll = async (req, res, next) => {
    try {
        const { page, limit } = validatePaginationParams(req.query);
        const result = await service.getAll(page, limit);
        return success(res, result);
    } catch (err) {
        next(err);
    }
};

export const getById = async (req, res, next) => {
    try {
        const record = await service.getById(req.params.id);
        return success(res, { data: record });
    } catch (err) {
        next(err);
    }
};

export const create = async (req, res, next) => {
    try {
        const record = await service.create(req.body);
        return success(res, {
            data: record,
            message: 'Registro criado com sucesso',
            statusCode: 201
        });
    } catch (err) {
        next(err);
    }
};

export const update = async (req, res, next) => {
    try {
        const record = await service.update(req.params.id, req.body);
        return success(res, {
            data: record,
            message: 'Registro atualizado com sucesso'
        });
    } catch (err) {
        next(err);
    }
};
```

**routes.js**:
```javascript
import { Router } from 'express';
import * as controller from './controller.js';
import * as validator from './validator.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/auth.js';
import { canCreate, canEdit, canDelete } from '../../middlewares/authorize.js';
import { auditFieldsMiddleware } from '../../middlewares/auditFields.js';
import { softDelete } from '../../middlewares/softDelete.js';

const router = Router();
router.use(authenticate);

router.get('/', controller.getAll);
router.get('/:id', validate(validator.idParamSchema, 'params'), controller.getById);
router.post('/', validate(validator.createSchema), canCreate, auditFieldsMiddleware, controller.create);
router.put('/:id', validate(validator.idParamSchema, 'params'), validate(validator.updateSchema), canEdit, auditFieldsMiddleware, controller.update);
router.delete('/:id', validate(validator.idParamSchema, 'params'), canDelete, softDelete('modelName'));

export default router;
```

### 3. Registrar Rotas no app.js

```javascript
import nomeModuloRoutes from './modules/nome-modulo/routes.js';

app.use('/api/nome-modulo', nomeModuloRoutes);
```

### 4. Adicionar ao Schema Prisma

```prisma
model NomeModelo {
  id        Int      @id @default(autoincrement())
  campo     String
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  createdBy     Int?
  createdByUser User? @relation("NomeModeloCreatedBy", fields: [createdBy], references: [id], onDelete: SetNull)
  updatedBy     Int?
  updatedByUser User? @relation("NomeModeloUpdatedBy", fields: [updatedBy], references: [id], onDelete: SetNull)
  deletedAt     DateTime?
  deletedBy     Int?
  deletedByUser User? @relation("NomeModeloDeletedBy", fields: [deletedBy], references: [id], onDelete: SetNull)
  
  @@index([deletedAt])
  @@map("nome_tabela")
}
```

### 5. Criar Migration

```bash
npx prisma migrate dev --name add_nome_modulo
```

---

## 📝 Padrões de Código

### Nomenclatura

- **Variáveis**: camelCase (`userName`, `productId`)
- **Funções**: camelCase (`getAll`, `createUser`)
- **Classes**: PascalCase (`AppError`, `UserService`)
- **Constantes**: UPPER_CASE (`MAX_RETRIES`, `API_URL`)
- **Arquivos**: kebab-case (`user-service.js`, `auth-middleware.js`)

### Comentários

- Sempre em **português**
- JSDoc para funções públicas
- Comentários inline para lógica complexa

### Imports

Ordem dos imports:
1. Node modules
2. Config
3. Utils
4. Locais

```javascript
// 1. Node modules
import express from 'express';

// 2. Config
import prisma from '../../config/database.js';

// 3. Utils
import logger from '../../utils/logger.js';

// 4. Locais
import * as service from './service.js';
```

---

## ✅ Checklist Antes de Commitar

- [ ] Código formatado (`npx prettier --write`)
- [ ] Sem erros de lint
- [ ] Validações com Zod implementadas
- [ ] Logs adicionados
- [ ] Campos de auditoria (createdBy, updatedBy)
- [ ] Soft delete implementado
- [ ] Paginação implementada
- [ ] Comentários em português
- [ ] Testado localmente

---

## 🔒 Segurança

### Sempre:
- ✅ Validar inputs com Zod
- ✅ Sanitizar dados
- ✅ Verificar permissões
- ✅ Usar prepared statements (Prisma faz automaticamente)
- ✅ Logar ações sensíveis

### Nunca:
- ❌ Commitar credenciais
- ❌ Expor dados sensíveis em logs
- ❌ Confiar em dados do cliente
- ❌ Usar SQL direto (usar Prisma)

---

## 📊 Logs

Use o logger estruturado:

```javascript
import logger from '../../utils/logger.js';

// Info
logger.info('Usuário criado', { userId: user.id });

// Warning
logger.warn('Tentativa de login falhou', { email: user.email });

// Error
logger.error('Erro ao processar', { error: err.message });
```

---

## 🎯 Boas Práticas

1. **Um commit por feature**
2. **Mensagens descritivas** em português
3. **Testar antes de commitar**
4. **Revisar código próprio**
5. **Seguir padrões do projeto**

---

## 🐛 Reportando Bugs

1. Verificar se já não foi reportado
2. Incluir passos para reproduzir
3. Incluir logs relevantes
4. Incluir versão do Node.js



