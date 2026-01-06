# Backend IMAC Congelados

API RESTful para sistema de controle de produção IMAC Congelados.

## 🚀 Tecnologias

- **Node.js** + **Express**
- **PostgreSQL** + **Prisma ORM**
- **JWT** para autenticação
- **Zod** para validação
- **Helmet** para segurança
- **Winston** para logging

## 📁 Estrutura (Clean Architecture)

```
backend/
├── src/
│   ├── config/              # Configurações
│   │   ├── env.js          # Validação de env com Zod
│   │   └── database.js     # Prisma Client
│   ├── middlewares/         # Middlewares Express
│   │   ├── auth.js         # Autenticação JWT
│   │   ├── errorHandler.js # Tratamento de erros
│   │   └── validation.js   # Validação Zod
│   ├── routes/              # Rotas da API
│   ├── controllers/         # Controllers
│   ├── services/            # Lógica de negócio
│   ├── repositories/        # Acesso a dados
│   ├── utils/               # Utilitários
│   ├── app.js              # Configuração Express
│   └── server.js           # Entry point
├── prisma/
│   ├── schema.prisma       # Schema do banco
│   └── seed.js            # Seed de dados
├── .env.example
├── .gitignore
└── package.json
```

## 🛠️ Instalação

### 1. Instalar dependências

```bash
cd backend
npm install
```

### 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

Edite `.env` com suas configurações:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/imac_congelados"
JWT_SECRET=sua_chave_secreta_super_segura_aqui_min_32_caracteres
JWT_REFRESH_SECRET=sua_chave_refresh_super_segura_aqui_min_32_caracteres
```

### 3. Configurar banco de dados PostgreSQL

```bash
# Criar banco de dados
createdb imac_congelados

# Rodar migrações
npm run prisma:migrate

# (Opcional) Popular com dados de exemplo
npm run prisma:seed
```

## 🚀 Executar

### Desenvolvimento

```bash
npm run dev
```

### Produção

```bash
npm start
```

## 📡 Endpoints da API

### Health Check

- `GET /health` - Status da API

### Employees (Funcionários)

- `GET /api/employees` - Listar todos
- `GET /api/employees/:id` - Buscar por ID
- `GET /api/employees/sector/:sector` - Buscar por setor
- `GET /api/employees/stats` - Estatísticas
- `POST /api/employees` - Criar
- `PUT /api/employees/:id` - Atualizar
- `DELETE /api/employees/:id` - Deletar

### Products (Produtos)

- `GET /api/products` - Listar todos
- `POST /api/products` - Criar
- `PUT /api/products/:id` - Atualizar
- `DELETE /api/products/:id` - Deletar

### Machines (Máquinas)

- `GET /api/machines` - Listar todas
- `POST /api/machines` - Criar
- `PUT /api/machines/:id` - Atualizar
- `DELETE /api/machines/:id` - Deletar

### Production (Produção)

- `GET /api/production` - Listar registros
- `POST /api/production` - Criar
- `PUT /api/production/:id` - Atualizar
- `DELETE /api/production/:id` - Deletar

### Losses (Perdas)

- `GET /api/losses` - Listar
- `POST /api/losses` - Criar
- `PUT /api/losses/:id` - Atualizar
- `DELETE /api/losses/:id` - Deletar

### Errors (Erros)

- `GET /api/errors` - Listar
- `POST /api/errors` - Criar
- `PUT /api/errors/:id` - Atualizar
- `DELETE /api/errors/:id` - Deletar

### Maintenance (Manutenção)

- `GET /api/maintenance` - Listar
- `POST /api/maintenance` - Criar
- `PUT /api/maintenance/:id` - Atualizar
- `DELETE /api/maintenance/:id` - Deletar

### Absenteeism (Absenteísmo)

- `GET /api/absenteeism` - Listar
- `POST /api/absenteeism` - Criar
- `PUT /api/absenteeism/:id` - Atualizar
- `DELETE /api/absenteeism/:id` - Deletar

### Production Observations (Observações de Produção)

- `GET /api/production-observations` - Listar observações
- `GET /api/production-observations/:id` - Buscar por ID
- `POST /api/production-observations` - Criar
- `PUT /api/production-observations/:id` - Atualizar
- `DELETE /api/production-observations/:id` - Deletar

## 🔐 Segurança

- **Helmet** - Headers de segurança
- **CORS** - Configurado para frontend
- **Rate Limiting** - 100 requisições por 15 minutos
- **JWT** - Autenticação stateless
- **Zod** - Validação de dados
- **Prisma** - Proteção contra SQL Injection

## 📝 Scripts Disponíveis

```bash
npm run dev              # Desenvolvimento com nodemon
npm start                # Produção
npm run prisma:generate  # Gerar Prisma Client
npm run prisma:migrate   # Rodar migrações
npm run prisma:studio    # Abrir Prisma Studio
npm run prisma:seed      # Popular banco com dados
```

## 🏗️ Arquitetura

### Camadas

1. **Routes** - Define endpoints e middlewares
2. **Controllers** - Recebe requisições, chama services, retorna respostas
3. **Services** - Lógica de negócio
4. **Repositories** - Acesso a dados (Prisma)

### Fluxo de Requisição

```
Request → Route → Middleware → Controller → Service → Repository → Database
                                    ↓
Response ← Controller ← Service ← Repository ← Database
```

## 🧪 Testando a API

### Exemplo: Criar funcionário

```bash
curl -X POST http://localhost:3001/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "sector": "PAES",
    "name": "João Silva",
    "role": "Padeiro"
  }'
```

### Exemplo: Listar funcionários

```bash
curl http://localhost:3001/api/employees
```

## 📦 Dependências Principais

- `express` - Framework web
- `@prisma/client` - ORM
- `bcryptjs` - Hash de senhas
- `jsonwebtoken` - JWT
- `zod` - Validação
- `helmet` - Segurança
- `cors` - CORS
- `winston` - Logging
- `express-rate-limit` - Rate limiting

