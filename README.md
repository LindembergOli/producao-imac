# Sistema de Controle de Produção - IMAC Congelados

## 📋 Visão Geral do Sistema

O **Sistema IMAC Congelados** é uma aplicação desenvolvida para controlar e monitorar a produção industrial de uma fábrica de alimentos congelados. O sistema permite rastrear velocidade de produção, perdas, erros, manutenções e absenteísmo em tempo real.

### Principais Funcionalidades

- 📊 **Dashboard Executivo** - Visão geral de KPIs e métricas
- ⚡ **Velocidade de Produção** - Acompanhamento de metas mensais
- 📉 **Controle de Perdas** - Registro de perdas de materiais
- ⚠️ **Gestão de Erros** - Rastreamento de erros de produção
- 🔧 **Manutenção** - Controle de ordens de manutenção
- 👥 **Absenteísmo** - Monitoramento de ausências
- 📦 **Cadastros** - Funcionários, Produtos, Insumos, Máquinas
- 👤 **Gestão de Usuários** - Controle de acesso com 4 níveis

### Setores Atendidos

- 🍰 Confeitaria
- 🥖 Pães
- 🥟 Salgados
- 🧀 Pão de Queijo
- 📦 Embaladora

### ⚡ Performance

O frontend foi otimizado para máxima performance:
- **Bundle inicial**: 250 KB (gzipped: 80 KB)
- **Code-splitting**: Páginas carregadas sob demanda
- **Dynamic imports**: Bibliotecas de exportação (XLSX, PDF) carregadas apenas quando necessário
- **Memoização**: Componentes otimizados para evitar re-renderizações
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 2.5s

---

## 🏗️ Arquitetura do Sistema

O sistema adota a **Arquitetura Minimalista Profissional (AMP)** com separação clara de responsabilidades:

```
┌─────────────────────────────────────────────────────────┐
│                    USUÁRIO                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              FRONTEND (React + TypeScript)              │
│  - Interface responsiva                                 │
│  - Dark mode                                            │
│  - Gráficos interativos                                 │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS/API REST
                     ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND (Node.js + Express)                │
│  - API RESTful                                          │
│  - Autenticação JWT                                     │
│  - Validação Zod                                        │
│  - Logs Winston                                         │
└────────────────────┬────────────────────────────────────┘
                     │ Prisma ORM
                     ▼
┌─────────────────────────────────────────────────────────┐
│              BANCO DE DADOS (PostgreSQL)                │
│  - 11 tabelas principais                                │
│  - Campos de auditoria                                  │
│  - Integridade referencial                              │
└─────────────────────────────────────────────────────────┘
```

### Estrutura de Pastas

```
imac-congelados/
├── backend/              # API Node.js
│   ├── src/
│   │   ├── config/       # Configurações (env, security)
│   │   ├── middlewares/  # Auth, sanitize, validate
│   │   ├── modules/      # Módulos de negócio (10 módulos)
│   │   ├── utils/        # Helpers, logger
│   │   ├── routes.js     # Rotas centralizadas
│   │   ├── app.js        # Configuração Express
│   │   └── server.js     # Entry point
│   ├── prisma/           # Schema e migrações
│
├── frontend/             # React App
│   ├── src/
│   │   ├── components/   # Componentes reutilizáveis
│   │   ├── pages/        # Páginas da aplicação
│   │   ├── services/     # Comunicação com API
│   │   ├── contexts/     # Estado global (Auth, Toast)
│   │   ├── hooks/        # Custom hooks
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Utilitários
│
├── infra/                # Infraestrutura
│   ├── docker/           # Docker Compose
│   └── scripts/          # Scripts auxiliares
│
└── docs/                 # Documentação
    ├── ARQUITETURA.md
    ├── BACKEND.md
    ├── CONTRIBUTING.md
    ├── DATABASE_GUIDE.md
    ├── DATA_GOVERNANCE.md
    ├── DEPLOYMENT.md
    ├── DEVELOPMENT.md
    ├── FRONTEND.md
    ├── SECURITY.md
    └── TROUBLESHOOTING.md
```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **PostgreSQL** 15+ ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/))

### Passo 1: Clonar o Repositório

```bash
git clone https://github.com/LindembergOli/PROD-IMAC.git
cd PROD-IMAC
```

### Passo 2: Instalar Dependências

```bash
# Instalar dependências da raiz, backend e frontend
npm run setup
```

### Passo 3: Configurar Variáveis de Ambiente

#### Backend (.env)

Copie o arquivo de exemplo e configure:

```bash
cd backend
cp .env.example .env
```

Edite o arquivo `.env`:

```env
# Banco de Dados
DATABASE_URL="postgresql://usuario:senha@localhost:5432/imac_congelados"

# JWT Secrets (GERE VALORES ÚNICOS E FORTES!)
JWT_SECRET="sua_chave_secreta_muito_forte_min_32_caracteres"
JWT_REFRESH_SECRET="sua_chave_refresh_muito_forte_min_32_caracteres"

# Servidor
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000
```

**⚠️ IMPORTANTE:** Gere secrets fortes usando:

```bash
# Linux/Mac
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

#### Frontend (.env)

```bash
cd ../frontend
cp .env.example .env
```

Edite o arquivo `.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

### Passo 4: Configurar Banco de Dados

```bash
cd backend

# Executar migrações
npx prisma migrate dev

# (Opcional) Popular com dados de exemplo
npx prisma db seed
```

### Passo 5: Iniciar o Sistema

#### Opção A: Iniciar Tudo de Uma Vez (Recomendado)

```bash
# Na raiz do projeto
npm run dev
```

Isso inicia backend e frontend simultaneamente.

#### Opção B: Iniciar Separadamente

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Passo 6: Acessar o Sistema

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api
- **Prisma Studio:** `npx prisma studio` (na pasta backend)

### Credenciais Padrão

Após o seed, use:
- **Email:** admin@imac.com
- **Senha:** SenhaForte@123

**⚠️ ALTERE IMEDIATAMENTE EM PRODUÇÃO!**

---

## 🐳 Como Rodar com Docker

Docker é a forma **recomendada** para desenvolvimento e produção.

### Pré-requisitos

- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))

### Início Rápido

#### Windows

```cmd
cd infra\scripts
docker-dev.bat
```

#### Linux/Mac

```bash
cd infra/scripts
chmod +x docker-dev.sh
./docker-dev.sh
```

### Comandos Docker Úteis

```bash
# Iniciar em modo desenvolvimento
cd infra/docker
docker compose up

# Iniciar em background
docker compose up -d

# Ver logs
docker compose logs -f

# Parar containers
docker compose down

# Rebuild completo
docker compose down -v
docker compose up --build

# Acessar banco de dados
docker compose exec postgres psql -U imac_user -d imac_congelados

# Executar migrações
docker compose exec backend npx prisma migrate deploy

# Backup do banco
cd infra/scripts
./docker-backup.sh
```

### Produção com Docker

```bash
cd infra/docker
docker compose -f docker-compose.prod.yml up -d
```

**📖 Documentação Completa:** [infra/docker/README.md](infra/docker/README.md)

---

## 🔐 Segurança e Autenticação

### Sistema de Autenticação

O sistema usa **JWT (JSON Web Tokens)** com refresh tokens para autenticação segura.

#### Fluxo de Autenticação

```
1. Login → Recebe Access Token (7 dias) + Refresh Token (30 dias)
2. Requisições → Envia Access Token no header Authorization
3. Token Expira → Usa Refresh Token para renovar
4. Logout → Invalida Refresh Token
```

### Níveis de Acesso (RBAC)

| Role | Permissões |
|------|------------|
| **ADMIN** | Acesso total, incluindo gestão de usuários |
| **SUPERVISOR** | Acesso a cadastros e relatórios |
| **LIDER_PRODUCAO** | Criar/editar registros de produção |
| **ESPECTADOR** | Apenas visualização (read-only) |

### Proteções Implementadas

✅ **Autenticação e Autorização**
- JWT com refresh tokens
- Hash de senhas com bcrypt
- RBAC (Role-Based Access Control)

✅ **Proteção de Ataques**
- Helmet (headers de segurança)
- CORS restritivo
- Rate limiting (100 req/15min)
- Sanitização de inputs
- Validação rigorosa (Zod)

✅ **Boas Práticas**
- HTTPS obrigatório em produção
- Nenhuma credencial hardcoded
- Secrets em variáveis de ambiente
- Logs de segurança

### Endpoints de Autenticação

```
POST /api/auth/register    # Criar conta (apenas ADMIN)
POST /api/auth/login       # Login
POST /api/auth/refresh     # Renovar token
POST /api/auth/logout      # Logout
GET  /api/auth/me          # Dados do usuário logado
```

---

## 📊 Logs e Rastreabilidade

### Sistema de Logs

O sistema usa **Winston** para logging estruturado.

#### Níveis de Log

- `error` - Erros críticos
- `warn` - Avisos importantes
- `info` - Informações gerais
- `debug` - Detalhes de debugging (apenas dev)

#### Localização dos Logs

```
backend/logs/
├── combined.log      # Todos os logs
├── error.log         # Apenas erros
```

#### Formato dos Logs

```json
{
  "timestamp": "2024-12-18T19:30:45.123Z",
  "level": "info",
  "message": "Usuário autenticado",
  "userId": 1,
  "email": "admin@imac.com",
  "ip": "192.168.1.100"
}
```

### Como Interpretar Logs

```bash
# Ver logs em tempo real
tail -f backend/logs/combined.log

# Filtrar apenas erros
grep "error" backend/logs/combined.log

# Buscar por usuário específico
grep "userId\":1" backend/logs/combined.log
```

### Rastreamento de Erros

Cada erro é logado com:
- Stack trace completo
- Dados da requisição
- Usuário (se autenticado)
- Timestamp preciso

---

## 📁 Estrutura de Pastas Detalhada

### Backend

```
backend/src/
├── config/
│   ├── env.js           # Validação de variáveis de ambiente (Zod)
│   ├── database.js      # Configuração Prisma
│   └── security.js      # Configurações de segurança
│
├── middlewares/
│   ├── auth.js          # Autenticação JWT
│   ├── authorize.js     # Autorização RBAC
│   ├── errorHandler.js  # Tratamento de erros
│   ├── sanitize.js      # Sanitização de inputs
│   ├── validate.js      # Validação com Zod
│   └── httpsRedirect.js # Forçar HTTPS
│
├── modules/             # Cada módulo tem: controller, service, validator, routes
│   ├── auth/
│   ├── production/
│   ├── errors/
│   ├── losses/
│   ├── maintenance/
│   ├── absenteeism/
│   ├── employees/
│   ├── products/
│   ├── machines/
│   ├── supllies/    
│   └── users/
│
└── utils/
    ├── logger.js        # Winston logger
    ├── helpers.js       # Funções auxiliares
    ├── validators.js    # Validadores customizados
    └── responses.js     # Respostas padronizadas
```

### Frontend

```
frontend/src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   ├── ChartContainer.tsx
│   ├── DatePickerInput.tsx
│   ├── KpiCard.tsx
│   ├── Modal.tsx
│   └── PrivateRoute.tsx
│
├── pages/
│   ├── Dashboard.tsx
│   ├── ProductionSpeed.tsx
│   ├── Losses.tsx
│   ├── Errors.tsx
│   ├── Maintenance.tsx
│   ├── Absenteeism.tsx
│   ├── Employees.tsx
│   ├── Products.tsx
│   ├── Machines.tsx
│   ├── Supllies.tsx
│   ├── Users.tsx
│   └── Login.tsx
│
├── services/
│   ├── api.ts           # Axios configurado
│   ├── authService.ts   # Autenticação
│   └── modules/         # Services por módulo
│
├── contexts/
│   ├── AuthContext.tsx  # Estado de autenticação
│   └── ToastContext.tsx # Notificações
│
└── types/
    └── index.ts         # TypeScript types
```

---

## 🛠️ Como um Novo Dev Pode Evoluir o Código

### Adicionando um Novo Módulo

#### 1. Criar Estrutura no Backend

```bash
cd backend/src/modules
mkdir novo-modulo
cd novo-modulo
```

Crie os arquivos:

**controller.js**
```javascript
import * as service from './service.js';

export const getAll = async (req, res, next) => {
    try {
        const data = await service.getAll();
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};
```

**service.js**
```javascript
import prisma from '../../config/database.js';

export const getAll = async () => {
    return await prisma.novoModelo.findMany();
};
```

**validator.js**
```javascript
import { z } from 'zod';

export const createSchema = z.object({
    campo1: z.string().min(1),
    campo2: z.number().positive()
});
```

**routes.js**
```javascript
import express from 'express';
import * as controller from './controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { createSchema } from './validator.js';

const router = express.Router();

router.get('/', authenticate, controller.getAll);
router.post('/', authenticate, validate(createSchema), controller.create);

export default router;
```

#### 2. Adicionar ao Schema Prisma

```prisma
model NovoModelo {
  id        Int      @id @default(autoincrement())
  campo1    String
  campo2    Float
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("novo_modelo")
}
```

#### 3. Registrar Rotas

Em `backend/src/routes.js`:

```javascript
import novoModuloRoutes from './modules/novo-modulo/routes.js';

// ...
app.use('/api/novo-modulo', novoModuloRoutes);
```

#### 4. Criar Service no Frontend

```typescript
// frontend/src/services/modules/novoModulo.ts
import api from '../api';

export const novoModuloService = {
    getAll: () => api.get('/novo-modulo'),
    create: (data: any) => api.post('/novo-modulo', data)
};
```

#### 5. Criar Página

```tsx
// frontend/src/pages/NovoModulo.tsx
import React, { useState, useEffect } from 'react';
import { novoModuloService } from '../services/modules/novoModulo';

const NovoModulo: React.FC = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const response = await novoModuloService.getAll();
        setData(response.data);
    };

    return (
        <div>
            <h1>Novo Módulo</h1>
            {/* Seu código aqui */}
        </div>
    );
};

export default NovoModulo;
```

---

## 📐 Padrões Adotados

### Nomenclatura

- **Arquivos:** camelCase (userController.js)
- **Componentes React:** PascalCase (UserList.tsx)
- **Funções:** camelCase (getUserById)
- **Constantes:** UPPER_SNAKE_CASE (MAX_RETRIES)
- **Tipos TS:** PascalCase (UserRole)

### Estrutura de Código

**Controllers:**
- Apenas lidam com req/res
- Delegam lógica para Services
- Usam try/catch e next(error)

**Services:**
- Contêm lógica de negócio
- Fazem acesso ao banco (Prisma)
- Lançam erros descritivos

**Validators:**
- Schemas Zod reutilizáveis
- Validação de tipos e formatos
- Mensagens de erro claras

### Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adiciona novo módulo de relatórios
fix: corrige cálculo de velocidade
docs: atualiza README com instruções
refactor: reorganiza estrutura de pastas
test: adiciona testes para auth
```

---

## ✅ Checklist de Produção

Antes de colocar em produção, verifique:

### Segurança
- [ ] Secrets fortes e únicos gerados
- [ ] HTTPS configurado
- [ ] CORS restrito ao domínio correto
- [ ] Rate limiting ativado
- [ ] Senhas padrão alteradas
- [ ] Variáveis de ambiente configuradas
- [ ] Logs de segurança ativados

### Banco de Dados
- [ ] Migrações aplicadas
- [ ] Backup automático configurado
- [ ] Índices criados
- [ ] Política de retenção definida

### Performance
- [ ] Cache configurado (se aplicável)
- [ ] Compressão de respostas ativada
- [ ] Assets minificados
- [ ] CDN configurado (se aplicável)

### Monitoramento
- [ ] Logs estruturados ativados
- [ ] Healthcheck funcionando
- [ ] Alertas configurados
- [ ] Métricas coletadas

### Documentação
- [ ] README atualizado
- [ ] API documentada
- [ ] Runbook de operações criado

---

## 📚 Documentação Adicional

- [Arquitetura Detalhada](docs/ARQUITETURA.md)
- [Guia do Backend](docs/BACKEND.md)
- [Guia do Frontend](docs/FRONTEND.md)
- [Guia do Banco de Dados](docs/DATABASE_GUIDE.md)
- [Docker - Guia Completo](infra/docker/README.md)

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request
