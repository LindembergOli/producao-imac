# GitHub Actions Secrets Configuration

Este documento lista todos os secrets necessários para configurar o pipeline CI/CD.

## Como Configurar

1. Acesse: `Settings` → `Secrets and variables` → `Actions`
2. Clique em `New repository secret`
3. Adicione cada secret listado abaixo

---

## Secrets Necessários

### Docker Registry (GitHub Container Registry)

Os workflows usam GitHub Container Registry (GHCR) por padrão, que usa o `GITHUB_TOKEN` automático.

**Alternativa - Docker Hub**:
Se preferir usar Docker Hub, adicione:

```
DOCKER_USERNAME=seu_usuario_dockerhub
DOCKER_PASSWORD=seu_token_dockerhub
```

E modifique `.github/workflows/docker.yml` para usar Docker Hub ao invés de GHCR.

---

### Development Environment

```bash
# Hostname ou IP do servidor de desenvolvimento
DEV_SSH_HOST=dev.example.com

# Usuário SSH
DEV_SSH_USER=deploy

# Chave privada SSH (conteúdo completo)
DEV_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----

# Arquivo .env completo para desenvolvimento
DEV_ENV_FILE=POSTGRES_USER=imac_user
POSTGRES_PASSWORD=dev_password_here
POSTGRES_DB=imac_congelados
JWT_SECRET=dev_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=dev_refresh_secret_min_32_chars
CORS_ORIGIN=http://dev.example.com
```

---

### Production Environment

```bash
# Hostname ou IP do servidor de produção
PROD_SSH_HOST=prod.example.com

# Usuário SSH
PROD_SSH_USER=deploy

# Chave privada SSH (conteúdo completo)
PROD_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----

# Arquivo .env completo para produção
PROD_ENV_FILE=POSTGRES_USER=imac_user
POSTGRES_PASSWORD=STRONG_PRODUCTION_PASSWORD
POSTGRES_DB=imac_congelados
JWT_SECRET=STRONG_JWT_SECRET_MIN_32_CHARS
JWT_REFRESH_SECRET=STRONG_REFRESH_SECRET_MIN_32_CHARS
CORS_ORIGIN=https://prod.example.com
```

---

## Gerar Secrets Fortes

### JWT Secrets

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### SSH Key Pair

```bash
ssh-keygen -t ed25519 -C "deploy@imac-congelados" -f ~/.ssh/imac_deploy

# Adicionar chave pública ao servidor
ssh-copy-id -i ~/.ssh/imac_deploy.pub deploy@server.com

# Copiar chave privada para GitHub Secrets
cat ~/.ssh/imac_deploy
```

---

## Configurar Environments

### Development

1. Acesse: `Settings` → `Environments`
2. Clique em `New environment`
3. Nome: `development`
4. Configurações:
   - ✅ No protection rules (deploy automático)

### Production

1. Acesse: `Settings` → `Environments`
2. Clique em `New environment`
3. Nome: `production`
4. Configurações:
   - ✅ Required reviewers: 1+
   - ✅ Wait timer: 5 minutes
   - ✅ Deployment branches: `main` only

---

## Preparar Servidor

### Instalar Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### Criar Diretório da Aplicação

```bash
mkdir -p ~/imac-app
mkdir -p ~/backups
```

### Configurar Firewall

```bash
# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Habilitar firewall
sudo ufw enable
```

---

## Testar Conexão SSH

```bash
# Testar conexão
ssh -i ~/.ssh/imac_deploy deploy@server.com

# Testar comando Docker
ssh -i ~/.ssh/imac_deploy deploy@server.com "docker ps"
```

---

## Verificar Secrets

Após configurar, verifique se todos os secrets estão presentes:

```bash
# Development
- DEV_SSH_HOST
- DEV_SSH_USER
- DEV_SSH_KEY
- DEV_ENV_FILE

# Production
- PROD_SSH_HOST
- PROD_SSH_USER
- PROD_SSH_KEY
- PROD_ENV_FILE
```

---

## Troubleshooting

### Erro de Permissão SSH

```bash
# Verificar permissões da chave
chmod 600 ~/.ssh/imac_deploy

# Verificar authorized_keys no servidor
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### Docker Permission Denied

```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Relogar para aplicar
```

### Health Check Falha

```bash
# Verificar logs
docker-compose logs -f backend

# Verificar se porta está aberta
curl http://localhost:3001/health
```
