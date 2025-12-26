# Guia de Deploy - IMAC Congelados

## 🚀 Deploy em Produção

Este guia cobre o processo de deploy do sistema IMAC Congelados em ambiente de produção.

---

## 📋 Pré-requisitos

### Servidor

- Ubuntu 20.04+ ou similar
- Node.js 18+
- PostgreSQL 14+
- Nginx (recomendado)
- PM2 ou Docker

### Domínio e SSL

- Domínio configurado
- Certificado SSL (Let's Encrypt recomendado)

---

## 🐳 Deploy com Docker (Recomendado)

### 1. Preparar Servidor

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clonar Repositório

```bash
git clone [url-do-repositorio]
cd imac-congelados---controle-de-produção
```

### 3. Configurar Variáveis de Ambiente

**backend/.env.production:**
```env
DATABASE_URL="postgresql://user:password@db:5432/imac_congelados"
JWT_SECRET="secret-super-seguro-aqui"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="production"
```

**frontend/.env.production:**
```env
VITE_API_URL="https://api.seudominio.com"
```

### 4. Build e Deploy

```bash
# Build das imagens
docker-compose -f docker-compose.prod.yml build

# Subir containers
docker-compose -f docker-compose.prod.yml up -d

# Verificar logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 5. Executar Migrations

```bash
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

---

## 🖥️ Deploy Manual (sem Docker)

### 1. Preparar Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Instalar Nginx
sudo apt install -y nginx

# Instalar PM2
sudo npm install -g pm2
```

### 2. Configurar PostgreSQL

```bash
# Criar usuário e banco
sudo -u postgres psql

CREATE USER imac WITH PASSWORD 'senha-segura';
CREATE DATABASE imac_congelados OWNER imac;
GRANT ALL PRIVILEGES ON DATABASE imac_congelados TO imac;
\q
```

### 3. Clonar e Configurar Aplicação

```bash
# Clonar repositório
cd /var/www
git clone [url-do-repositorio]
cd imac-congelados---controle-de-produção

# Backend
cd backend
npm install --production
cp .env.example .env
# Editar .env com dados de produção

# Executar migrations
npx prisma migrate deploy
npx prisma generate

# Frontend
cd ../frontend
npm install
npm run build
```

### 4. Configurar PM2

```bash
cd backend

# Criar ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'imac-backend',
    script: './src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# Iniciar aplicação
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Configurar para iniciar no boot
pm2 startup
```

### 5. Configurar Nginx

```bash
# Criar configuração
sudo nano /etc/nginx/sites-available/imac

# Adicionar configuração:
server {
    listen 80;
    server_name seudominio.com;

    # Frontend
    location / {
        root /var/www/imac-congelados---controle-de-produção/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Ativar site
sudo ln -s /etc/nginx/sites-available/imac /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Configurar SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seudominio.com

# Renovação automática já está configurada
```

---

## 🔄 Atualizações

### Com Docker

```bash
# Pull das mudanças
git pull origin main

# Rebuild e restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Executar migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### Sem Docker

```bash
# Pull das mudanças
cd /var/www/imac-congelados---controle-de-produção
git pull origin main

# Backend
cd backend
npm install --production
npx prisma migrate deploy
pm2 restart imac-backend

# Frontend
cd ../frontend
npm install
npm run build
```

---

## 📊 Monitoramento

### PM2 Monitoring

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs imac-backend

# Ver métricas
pm2 monit
```

### Logs

```bash
# Backend logs
tail -f /var/www/imac-congelados---controle-de-produção/backend/logs/combined.log

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 🔒 Segurança

### Firewall

```bash
# Configurar UFW
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw enable
```

### Backups

**Banco de Dados:**
```bash
# Criar backup
pg_dump -U imac imac_congelados > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql -U imac imac_congelados < backup_20241218.sql

# Automatizar com cron
0 2 * * * pg_dump -U imac imac_congelados > /backups/imac_$(date +\%Y\%m\%d).sql
```

**Arquivos:**
```bash
# Backup completo
tar -czf backup_$(date +%Y%m%d).tar.gz /var/www/imac-congelados---controle-de-produção
```

---

## 🚨 Troubleshooting em Produção

### Aplicação não inicia

```bash
# Verificar logs
pm2 logs imac-backend --lines 100

# Verificar variáveis de ambiente
pm2 env 0

# Restart
pm2 restart imac-backend
```

### Banco não conecta

```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Testar conexão
psql -U imac -d imac_congelados

# Verificar DATABASE_URL no .env
```

### Nginx erro 502

```bash
# Verificar se backend está rodando
pm2 status

# Verificar logs do Nginx
tail -f /var/log/nginx/error.log

# Testar configuração
sudo nginx -t
```

---

## 📈 Performance

### Otimizações Nginx

```nginx
# Cache de assets estáticos
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Compressão gzip
gzip on;
gzip_vary on;
gzip_types text/plain text/css application/json application/javascript;
```

### PM2 Cluster Mode

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'imac-backend',
    script: './src/server.js',
    instances: 'max',  // Usar todos os CPUs
    exec_mode: 'cluster'
  }]
};
```

---

## ✅ Checklist de Deploy

- [ ] Servidor configurado
- [ ] PostgreSQL instalado e configurado
- [ ] Variáveis de ambiente configuradas
- [ ] Migrations executadas
- [ ] Aplicação rodando (PM2 ou Docker)
- [ ] Nginx configurado
- [ ] SSL configurado
- [ ] Firewall configurado
- [ ] Backups automatizados
- [ ] Monitoramento ativo
- [ ] Logs funcionando
- [ ] Testado em produção

---

## 📞 Suporte

Para problemas em produção, verificar:
1. Logs da aplicação
2. Logs do Nginx
3. Status do banco de dados
4. Métricas de performance
