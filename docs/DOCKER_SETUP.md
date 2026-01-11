# 🐳 Guia de Configuração Docker - IMAC Congelados

## 📋 Pré-requisitos

✅ **Docker Desktop instalado** (versão 29.1.3 ou superior)
- Se não tiver, baixe em: https://www.docker.com/products/docker-desktop

✅ **PostgreSQL instalado localmente no Windows**
- Download: https://www.postgresql.org/download/
- O Docker conecta ao seu banco local (não usa container de banco)
- Certifique-se de que o serviço PostgreSQL está rodando

## 🚀 Configuração Inicial (Primeira vez)

### Passo 1: Criar arquivo de ambiente

Na pasta `infra/docker`, crie o arquivo `.env`:

```bash
cd infra\docker
```

### Passo 2: Configurar variáveis de ambiente

Crie o arquivo `.env` com o seguinte conteúdo:

```env
# Banco de Dados Local (Windows)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=SuaSenhaAqui
POSTGRES_DB=imac_congelados
DATABASE_URL=postgresql://postgres:SuaSenhaAqui%40@host.docker.internal:5432/imac_congelados?schema=public

# Backend
NODE_ENV=development
PORT=3001
JWT_SECRET=dev_secret_key_with_minimum_32_characters_length
JWT_REFRESH_SECRET=dev_refresh_secret_key_with_minimum_32_characters_length
CORS_ORIGIN=http://localhost:3000

# Frontend
VITE_API_URL=http://localhost:3001/api
```

**⚠️ IMPORTANTE:** 
- Substitua `SuaSenhaAqui` pela senha do seu PostgreSQL local
- Se a senha tiver caracteres especiais, use URL encoding (`@` = `%40`, `!` = `%21`)

**💡 Dica:** Para gerar secrets fortes, execute no PowerShell:
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Passo 3: Verificar PostgreSQL Local

Certifique-se de que o PostgreSQL está rodando:

```powershell
# Verificar serviço
Get-Service -Name postgresql*

# Testar conexão
psql -U postgres -d imac_congelados
```

Se o banco `imac_congelados` não existir, crie:
```sql
CREATE DATABASE imac_congelados;
```

### Passo 4: Iniciar o Docker Desktop

Certifique-se de que o **Docker Desktop está rodando** (ícone da baleia na bandeja do sistema).

## 🎯 Como Usar

### Opção 1: Desenvolvimento (Recomendado para testes)

```bash
cd infra\docker
docker-compose up
```

Isso iniciará:
- ✅ Backend (porta 3001)
- ✅ Frontend (porta 3000)
- 🔗 Conecta ao PostgreSQL local do Windows

Acesse: **http://localhost:3000**

### Opção 2: Modo Background (Segundo plano)

```bash
cd infra\docker
docker-compose up -d
```

Para ver os logs:
```bash
docker-compose logs -f
```

Para parar:
```bash
docker-compose down
```

### Opção 3: Produção (Deploy real)

```bash
cd infra\docker
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Comandos Úteis

### Ver containers rodando
```bash
docker ps
```

### Parar tudo
```bash
cd infra\docker
docker-compose down
```

### Parar e limpar volumes
```bash
cd infra\docker
docker-compose down -v
```

### Reconstruir imagens (após mudanças no código)
```bash
cd infra\docker
docker-compose up --build
```

### Acessar o banco de dados LOCAL
```bash
# Via psql
psql -U postgres -d imac_congelados

# Via Prisma Studio (recomendado - interface visual)
cd ..\..\backend
npx prisma studio
```

### Ver logs de um serviço específico
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🐛 Resolução de Problemas

### Erro: "port is already allocated"
**Causa:** A porta já está em uso.

**Solução:**
```bash
# Parar os servidores locais primeiro
# Ou verificar o que está usando a porta
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

### Erro: "Cannot connect to Docker daemon"
**Causa:** Docker Desktop não está rodando.

**Solução:** Inicie o Docker Desktop e aguarde o ícone da baleia ficar verde.

### Erro: "database connection refused" ou "P1001"
**Causa:** Backend não consegue conectar ao PostgreSQL local.

**Solução:**
```powershell
# 1. Verificar se PostgreSQL está rodando
Get-Service -Name postgresql*

# 2. Iniciar se necessário
Start-Service postgresql-x64-15  # Ajuste o nome do serviço

# 3. Testar conexão
psql -U postgres -d imac_congelados

# 4. Verificar senha no .env (deve estar URL-encoded)
```

### Erro: "JWT_SECRET deve ter no mínimo 32 caracteres"
**Causa:** Secret no `.env` é muito curto ou contém palavras inseguras.

**Solução:** Atualize o `.env` com secrets mais longos:
```env
JWT_SECRET=dev_secret_key_with_minimum_32_characters_length_fixed
JWT_REFRESH_SECRET=dev_refresh_secret_key_with_minimum_32_characters_length_fixed
```

### Frontend não carrega
**Causa:** Pode demorar ~1 minuto para instalar dependências na primeira vez.

**Solução:** Aguarde e veja os logs:
```bash
docker-compose logs -f frontend
```

Você verá algo como:
```
added 779 packages in 1m
VITE v6.4.1 ready in 1494 ms
```

## 🐛 Resolução de Problemas

### Erro: "port is already allocated"
**Causa:** A porta já está em uso.

**Solução:**
```bash
# Parar os servidores locais primeiro
npm run stop

# Ou mudar as portas no docker-compose.yml
```

### Erro: "Cannot connect to Docker daemon"
**Causa:** Docker Desktop não está rodando.

**Solução:** Inicie o Docker Desktop e aguarde o ícone da baleia ficar verde.

### Erro: "database does not exist"
**Causa:** Primeira execução ou volumes corrompidos.

**Solução:**
```bash
docker-compose down -v
docker-compose up
```

### Frontend não carrega
**Causa:** Pode demorar ~1 minuto para instalar dependências na primeira vez.

**Solução:** Aguarde e veja os logs:
```bash
docker-compose logs -f frontend
```

## 📊 Diferenças: Local vs Docker

| Aspecto | Desenvolvimento Local | Docker |
|---------|----------------------|--------|
| **Instalação** | Precisa instalar Node, PostgreSQL | Só precisa do Docker |
| **Portabilidade** | Depende do SO | Funciona igual em qualquer lugar |
| **Performance** | Mais rápido | Leve overhead |
| **Isolamento** | Compartilha recursos | Totalmente isolado |
| **Recomendado para** | Desenvolvimento ativo | Testes, CI/CD, Deploy |

## 🎓 Quando usar cada opção?

### Use **Desenvolvimento Local** (`npm run dev`) se:
- ✅ Está desenvolvendo ativamente
- ✅ Precisa de hot-reload rápido
- ✅ Quer debugar com breakpoints

### Use **Docker** se:
- ✅ Quer testar em ambiente "limpo"
- ✅ Vai fazer deploy em servidor
- ✅ Trabalha em equipe (garante ambiente igual)
- ✅ Não quer instalar PostgreSQL localmente

## 📝 Próximos Passos

Após configurar o Docker, você pode:

1. **Testar a aplicação**: http://localhost:3000
2. **Acessar a API**: http://localhost:3001/health
3. **Ver documentação da API**: http://localhost:3001/api-docs (se configurado)

---

**💡 Dica Final:** Para desenvolvimento diário, use o `start.bat` (mais rápido). Use Docker quando precisar de um ambiente isolado ou para deploy.
