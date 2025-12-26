# Guia de Troubleshooting - IMAC Congelados

## 🐛 Problemas Comuns e Soluções

### Banco de Dados

#### Erro: "Can't reach database server"

**Problema:** Não consegue conectar ao PostgreSQL

**Soluções:**
```bash
# 1. Verificar se PostgreSQL está rodando
sudo systemctl status postgresql  # Linux
brew services list                 # macOS
# Windows: Services → PostgreSQL

# 2. Verificar DATABASE_URL no .env
DATABASE_URL="postgresql://user:password@localhost:5432/imac_congelados"

# 3. Testar conexão
psql -U user -d imac_congelados
```

#### Erro: "Relation does not exist"

**Problema:** Tabela não existe no banco

**Solução:**
```bash
# Executar migrations
npx prisma migrate deploy

# Ou resetar banco (CUIDADO!)
npx prisma migrate reset
```

#### Erro: "Unique constraint failed"

**Problema:** Tentando inserir valor duplicado

**Solução:**
- Verificar se registro já existe
- Usar `upsert` ao invés de `create`
- Verificar validações no validator

---

### Autenticação

#### Erro: "Token inválido"

**Problema:** JWT expirado ou inválido

**Soluções:**
```javascript
// 1. Verificar JWT_SECRET no .env
JWT_SECRET="seu-secret-aqui"

// 2. Fazer login novamente
POST /api/auth/login

// 3. Verificar se token está sendo enviado
Authorization: Bearer <token>
```

#### Erro: "Usuário não autorizado"

**Problema:** Sem permissão para ação

**Solução:**
- Verificar role do usuário
- Verificar middlewares de autorização
- Admin tem acesso total

---

### Prisma

#### Erro: "Schema not in sync"

**Problema:** Schema.prisma diferente do banco

**Solução:**
```bash
# Gerar client novamente
npx prisma generate

# Ou criar nova migration
npx prisma migrate dev
```

#### Erro: "Migration failed"

**Problema:** Migration com erro

**Soluções:**
```bash
# 1. Ver status das migrations
npx prisma migrate status

# 2. Resolver migration pendente
npx prisma migrate resolve --applied "migration_name"

# 3. Ou resetar (CUIDADO!)
npx prisma migrate reset
```

---

### Performance

#### API Lenta

**Problemas comuns:**

1. **Sem paginação**
```javascript
// ❌ Ruim
const all = await prisma.model.findMany();

// ✅ Bom
const { skip, take } = paginate(page, limit);
const data = await prisma.model.findMany({ skip, take });
```

2. **Sem índices**
```prisma
// Adicionar índices no schema
@@index([campo])
@@index([campo1, campo2])
```

3. **N+1 queries**
```javascript
// ❌ Ruim
for (const item of items) {
    const related = await prisma.related.findUnique({ where: { id: item.relatedId } });
}

// ✅ Bom
const items = await prisma.model.findMany({
    include: { related: true }
});
```

---

### Logs

#### Não aparecem logs

**Soluções:**
```javascript
// 1. Verificar nível de log
logger.level = 'debug'; // development
logger.level = 'info';  // production

// 2. Verificar se está usando logger
import logger from './utils/logger.js';
logger.info('Mensagem');

// 3. Verificar arquivo de log
tail -f logs/combined.log
```

---

### Cache

#### Cache não funciona

**Soluções:**
```javascript
// 1. Verificar TTL
getCached('key', 60000, fetchFn); // 60 segundos

// 2. Invalidar cache ao atualizar
invalidateCachePattern('products:');

// 3. Verificar stats
import { getCacheStats } from './utils/cache.js';
console.log(getCacheStats());
```

---

### Paginação

#### Paginação retorna erro

**Problemas comuns:**

1. **Parâmetros inválidos**
```javascript
// Validar parâmetros
const { page, limit } = validatePaginationParams(req.query);
```

2. **Service não retorna paginação**
```javascript
// Service deve retornar
return createPaginatedResponse(data, page, limit, total);
```

---

### Docker

#### Container não inicia

**Soluções:**
```bash
# 1. Ver logs
docker-compose logs backend

# 2. Verificar .env
cat backend/.env

# 3. Rebuild
docker-compose down
docker-compose up --build
```

#### Banco não conecta no Docker

**Solução:**
```env
# Usar nome do service, não localhost
DATABASE_URL="postgresql://user:password@db:5432/imac_congelados"
```

---

### Desenvolvimento

#### Hot reload não funciona

**Soluções:**
```bash
# 1. Verificar se está usando nodemon
npm run dev

# 2. Reinstalar dependências
rm -rf node_modules
npm install

# 3. Verificar package.json
"dev": "nodemon src/server.js"
```

#### Imports não funcionam

**Problemas comuns:**

1. **Faltando .js**
```javascript
// ❌ Ruim
import service from './service';

// ✅ Bom
import service from './service.js';
```

2. **Caminho errado**
```javascript
// Verificar caminho relativo
import prisma from '../../config/database.js';
```

---

### Erros Comuns

#### "Cannot find module"

**Solução:**
```bash
# Instalar dependências
npm install

# Verificar import
import express from 'express'; // ✅
```

#### "Unexpected token"

**Solução:**
- Verificar sintaxe
- Verificar se está usando ES modules
- Verificar package.json: `"type": "module"`

#### "Port already in use"

**Solução:**
```bash
# Linux/macOS
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Ou mudar porta no .env
PORT=3001
```

---

## 🔍 Debug Avançado

### Logs de Query do Prisma

```javascript
const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

// Ver queries executadas
prisma.$on('query', (e) => {
    console.log('Query:', e.query);
    console.log('Duration:', e.duration, 'ms');
});
```

### Performance Monitor

```javascript
// Verificar requisições lentas
// Logs automáticos para requisições > 1s
```

---

## 📞 Suporte

Se o problema persistir:

1. Verificar logs: `logs/combined.log`
2. Verificar banco: `npx prisma studio`
3. Verificar migrations: `npx prisma migrate status`
4. Contatar equipe de desenvolvimento

---

## 📚 Recursos Úteis

- [Prisma Troubleshooting](https://www.prisma.io/docs/guides/database/troubleshooting)
- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
