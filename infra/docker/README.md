# 🐳 Docker - Guia Completo

## 📌 Visão Geral

O sistema IMAC Congelados utiliza Docker para criar ambientes isolados e reproduzíveis. Existem **dois ambientes**:

- **Desenvolvimento** (`docker-compose.yml`) - Conecta ao PostgreSQL local do Windows
- **Produção** (`docker-compose.prod.yml`) - Ambiente completo com Nginx, SSL e banco local

## 🚀 Início Rápido - Desenvolvimento

### Pré-requisitos

1. **Docker Desktop** instalado e rodando
2. **PostgreSQL** instalado localmente no Windows (porta 5432)
3. Banco de dados `imac_congelados` criado

### Configurar Variáveis de Ambiente

Crie o arquivo `.env` em `infra/docker/`:

```env
# Banco de Dados Local (Windows)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=suaSenha
POSTGRES_DB=imac_congelados
DATABASE_URL=postgresql://postgres:suaSenha%40@host.docker.internal:5432/imac_congelados?schema=public

# Backend
NODE_ENV=development
PORT=3001
JWT_SECRET=dev_secret_key_with_minimum_32_characters_length
JWT_REFRESH_SECRET=dev_refresh_secret_key_with_minimum_32_characters_length
CORS_ORIGIN=http://localhost:3000

# Frontend
VITE_API_URL=http://localhost:3001/api
```

**⚠️ Importante:** Se sua senha tiver caracteres especiais, use URL encoding (ex: `@` vira `%40`).

### Iniciar Ambiente de Desenvolvimento

```bash
cd infra/docker
docker-compose up -d
```

### Acessar Aplicação

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **PostgreSQL**: localhost:5432 (seu banco local)

## Comandos Essenciais

### Iniciar Serviços
```bash
# Desenvolvimento (com logs)
docker-compose up

# Background (daemon)
docker-compose up -d

# Rebuild e iniciar
docker-compose up --build -d
```

### Parar Serviços
```bash
# Parar containers
docker-compose down

# Parar e remover volumes
docker-compose down -v
```

### Ver Logs
```bash
# Todos os serviços
docker-compose logs -f

# Serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend

# Últimas 100 linhas
docker-compose logs --tail=100 backend
```

### Status
```bash
# Ver containers rodando
docker-compose ps

# Ver uso de recursos (CPU/RAM)
docker stats
```

### Acessar Containers
```bash
# Backend
docker-compose exec backend sh

# Frontend
docker-compose exec frontend sh
```

### Acessar Banco de Dados Local

Como o PostgreSQL está no seu Windows (não em container), use ferramentas locais:

```bash
# Via psql (se instalado)
psql -U postgres -d imac_congelados

# Via Prisma Studio (recomendado)
cd ../../backend
npx prisma studio
```

## Database

### Backup do Banco Local

```bash
# Windows (PowerShell)
pg_dump -U postgres imac_congelados > backup_$(Get-Date -Format "yyyyMMdd_HHmmss").sql

# Linux/Mac
pg_dump -U postgres imac_congelados > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar Backup

```bash
# Criar banco (se necessário)
createdb -U postgres imac_congelados

# Restaurar
psql -U postgres -d imac_congelados < backup.sql
```

### Migrations (Prisma)

```bash
# Executar migrations no container backend
docker-compose exec backend npx prisma migrate deploy

# Ver status
docker-compose exec backend npx prisma migrate status

# Gerar Prisma Client
docker-compose exec backend npx prisma generate

# Abrir Prisma Studio (interface visual)
docker-compose exec backend npx prisma studio
```

## 🚀 Produção

### Configuração de Produção

O ambiente de produção usa:
- **Nginx** como proxy reverso (portas 80/443)
- **SSL/HTTPS** com certificados auto-assinados (dev) ou Let's Encrypt (produção real)
- **Banco de dados local** do Windows (mesmo do desenvolvimento)

### Configurar Variáveis de Produção

Crie o arquivo `production.env` em `infra/docker/`:

```env
# Banco de Dados Local (Windows)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=SuaSenhaForte123!
POSTGRES_DB=imac_congelados
DATABASE_URL=postgresql://postgres:SuaSenhaForte123%21@host.docker.internal:5432/imac_congelados?schema=public

# Secrets JWT (GERE VALORES ÚNICOS E FORTES!)
JWT_SECRET=seu_secret_aleatorio_com_minimo_32_caracteres_aqui
JWT_REFRESH_SECRET=seu_refresh_secret_aleatorio_com_minimo_32_caracteres

# Servidor
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://producaoimac.com

# Frontend
VITE_API_URL=https://producaoimac.com/api

# Domínio
DOMAIN_NAME=producaoimac.com
```

**⚠️ IMPORTANTE:** 
- Gere secrets fortes usando: `openssl rand -base64 32`
- URL encode caracteres especiais na senha (`!` vira `%21`, `@` vira `%40`)
- Nunca commite o arquivo `production.env` no Git

### Iniciar Produção (Teste Local)

```bash
cd infra/docker

# Gerar certificados SSL auto-assinados (apenas para teste local)
.\init-dev-certs.ps1

# Iniciar ambiente de produção
docker-compose -f docker-compose.prod.yml up -d

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Acessar Produção Local

1. Adicione ao arquivo `C:\Windows\System32\drivers\etc\hosts`:
   ```
   127.0.0.1 producaoimac.com
   127.0.0.1 www.producaoimac.com
   ```

2. Acesse: https://producaoimac.com
   - Aceite o aviso de certificado auto-assinado

### Parar Produção

```bash
docker-compose -f docker-compose.prod.yml down
```

## Troubleshooting

### Porta em uso
```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :5432

# Linux/Mac
lsof -i :3000
lsof -i :3001
lsof -i :5432
```

### Container não inicia
```bash
# Ver logs detalhados
docker-compose logs backend

# Verificar health check
docker-compose ps

# Rebuild do zero
docker-compose down -v
docker-compose up --build
```

### Database connection refused

**Problema:** Backend não consegue conectar ao PostgreSQL local.

**Soluções:**

1. Verificar se PostgreSQL está rodando no Windows:
   ```bash
   # Windows (Services)
   services.msc
   # Procure por "postgresql" e verifique se está "Running"
   
   # Ou via PowerShell
   Get-Service -Name postgresql*
   ```

2. Testar conexão local:
   ```bash
   psql -U postgres -d imac_congelados
   ```

3. Verificar `DATABASE_URL` no container:
   ```bash
   docker-compose exec backend env | grep DATABASE_URL
   ```

4. Verificar se a senha está URL-encoded corretamente no `.env`:
   - `@` deve ser `%40`
   - `!` deve ser `%21`
   - `#` deve ser `%23`

### Erro "JWT_SECRET deve ter no mínimo 32 caracteres"

**Solução:** Atualize o `.env` com secrets mais longos:

```env
JWT_SECRET=dev_secret_key_with_minimum_32_characters_length_fixed
JWT_REFRESH_SECRET=dev_refresh_secret_key_with_minimum_32_characters_length_fixed
```

### Migrations falham
```bash
# Ver status
docker-compose exec backend npx prisma migrate status

# Aplicar manualmente
docker-compose exec backend npx prisma migrate deploy

# Reset (CUIDADO: apaga dados!)
cd ../../backend
npx prisma migrate reset
```

### Limpar tudo e recomeçar
```bash
# Parar e remover containers
docker-compose down -v

# Remover imagens
docker-compose down --rmi all

# Rebuild completo
docker-compose up --build
```

## Limpeza

```bash
# Remover containers parados
docker container prune

# Remover imagens não utilizadas
docker image prune

# Remover volumes não utilizados
docker volume prune

# Limpeza completa (CUIDADO!)
docker system prune -a --volumes
```

## 📝 Resumo de Arquivos de Configuração

### `.env` (Desenvolvimento)
- Localização: `infra/docker/.env`
- Uso: Ambiente de desenvolvimento local
- Conecta ao PostgreSQL local do Windows
- **Não commitar no Git** (já está no .gitignore)

### `production.env` (Produção)
- Localização: `infra/docker/production.env`
- Uso: Ambiente de produção/teste
- Conecta ao PostgreSQL local do Windows
- Inclui configurações de Nginx e SSL
- **Nunca commitar no Git** (já está no .gitignore)

## Health Checks

```bash
# Backend
curl http://localhost:3001/health

# Frontend (dev)
curl http://localhost:3000

# PostgreSQL (local)
psql -U postgres -c "SELECT version();"
```

## 📚 Recursos Úteis

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Prisma Docker Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker)
- [Guia de Produção Completo](../../docs/PRODUCTION_GUIDE.md)
- [Checklist de Segurança](../../docs/SECURITY.md)
