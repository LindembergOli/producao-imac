# Autenticação JWT — Sistema Completo

## 📋 Resumo

Sistema profissional de autenticação JWT com access tokens (15 min) e refresh tokens (7 dias), armazenamento de tokens no banco PostgreSQL, hash bcrypt para senhas e middlewares de autorização baseados em roles.

## ✅ Implementações

### 1. Schema Prisma Atualizado
**Model RefreshToken**:
```prisma
model RefreshToken {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

**Model User** atualizado:
- Relação `refreshTokens` (1:N)
- Role: `admin`, `supervisor`, `user`

### 2. Auth Service (`services/authService.js`)
**Métodos implementados**:
- `register(data)` - Registrar usuário com hash bcrypt
- `login(email, password)` - Login com geração de tokens
- `refresh(refreshToken)` - Renovar access token
- `logout(refreshToken)` - Remover token do banco
- `logoutAll(userId)` - Logout de todos os dispositivos
- `generateAccessToken(user)` - Gerar JWT access (15 min)
- `generateRefreshToken(userId)` - Gerar JWT refresh (7 dias) e salvar no banco
- `cleanExpiredTokens()` - Limpar tokens expirados

**Segurança**:
- Senhas com bcrypt (salt rounds: 10)
- Access token: 15 minutos
- Refresh token: 7 dias
- Tokens armazenados no banco com expiração
- Cascade delete ao remover usuário

### 3. Auth Controller (`controllers/authController.js`)
**Endpoints**:
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login (com rate limiting)
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/logout-all` - Logout todos (requer auth)
- `GET /api/auth/me` - Dados do usuário (requer auth)

### 4. Middlewares de Autorização (`middlewares/auth.js`)

**`authenticate`**:
- Verifica Bearer token no header Authorization
- Decodifica JWT e adiciona `req.user`
- Trata erros de token inválido/expirado

**`requireAdmin`**:
- Requer role `admin`
- Retorna 403 se não for admin

**`requireRole(['admin', 'supervisor'])`**:
- Middleware parametrizado
- Aceita array de roles permitidas
- Flexível para diferentes níveis de acesso

### 5. Rotas Configuradas (`routes/auth.js`)
```javascript
// Públicas
POST /api/auth/register
POST /api/auth/login (com loginLimiter: 5 tentativas/15min)
POST /api/auth/refresh
POST /api/auth/logout

// Protegidas (requerem authenticate)
POST /api/auth/logout-all
GET /api/auth/me
```

## 📁 Arquivos Criados/Modificados

- ✅ `backend/prisma/schema.prisma` - Model RefreshToken
- ✅ `backend/src/services/authService.js` - **NOVO**
- ✅ `backend/src/controllers/authController.js` - **NOVO**
- ✅ `backend/src/routes/auth.js` - **NOVO**
- ✅ `backend/src/middlewares/auth.js` - Adicionado `requireRole`
- ✅ `backend/src/routes/index.js` - Rota `/auth` adicionada

## 🔐 Fluxo de Autenticação

### Login
```
1. POST /api/auth/login { email, password }
2. authService verifica senha com bcrypt
3. Gera access token (15 min) + refresh token (7 dias)
4. Salva refresh token no banco
5. Retorna { user, accessToken, refreshToken }
```

### Renovação de Token
```
1. POST /api/auth/refresh { refreshToken }
2. authService busca token no banco
3. Verifica expiração e assinatura JWT
4. Gera novo access token
5. Retorna { accessToken, user }
```

### Logout
```
1. POST /api/auth/logout { refreshToken }
2. authService remove token do banco
3. Access token expira naturalmente (15 min)
```

## 🚀 Como Usar

### 1. Rodar Migração Prisma
```bash
cd backend
npm run prisma:migrate
```

### 2. Registrar Usuário
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@imac.com",
    "password": "senha123",
    "name": "Administrador",
    "role": "admin"
  }'
```

### 3. Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@imac.com",
    "password": "senha123"
  }'
```

### 4. Usar Access Token
```bash
curl http://localhost:3001/api/employees \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

### 5. Renovar Token
```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "SEU_REFRESH_TOKEN"
  }'
```

## 🛡️ Protegendo Rotas

### Exemplo 1: Requer Autenticação
```javascript
import { authenticate } from '../middlewares/auth.js';

router.get('/employees', authenticate, employeeController.getAll);
```

### Exemplo 2: Requer Admin
```javascript
import { authenticate, requireAdmin } from '../middlewares/auth.js';

router.delete('/employees/:id', authenticate, requireAdmin, employeeController.delete);
```

### Exemplo 3: Requer Roles Específicas
```javascript
import { authenticate, requireRole } from '../middlewares/auth.js';

router.post('/production', 
  authenticate, 
  requireRole(['admin', 'supervisor']), 
  productionController.create
);
```

## 📊 Estrutura de Tokens

### Access Token (JWT)
```json
{
  "id": 1,
  "email": "admin@imac.com",
  "role": "admin",
  "iat": 1701234567,
  "exp": 1701235467
}
```

### Refresh Token (JWT + Banco)
```json
{
  "userId": 1,
  "iat": 1701234567,
  "exp": 1701839367
}
```

## 🔒 Segurança

- ✅ Senhas hash com bcrypt (10 rounds)
- ✅ Access tokens curtos (15 min)
- ✅ Refresh tokens no banco (rastreáveis)
- ✅ Rate limiting no login (5 tentativas/15min)
- ✅ Cascade delete de tokens ao remover usuário
- ✅ Limpeza automática de tokens expirados
- ✅ Validação de expiração antes de usar refresh token
- ✅ Logs de login/logout

## 📝 Próximos Passos

- [ ] Criar seed para usuário admin padrão
- [ ] Implementar "Esqueci minha senha"
- [ ] Adicionar 2FA (autenticação de dois fatores)
- [ ] Implementar blacklist de tokens
- [ ] Adicionar auditoria de logins
- [ ] Criar testes automatizados

---

**Tipo**: Feature - Authentication  
**Impacto**: Sistema completo de autenticação JWT pronto para produção
