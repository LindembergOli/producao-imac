# 🐳 Docker - Guia Rápido

## Início Rápido

### Windows
```cmd
cd infra\scripts
docker-dev.bat
```

### Linux/Mac
```bash
cd infra/scripts
chmod +x docker-dev.sh
./docker-dev.sh
```

## Acessar Aplicação

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **PostgreSQL**: localhost:5432
  - User: `imac_user`
  - Database: `imac_congelados`
  - Password: (ver `.env`)

## Comandos Essenciais

### Iniciar Serviços
```bash
# Desenvolvimento (com logs)
docker compose up

# Background (daemon)
docker compose up -d

# Rebuild e iniciar
docker compose up --build -d

# Apenas PostgreSQL
docker compose up postgres -d
```

### Parar Serviços
```bash
# Parar containers
docker compose down

# Parar e remover volumes (APAGA DADOS!)
docker compose down -v
```

### Ver Logs
```bash
# Todos os serviços
docker compose logs -f

# Serviço específico
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres

# Últimas 100 linhas
docker compose logs --tail=100 backend
```

### Status
```bash
# Ver containers rodando
docker compose ps

# Ver uso de recursos
docker stats
```

### Acessar Containers
```bash
# Backend
docker compose exec backend sh

# PostgreSQL
docker compose exec postgres psql -U imac_user -d imac_congelados

# Frontend (produção)
docker compose exec frontend sh
```

## Database

### Backup
```bash
# Linux/Mac
cd infra/scripts
./docker-backup.sh

# Manual
docker compose exec postgres pg_dump -U imac_user imac_congelados > backup.sql
```

### Restaurar
```bash
docker compose exec -T postgres psql -U imac_user imac_congelados < backup.sql
```

### Migrations
```bash
# Executar migrations
docker compose exec backend npx prisma migrate deploy

# Ver status
docker compose exec backend npx prisma migrate status

# Gerar Prisma Client
docker compose exec backend npx prisma generate

# Abrir Prisma Studio
docker compose exec backend npx prisma studio
```

## Produção

### Deploy
```bash
# Carregar variáveis de produção
export $(cat .env.production | xargs)

# Build e iniciar
docker compose -f docker-compose.prod.yml up --build -d

# Ver logs
docker compose -f docker-compose.prod.yml logs -f

# Parar
docker compose -f docker-compose.prod.yml down
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
docker compose logs backend

# Verificar health check
docker compose ps

# Rebuild do zero
docker compose down -v
docker compose up --build
```

### Database connection refused
```bash
# Verificar se PostgreSQL está rodando
docker compose ps postgres

# Verificar health
docker compose exec postgres pg_isready -U imac_user

# Ver logs do PostgreSQL
docker compose logs postgres

# Verificar variável DATABASE_URL
docker compose exec backend env | grep DATABASE_URL
```

### Migrations falham
```bash
# Ver status
docker compose exec backend npx prisma migrate status

# Reset (CUIDADO: apaga dados!)
docker compose exec backend npx prisma migrate reset

# Aplicar manualmente
docker compose exec backend npx prisma migrate deploy
```

### Limpar tudo e recomeçar
```bash
# Parar e remover tudo
docker compose down -v

# Remover imagens
docker compose down --rmi all

# Rebuild completo
docker compose up --build
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

## Variáveis de Ambiente

### Desenvolvimento (.env)
```env
POSTGRES_USER=imac_user
POSTGRES_PASSWORD=imac_password
POSTGRES_DB=imac_congelados
DATABASE_URL=postgresql://imac_user:imac_password@postgres:5432/imac_congelados?schema=public
VITE_API_URL=http://localhost:3001/api
```

### Produção (.env.production)
```env
# Use senhas fortes!
POSTGRES_PASSWORD=<SENHA_FORTE>
JWT_SECRET=<SECRET_GERADO_32_CHARS>
JWT_REFRESH_SECRET=<SECRET_GERADO_32_CHARS>
CORS_ORIGIN=https://seudominio.com
VITE_API_URL=https://seudominio.com/api
```

## Health Checks

```bash
# Backend
curl http://localhost:3001/health

# Frontend (produção)
curl http://localhost/

# PostgreSQL
docker compose exec postgres pg_isready -U imac_user
```

## Recursos Úteis

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Prisma Docker Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker)
