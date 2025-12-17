# 🚀 Início Rápido - Docker

## Para Usuários Windows

### 1. Pré-requisitos
- Instalar [Docker Desktop](https://docs.docker.com/desktop/install/windows-install/)
- Reiniciar o computador após instalação

### 2. Configurar Variáveis de Ambiente
```cmd
cd "c:\Users\Particular\Documents\Projeto APP\imac-congelados---controle-de-produção"
copy .env.example .env
```

### 3. Iniciar Sistema
```cmd
cd infra\scripts
docker-dev.bat
```

### 4. Acessar Aplicação
- Frontend: http://localhost:3000
- Backend: http://localhost:3001/api

## Para Usuários Linux/Mac

### 1. Pré-requisitos
```bash
# Verificar Docker
docker --version
docker compose version
```

### 2. Configurar Variáveis de Ambiente
```bash
cd ~/Documents/Projeto\ APP/imac-congelados---controle-de-produção
cp .env.example .env
```

### 3. Iniciar Sistema
```bash
cd infra/scripts
chmod +x docker-dev.sh
./docker-dev.sh
```

### 4. Acessar Aplicação
- Frontend: http://localhost:3000
- Backend: http://localhost:3001/api

## Comandos Rápidos

### Ver Logs
```bash
cd infra/docker
docker compose logs -f
```

### Parar Sistema
```bash
cd infra/docker
docker compose down
```

### Reiniciar
```bash
cd infra/docker
docker compose restart
```

### Acessar Database
```bash
cd infra/docker
docker compose exec postgres psql -U imac_user -d imac_congelados
```

## Problemas Comuns

### Porta em Uso
Se receber erro "port is already allocated":
```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Linux/Mac
lsof -i :3000
lsof -i :3001

# Matar processo ou alterar porta no docker-compose.yml
```

### Container Não Inicia
```bash
cd infra/docker

# Ver logs
docker compose logs

# Rebuild
docker compose down -v
docker compose up --build
```

### Migrations Falham
```bash
cd infra/docker

# Ver status
docker compose exec backend npx prisma migrate status

# Aplicar manualmente
docker compose exec backend npx prisma migrate deploy
```

## Próximos Passos

1. ✅ Sistema rodando
2. 📖 Ler [README Docker](./infra/docker/README.md) para comandos avançados
3. 🔐 Alterar senhas em `.env` para produção
4. 📊 Acessar Prisma Studio: `docker compose exec backend npx prisma studio`

## Suporte

- Documentação completa: `infra/docker/README.md`
