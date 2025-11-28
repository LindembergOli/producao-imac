# Backend — Estrutura Express + PostgreSQL + Prisma

## 📋 Resumo do Pull Request

Este PR adiciona a estrutura completa do backend Node.js com Express, PostgreSQL e Prisma ORM seguindo princípios de Clean Architecture.

## 🎯 O que foi implementado

### Estrutura de Pastas (Clean Architecture)
```
backend/
├── src/
│   ├── config/              ✅ Configurações
│   ├── middlewares/         ✅ Middlewares Express
│   ├── routes/              ✅ Rotas da API
│   ├── controllers/         ✅ Controllers
│   ├── services/            ✅ Lógica de negócio
│   ├── repositories/        ✅ Acesso a dados
│   ├── utils/               ✅ Utilitários
│   ├── app.js              ✅ Configuração Express
│   └── server.js           ✅ Entry point
├── prisma/
│   └── schema.prisma       ✅ Schema completo
├── .env.example            ✅ Variáveis documentadas
├── .gitignore              ✅ Configurado
├── package.json            ✅ Dependências
└── README.md               ✅ Documentação completa
```

### 🗄️ Schema Prisma
- **9 Models**: User, Employee, Product, Machine, ProductionSpeed, Loss, Error, Maintenance, Absenteeism
- **6 Enums**: Sector, Unit, LossType, ErrorCategory, MaintenanceStatus, AbsenceType
- Mapeamento completo das entidades do frontend

### ⚙️ Configurações
- **env.js**: Validação de variáveis de ambiente com Zod
- **database.js**: Prisma Client configurado
- **.env.example**: Todas as variáveis documentadas

### 🛡️ Middlewares de Segurança
- **errorHandler.js**: Tratamento global de erros (Prisma, Zod, JWT)
- **auth.js**: Autenticação JWT + verificação de roles
- **validation.js**: Validação de requisições com Zod
- **Helmet**: Headers de segurança
- **CORS**: Configurado para frontend
- **Rate Limiting**: 100 req/15min

### 📡 API RESTful - Exemplo Completo (Employees)
Implementação completa seguindo Clean Architecture:
- **Route** → **Controller** → **Service** → **Repository** → **Database**

#### Endpoints Implementados:
- `GET /api/employees` - Listar todos
- `GET /api/employees/:id` - Buscar por ID
- `GET /api/employees/sector/:sector` - Buscar por setor
- `GET /api/employees/stats` - Estatísticas
- `POST /api/employees` - Criar
- `PUT /api/employees/:id` - Atualizar
- `DELETE /api/employees/:id` - Deletar

### 📦 Dependências
- `express` - Framework web
- `@prisma/client` + `prisma` - ORM
- `bcryptjs` - Hash de senhas
- `jsonwebtoken` - JWT
- `zod` - Validação
- `helmet` - Segurança
- `cors` - CORS
- `express-rate-limit` - Rate limiting
- `winston` - Logging
- `nodemon` - Dev

## 🚀 Como Usar

### 1. Instalar dependências
```bash
cd backend
npm install
```

### 2. Configurar .env
```bash
cp .env.example .env
# Editar .env com suas configurações
```

### 3. Configurar PostgreSQL
```bash
# Criar banco
createdb imac_congelados

# Rodar migrações
npm run prisma:migrate
```

### 4. Executar
```bash
npm run dev
```

## 📊 Arquitetura

### Camadas
1. **Routes** - Define endpoints
2. **Controllers** - Recebe requisições, retorna respostas
3. **Services** - Lógica de negócio
4. **Repositories** - Acesso a dados (Prisma)

### Fluxo de Requisição
```
Request → Route → Middleware → Controller → Service → Repository → Database
                                    ↓
Response ← Controller ← Service ← Repository ← Database
```

## ✅ Próximos Passos

- [ ] Implementar CRUDs restantes (Products, Machines, Production, etc)
- [ ] Criar seeds com dados mock
- [ ] Implementar autenticação completa
- [ ] Adicionar paginação
- [ ] Implementar filtros e busca
- [ ] Adicionar testes unitários
- [ ] Documentar API com Swagger

## 📁 Arquivos Principais

- `backend/src/config/env.js` - Validação de env com Zod
- `backend/src/app.js` - Configuração Express
- `backend/src/server.js` - Entry point
- `backend/prisma/schema.prisma` - Schema do banco
- `backend/README.md` - Documentação completa

## 🎯 Sem Alterações no Frontend

Este PR é **apenas backend** — nenhum código do frontend foi modificado. O frontend continuará funcionando com localStorage até a integração com a API.

---

**Branch**: `sec/02-backend-structure`  
**Tipo**: Feature - Backend  
**Impacto**: Adiciona backend completo ao projeto
