# Guia de Desenvolvimento - IMAC Congelados

## 🚀 Setup do Ambiente

### 1. Clonar Repositório

```bash
git clone [url-do-repositorio]
cd imac-congelados---controle-de-produção
```

### 2. Instalar Dependências

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 3. Configurar Variáveis de Ambiente

**Backend (.env):**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/imac_congelados"
JWT_SECRET="seu-secret-aqui"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
```

### 4. Configurar Banco de Dados

```bash
cd backend

# Criar banco
createdb imac_congelados

# Executar migrations
npx prisma migrate dev

# (Opcional) Seed de dados
npx prisma db seed
```

### 5. Rodar Aplicação

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

---

## 🗄️ Banco de Dados

### Prisma

O projeto usa Prisma como ORM.

**Comandos úteis:**

```bash
# Ver banco de dados no navegador
npx prisma studio

# Formatar schema
npx prisma format

# Validar schema
npx prisma validate

# Gerar client
npx prisma generate

# Criar migration
npx prisma migrate dev --name nome_da_migration

# Aplicar migrations
npx prisma migrate deploy

# Reset banco (CUIDADO!)
npx prisma migrate reset
```

### Como Criar uma Migration

1. **Editar schema.prisma**
```prisma
model NovoModelo {
  id   Int    @id @default(autoincrement())
  nome String
  
  @@map("novo_modelo")
}
```

2. **Gerar migration**
```bash
npx prisma migrate dev --name add_novo_modelo
```

3. **Verificar migration gerada**
```bash
cat prisma/migrations/[timestamp]_add_novo_modelo/migration.sql
```

4. **Testar**
```bash
npx prisma studio
```

---

## 🔧 Ferramentas de Desenvolvimento

### ESLint

```bash
# Verificar erros
npm run lint

# Corrigir automaticamente
npm run lint:fix
```

### Prettier

```bash
# Formatar código
npm run format

# Verificar formatação
npm run format:check
```

### Logs

O sistema usa Winston para logs estruturados.

**Níveis de log:**
- `error` - Erros críticos
- `warn` - Avisos
- `info` - Informações gerais
- `debug` - Debug (apenas em dev)

**Exemplo:**
```javascript
import logger from './utils/logger.js';

logger.info('Operação realizada', { userId: 1, action: 'create' });
logger.error('Erro ao processar', { error: err.message, stack: err.stack });
```

---

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
npm test

# Testes específicos
npm test -- test-fase4.js

# Com coverage
npm test -- --coverage
```

### Criar Novos Testes

```javascript
import prisma from './src/config/database.js';

console.log('🧪 TESTE: Nome do Teste\n');

let testsPassed = 0;
let testsFailed = 0;

// Teste 1
try {
    const result = await funcao();
    if (result === esperado) {
        console.log('✅ Teste passou');
        testsPassed++;
    } else {
        console.log('❌ Teste falhou');
        testsFailed++;
    }
} catch (error) {
    console.log(`❌ Erro: ${error.message}`);
    testsFailed++;
}

// Resumo
console.log(`\nTotal: ${testsPassed + testsFailed}`);
console.log(`✅ Passaram: ${testsPassed}`);
console.log(`❌ Falharam: ${testsFailed}`);

await prisma.$disconnect();
process.exit(testsFailed > 0 ? 1 : 0);
```

---

## 🐛 Debug

### VS Code

Criar `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/backend/src/server.js",
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

### Console

```javascript
// Usar logger ao invés de console.log
logger.debug('Debug info', { data });

// Em desenvolvimento, logs aparecem no console
// Em produção, vão para arquivo
```

---

## 📦 Estrutura de Módulos

Cada módulo segue o padrão MVC:

```
modules/nome-modulo/
├── controller.js    # Lida com requisições HTTP
├── service.js       # Lógica de negócio
├── validator.js     # Validações com Zod
└── routes.js        # Definição de rotas
```

**Fluxo:**
```
Request → Routes → Middlewares → Controller → Service → Prisma → Database
```

---

## 🔐 Autenticação e Autorização

### Middleware de Autenticação

```javascript
import { authenticate } from './middlewares/auth.js';

router.get('/protected', authenticate, controller.action);
```

### Middleware de Autorização

```javascript
import { canCreate, canEdit, canDelete } from './middlewares/authorize.js';

router.post('/', authenticate, canCreate, controller.create);
router.put('/:id', authenticate, canEdit, controller.update);
router.delete('/:id', authenticate, canDelete, controller.remove);
```

### Roles

- `ADMIN` - Acesso total
- `SUPERVISOR` - Criar, editar, visualizar
- `OPERATOR` - Apenas visualizar

---

## 📊 Performance

### Paginação

Sempre usar paginação em listagens:

```javascript
import { paginate, createPaginatedResponse } from './utils/pagination.js';

export const getAll = async (page = 1, limit = 20) => {
    const { skip, take } = paginate(page, limit);
    
    const [data, total] = await Promise.all([
        prisma.model.findMany({ skip, take }),
        prisma.model.count()
    ]);
    
    return createPaginatedResponse(data, page, limit, total);
};
```

### Cache

Usar cache para dados estáticos:

```javascript
import { getCached, invalidateCachePattern } from './utils/cache.js';

export const getAll = async () => {
    return getCached('key', 60000, async () => {
        return await prisma.model.findMany();
    });
};

// Invalidar ao criar/atualizar
export const create = async (data) => {
    const record = await prisma.model.create({ data });
    invalidateCachePattern('key:');
    return record;
};
```

---

## 🎯 Próximos Passos

1. Ler [CONTRIBUTING.md](./CONTRIBUTING.md)
2. Configurar ambiente
3. Explorar código existente
4. Fazer primeira contribuição

---

## 📚 Recursos

- [Prisma Docs](https://www.prisma.io/docs)
- [Express Docs](https://expressjs.com/)
- [Zod Docs](https://zod.dev/)
- [Winston Docs](https://github.com/winstonjs/winston)
