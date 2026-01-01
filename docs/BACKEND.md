# Documentação do Backend

O backend é uma API RESTful construída com Node.js, Express e Prisma.

---

## Estrutura de Pastas

```
backend/
├── src/
│   ├── config/         # Configurações globais (env, db, security)
│   ├── middlewares/    # Middlewares (auth, error, validation)
│   ├── modules/        # Módulos de domínio (controllers, services, schemas)
│   │   ├── auth/
│   │   ├── employees/
│   │   ├── products/
│   │   ├── supplies/
│   │   ├── machines/
│   │   ├── production/
│   │   ├── losses/
│   │   ├── errors/
│   │   ├── maintenance/
│   │   ├── absenteeism/
│   │   └── users/
│   ├── utils/          # Utilitários gerais (logger, helpers)
│   ├── app.js          # Configuração do Express
│   └── server.js       # Ponto de entrada
├── prisma/             # Schema e migrações
└── tests/              # Testes automatizados
```

---

## Módulos Disponíveis

| Módulo | Descrição | Endpoints Principais |
|---|---|---|
| **Auth** | Autenticação e Usuários | `/auth/login`, `/auth/register`, `/auth/me` |
| **Employees** | Gestão de Funcionários | `/employees` (CRUD) |
| **Products** | Catálogo de Produtos | `/products` (CRUD) |
| **Supplies** | Gestão de Insumos | `/supplies` (CRUD) |
| **Machines** | Gestão de Máquinas | `/machines` (CRUD) |
| **Production** | Velocidade de Produção | `/production/speed` (CRUD) |
| **Losses** | Registro de Perdas | `/losses` (CRUD) |
| **Errors** | Registro de Erros | `/errors` (CRUD) |
| **Maintenance** | Ordens de Manutenção | `/maintenance` (CRUD) |
| **Absenteeism** | Controle de Absenteísmo | `/absenteeism` (CRUD) |

---

## Padrões de Código


✅ **Bom:**
```javascript
// Função auxiliar para normalizar strings
const normalize = (str) => str.trim().toLowerCase();

// Aplicar filtros aos registros
const filtered = records.filter(rec => rec.active);

// Validar dados de entrada
if (!data.name) throw new Error('Nome é obrigatório');
```

❌ **Evitar:**
```javascript
// Helper to normalize strings
// Apply filters
// Validate input data
```

### Controller

Controllers apenas lidam com requisição/resposta e delegam lógica para Services.

```javascript
export const list = async (req, res, next) => {
  try {
    const data = await service.list();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const created = await service.create(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
};
```

### Service

Services contêm a lógica de negócio e interagem com o banco de dados.

```javascript
import prisma from '../../config/database.js';

export const list = async () => {
  return await prisma.model.findMany({
    orderBy: { createdAt: 'desc' }
  });
};

export const create = async (data) => {
  // Validar regras de negócio
  if (data.quantity < 0) {
    throw new Error('Quantidade não pode ser negativa');
  }

  // Criar registro
  return await prisma.model.create({
    data
  });
};
```

### Validação (Zod)

Schemas de validação garantem que dados estejam no formato correto.

```javascript
import { z } from 'zod';

export const createSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  age: z.number().positive('Idade deve ser positiva').optional()
});

export const updateSchema = createSchema.partial();
```

### Middleware de Validação

```javascript
import { validate } from '../../middlewares/validate.js';
import { createSchema } from './validator.js';

router.post('/', 
  authenticate,           // Autenticação
  validate(createSchema), // Validação
  controller.create       // Controller
);
```

---

## Autenticação e Autorização

### JWT (JSON Web Tokens)

```javascript
import jwt from 'jsonwebtoken';

// Gerar token
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// Verificar token
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### Middleware de Autenticação

```javascript
export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};
```

### Middleware de Autorização

```javascript
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Sem permissão para esta ação' 
      });
    }
    next();
  };
};

// Uso
router.delete('/:id',
  authenticate,
  authorize('ADMIN', 'SUPERVISOR'),
  controller.delete
);
```

---

## Tratamento de Erros

### Error Handler Global

```javascript
export const errorHandler = (err, req, res, next) => {
  // Log do erro
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Resposta ao cliente
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Erro interno do servidor'
  });
};
```

### Erros Customizados

```javascript
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}
```

---

## Logging (Winston)

### Configuração

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

### Uso

```javascript
import logger from '../utils/logger.js';

// Informação
logger.info('Usuário autenticado', { userId: user.id });

// Aviso
logger.warn('Tentativa de acesso negada', { userId, resource });

// Erro
logger.error('Falha ao processar requisição', { error: err.message });
```

---

## Prisma ORM

### Schema

```prisma
model Employee {
  id        Int      @id @default(autoincrement())
  name      String
  sector    String
  role      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("employees")
}
```

### Queries Comuns

```javascript
// Listar com filtros
const employees = await prisma.employee.findMany({
  where: { sector: 'PAES' },
  orderBy: { name: 'asc' }
});

// Buscar por ID
const employee = await prisma.employee.findUnique({
  where: { id: 1 }
});

// Criar
const created = await prisma.employee.create({
  data: { name: 'João', sector: 'PAES' }
});

// Atualizar
const updated = await prisma.employee.update({
  where: { id: 1 },
  data: { role: 'Padeiro Chefe' }
});

// Deletar
await prisma.employee.delete({
  where: { id: 1 }
});
```

---

## Segurança

### Helmet (Headers de Segurança)

```javascript
import helmet from 'helmet';

app.use(helmet());
```

### CORS

```javascript
import cors from 'cors';

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
```

### Rate Limiting

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // 100 requisições por IP
});

app.use('/api/', limiter);
```

### Sanitização de Inputs

```javascript
import { sanitizeInput } from '../utils/sanitize.js';

export const create = async (req, res, next) => {
  const sanitized = sanitizeInput(req.body);
  // Processar dados sanitizados
};

---

## Variáveis de Ambiente

```env
# Banco de Dados
DATABASE_URL="postgresql://user:pass@localhost:5432/db"

# JWT
JWT_SECRET="sua_chave_secreta_forte"
JWT_REFRESH_SECRET="sua_chave_refresh_forte"

# Servidor
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000
```

---

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Produção
npm start

# Migrações
npx prisma migrate dev
npx prisma migrate deploy

# Prisma Studio
npx prisma studio

# Testes
npm test
npm run test:watch

# Lint
npm run lint
```

---

## Boas Práticas

### Código
- ✅ Comentários em português brasileiro
- ✅ Validação rigorosa de inputs (Zod)
- ✅ Tratamento de erros consistente
- ✅ Logging estruturado (Winston)
- ✅ Código modular e reutilizável

### Segurança
- ✅ Nunca commitar secrets
- ✅ Usar variáveis de ambiente
- ✅ Validar e sanitizar inputs
- ✅ Rate limiting ativo
- ✅ Headers de segurança (Helmet)

### Performance
- ✅ Índices no banco de dados
- ✅ Queries otimizadas
- ✅ Caching quando apropriado
- ✅ Paginação para listas grandes
- ✅ Compressão de respostas
