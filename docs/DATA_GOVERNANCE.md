# Governança de Dados - IMAC Congelados

**Versão:** 1.0  
**Data:** 18/12/2024  
**Status:** Ativo

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Políticas de Dados](#políticas-de-dados)
3. [Rastreabilidade](#rastreabilidade)
4. [Retenção e Exclusão](#retenção-e-exclusão)
5. [Integridade](#integridade)
6. [Acesso e Segurança](#acesso-e-segurança)
7. [Compliance](#compliance)
8. [Guia para Desenvolvedores](#guia-para-desenvolvedores)

---

## 🎯 Visão Geral

Este documento define as políticas e práticas de governança de dados do sistema IMAC Congelados, garantindo rastreabilidade, integridade e compliance com regulamentações como LGPD.

### Princípios Fundamentais

1. **Rastreabilidade Total** - Saber quem fez o quê e quando
2. **Preservação de Histórico** - Dados não são perdidos
3. **Integridade Referencial** - Relações consistentes
4. **Segurança por Design** - Proteção desde a criação
5. **Compliance Automático** - LGPD e boas práticas

---

## 📊 Políticas de Dados

### 1. Rastreabilidade

**Objetivo:** Registrar quem criou, atualizou ou deletou cada registro.

**Implementação:**
- Todos os registros têm `createdBy` e `updatedBy`
- Registros deletados têm `deletedAt` e `deletedBy`
- Logs de auditoria para ações sensíveis

**Models Cobertos:**
- Product
- Machine
- ProductionSpeed
- Loss
- Error
- Maintenance
- Absenteeism

**Exemplo:**
```javascript
{
  id: 1,
  name: "Bolo de Chocolate",
  createdBy: 5,        // Usuário que criou
  createdAt: "2024-12-18T10:00:00Z",
  updatedBy: 7,        // Último usuário que atualizou
  updatedAt: "2024-12-18T15:30:00Z"
}
```

---

## 🔍 Rastreabilidade

### Campos de Auditoria

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| `createdBy` | Int | ID do usuário que criou | Não* |
| `createdAt` | DateTime | Data/hora de criação | Sim |
| `updatedBy` | Int | ID do último usuário que atualizou | Não* |
| `updatedAt` | DateTime | Data/hora da última atualização | Sim |
| `deletedAt` | DateTime | Data/hora da exclusão (soft delete) | Não |
| `deletedBy` | Int | ID do usuário que deletou | Não |

\* Nullable para compatibilidade com registros antigos

### Preenchimento Automático

Os campos são preenchidos automaticamente pelo middleware `auditFieldsMiddleware`:

```javascript
// Criação
POST /api/products
Body: { name: "Produto" }
// Automaticamente adiciona: createdBy, updatedBy

// Atualização
PUT /api/products/1
Body: { name: "Produto Atualizado" }
// Automaticamente adiciona: updatedBy
```

### Consulta de Histórico

```javascript
// Ver quem criou
const product = await prisma.product.findUnique({
  where: { id: 1 },
  include: {
    createdByUser: true,
    updatedByUser: true
  }
});

console.log(`Criado por: ${product.createdByUser.name}`);
console.log(`Atualizado por: ${product.updatedByUser.name}`);
```

---

## 🗑️ Retenção e Exclusão

### Soft Delete

**Política:** Exclusões são lógicas (soft delete), não físicas.

**Benefícios:**
- Recuperação de dados
- Preservação de histórico
- Análise de dados deletados
- Integridade referencial mantida

**Implementação:**

```javascript
// Deletar (soft delete)
DELETE /api/products/1
// Resultado: deletedAt = now(), deletedBy = userId

// Registro ainda existe no banco
const product = await prisma.product.findUnique({
  where: { id: 1 }
});
// { id: 1, deletedAt: "2024-12-18T16:00:00Z", deletedBy: 5 }
```

### Filtro Automático

Por padrão, queries excluem registros deletados:

```javascript
// Lista apenas não-deletados
const products = await prisma.product.findMany({
  where: { deletedAt: null }
});
```

### Restauração

Administradores podem restaurar registros:

```javascript
import { restoreSoftDeleted } from './middlewares/softDelete.js';

// Restaurar
const restored = await restoreSoftDeleted('product', 1, userId);
// deletedAt = null, deletedBy = null
```

### Purga Permanente

**Política:** Dados deletados são mantidos por **90 dias** antes da purga.

**Processo:**
1. Soft delete marca registro
2. Após 90 dias, script automático purga
3. Purga é irreversível

**Script de Purga (executar mensalmente):**
```javascript
// backend/scripts/purge-deleted.js
const cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - 90);

await prisma.product.deleteMany({
  where: {
    deletedAt: {
      lt: cutoffDate
    }
  }
});
```

---

## 🔗 Integridade

### Validação Referencial

**Política:** Validar referências antes de criar/atualizar.

**Exemplo:**
```javascript
// Criar produção
POST /api/production
Body: { productId: 999 }

// Sistema valida se produto existe
const product = await prisma.product.findUnique({
  where: { id: 999, deletedAt: null }
});

if (!product) {
  throw new AppError('Produto não encontrado ou foi deletado', 400);
}
```

### Regras de Negócio

**Política:** Não permitir exclusão de registros com dependências ativas.

**Exemplo:**
```javascript
// Tentar deletar produto com produção recente
const hasRecentProduction = await prisma.productionSpeed.count({
  where: {
    productId: 1,
    deletedAt: null,
    createdAt: { gte: thirtyDaysAgo }
  }
});

if (hasRecentProduction > 0) {
  throw new AppError(
    'Não é possível deletar produto com produção nos últimos 30 dias',
    400
  );
}
```

---

## 🔒 Acesso e Segurança

### Controle de Acesso (RBAC)

| Ação | ADMIN | SUPERVISOR | LIDER_PRODUCAO | ESPECTADOR |
|------|-------|------------|----------------|------------|
| Criar | ✅ | ✅ | ✅ | ❌ |
| Ler | ✅ | ✅ | ✅ | ✅ |
| Atualizar | ✅ | ✅ | ✅ | ❌ |
| Deletar | ✅ | ✅ | ❌ | ❌ |
| Restaurar | ✅ | ❌ | ❌ | ❌ |
| Ver Deletados | ✅ | ✅ | ❌ | ❌ |

### Logs de Auditoria

Ações sensíveis são logadas na tabela `audit_logs`:

```javascript
{
  userId: 5,
  action: "DELETE",
  entity: "Product",
  entityId: 1,
  details: { name: "Bolo de Chocolate" },
  ipAddress: "192.168.1.100",
  createdAt: "2024-12-18T16:00:00Z"
}
```

---

## ⚖️ Compliance

### LGPD (Lei Geral de Proteção de Dados)

**Direito ao Esquecimento:**
- Soft delete permite "esquecer" dados temporariamente
- Purga permanente após 90 dias
- Anonimização de dados sensíveis

**Direito à Portabilidade:**
```javascript
// Exportar dados do usuário
GET /api/users/:id/export
// Retorna JSON com todos os dados
```

**Transparência:**
- Logs de quem acessou dados
- Rastreabilidade completa
- Auditoria de permissões

### Retenção de Dados

| Tipo de Dado | Período de Retenção | Após Período |
|--------------|---------------------|--------------|
| Dados de Produção | Indefinido | - |
| Dados de Usuário | Enquanto ativo | Anonimizar |
| Logs de Auditoria | 5 anos | Purgar |
| Dados Deletados | 90 dias | Purgar |

---

## 👨‍💻 Guia para Desenvolvedores

### Criando Registros

```javascript
// ✅ CORRETO - Middleware adiciona campos automaticamente
router.post('/', authenticate, auditFieldsMiddleware, async (req, res) => {
  const product = await prisma.product.create({
    data: req.body // createdBy/updatedBy já estão aqui
  });
});

// ✅ ALTERNATIVA - Adicionar manualmente
import { addAuditFields } from './middlewares/auditFields.js';

const data = addAuditFields(req.body, req.user.id, false);
const product = await prisma.product.create({ data });
```

### Atualizando Registros

```javascript
// ✅ CORRETO
router.put('/:id', authenticate, auditFieldsMiddleware, async (req, res) => {
  const product = await prisma.product.update({
    where: { id: parseInt(req.params.id) },
    data: req.body // updatedBy já está aqui
  });
});
```

### Deletando Registros

```javascript
// ✅ CORRETO - Soft delete
import { softDelete } from './middlewares/softDelete.js';

router.delete('/:id', authenticate, softDelete('product'));

// ❌ ERRADO - Delete físico
router.delete('/:id', async (req, res) => {
  await prisma.product.delete({ where: { id } }); // NÃO FAZER!
});
```

### Listando Registros

```javascript
// ✅ CORRETO - Filtrar deletados
const products = await prisma.product.findMany({
  where: { deletedAt: null }
});

// ✅ ALTERNATIVA - Helper
import { addDeletedFilter } from './middlewares/softDelete.js';

const where = addDeletedFilter({ sector: 'CONFEITARIA' });
const products = await prisma.product.findMany({ where });

// ⚠️ ADMIN - Incluir deletados
const allProducts = await prisma.product.findMany(); // Sem filtro
```

### Restaurando Registros

```javascript
// ✅ ADMIN apenas
import { restoreSoftDeleted } from './middlewares/softDelete.js';

router.post('/:id/restore', authenticate, authorize('ADMIN'), async (req, res) => {
  const restored = await restoreSoftDeleted('product', id, req.user.id);
  res.json({ success: true, data: restored });
});
```

---

## 📝 Checklist de Desenvolvimento

Ao criar/modificar funcionalidades, verificar:

- [ ] Campos de auditoria estão sendo preenchidos?
- [ ] Soft delete está sendo usado ao invés de delete físico?
- [ ] Queries filtram `deletedAt: null`?
- [ ] Validações de integridade referencial estão implementadas?
- [ ] Logs de auditoria para ações sensíveis?
- [ ] Permissões RBAC verificadas?
- [ ] Dados sensíveis estão sendo sanitizados nos logs?

---

## 🔄 Revisão e Atualização

Este documento deve ser revisado:
- **Trimestralmente** - Verificar se políticas estão sendo seguidas
- **Quando houver mudanças** - Atualizar políticas conforme necessário
- **Após auditorias** - Incorporar feedback

**Última Revisão:** 18/12/2024  
**Próxima Revisão:** 18/03/2025  
**Responsável:** Equipe de Desenvolvimento

---

**Versão:** 1.0  
**Aprovado por:** [Nome do Responsável]  
**Data de Aprovação:** 18/12/2024
