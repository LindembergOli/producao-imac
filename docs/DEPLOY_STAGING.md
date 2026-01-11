# 🚀 Guia de Deploy em Staging
## Sistema IMAC Congelados

**Data:** 11 de Janeiro de 2026  
**Ambiente:** Staging (Teste de Produção)  
**Objetivo:** Validar configurações antes do deploy em produção

---

## 📋 Pré-requisitos

### **1. Secrets Configurados** ✅
- [x] `infra/docker/production.env` criado
- [x] Secrets únicos gerados
- [x] DATABASE_URL configurado
- [x] JWT_SECRET e JWT_REFRESH_SECRET configurados

### **2. PostgreSQL Local** ✅
- [x] PostgreSQL rodando no Windows
- [x] Database criada
- [x] Usuário e senha configurados

### **3. Docker** ✅
- [x] Docker Desktop instalado
- [x] Docker Compose disponível

---

## 🎯 Passos para Deploy em Staging

### **Passo 1: Parar Ambiente de Desenvolvimento**

```powershell
# Navegar para pasta docker
cd infra/docker

# Parar containers de desenvolvimento
docker-compose down

# Verificar que pararam
docker ps
```

---

### **Passo 2: Validar Configuração de Produção**

```powershell
# Verificar se production.env existe
Test-Path production.env

# Verificar variáveis (sem expor valores)
Get-Content production.env | Select-String "^[A-Z]" | ForEach-Object { $_.Line.Split('=')[0] }
```

**Variáveis Esperadas:**
```
NODE_ENV
PORT
DATABASE_URL
JWT_SECRET
JWT_EXPIRES_IN
JWT_REFRESH_SECRET
JWT_REFRESH_EXPIRES_IN
CORS_ORIGIN
RATE_LIMIT_WINDOW_MS
RATE_LIMIT_MAX_REQUESTS
LOG_LEVEL
VITE_API_URL
```

---

### **Passo 3: Build das Imagens de Produção**

```powershell
# Build com docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml build

# Verificar imagens criadas
docker images | Select-String "imac"
```

**Tempo Esperado:** 5-10 minutos

---

### **Passo 4: Iniciar Ambiente de Staging**

```powershell
# Iniciar containers em modo detached
docker-compose -f docker-compose.prod.yml --env-file production.env up -d

# Verificar status
docker-compose -f docker-compose.prod.yml ps
```

**Containers Esperados:**
- `imac-backend-prod` (healthy)
- `imac-frontend-prod` (running)
- `nginx` (running)

---

### **Passo 5: Verificar Logs**

```powershell
# Logs do backend
docker-compose -f docker-compose.prod.yml logs backend --tail 50

# Logs do frontend
docker-compose -f docker-compose.prod.yml logs frontend --tail 50

# Logs do nginx
docker-compose -f docker-compose.prod.yml logs nginx --tail 50

# Seguir logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f
```

---

### **Passo 6: Testes de Validação**

#### **6.1. Health Check**
```powershell
# Via backend direto (porta interna)
curl http://localhost:3001/health

# Via nginx (porta 80)
curl http://localhost/health
```

**Resposta Esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-11T15:00:00Z",
  "uptime": 60,
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "database": { "status": "healthy" },
    "memory": { "status": "healthy" },
    "disk": { "status": "healthy" }
  }
}
```

#### **6.2. Frontend**
```powershell
# Acessar frontend
Start-Process "http://localhost"
```

**Validar:**
- [ ] Página carrega
- [ ] Assets carregam
- [ ] Console sem erros
- [ ] Login funciona

#### **6.3. API**
```powershell
# Testar endpoint de login
$body = @{
    email = "admin@imac.com"
    password = "sua_senha_aqui"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost/api/auth/login" -Method POST -Body $body -ContentType "application/json"
```

**Validar:**
- [ ] Login retorna token
- [ ] Endpoints protegidos funcionam
- [ ] Rate limiting ativo

---

### **Passo 7: Testes de Performance**

#### **7.1. Compressão HTTP**
```powershell
# Verificar header de compressão
Invoke-WebRequest -Uri "http://localhost/api/products" -Method GET | Select-Object -ExpandProperty Headers
```

**Validar:**
- [ ] Header `Content-Encoding: gzip` presente
- [ ] Response size reduzido

#### **7.2. Response Time**
```powershell
# Medir tempo de resposta
Measure-Command { Invoke-RestMethod -Uri "http://localhost/health" }
```

**Esperado:** < 100ms

---

### **Passo 8: Testes de Segurança**

#### **8.1. HTTPS Redirect**
```powershell
# Testar redirecionamento (se SSL configurado)
curl -I http://localhost
```

**Esperado:** Redirect para HTTPS (se configurado)

#### **8.2. Rate Limiting**
```powershell
# Fazer múltiplas requisições
1..60 | ForEach-Object { 
    Invoke-RestMethod -Uri "http://localhost/health" -ErrorAction SilentlyContinue
}
```

**Esperado:** Bloqueio após 50 requisições (conforme configurado)

#### **8.3. Security Headers**
```powershell
# Verificar headers de segurança
Invoke-WebRequest -Uri "http://localhost" | Select-Object -ExpandProperty Headers
```

**Validar:**
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `Content-Security-Policy` presente

---

## 📊 Checklist de Validação

### **Funcionalidade** ✅
- [ ] Backend iniciou sem erros
- [ ] Frontend iniciou sem erros
- [ ] Nginx iniciou sem erros
- [ ] Health check retorna healthy
- [ ] Database conectada
- [ ] Login funciona
- [ ] CRUD operations funcionam

### **Performance** ✅
- [ ] Compressão gzip ativa
- [ ] Response time < 100ms
- [ ] Logs com rotação
- [ ] Memory usage normal

### **Segurança** ✅
- [ ] Rate limiting ativo
- [ ] Security headers presentes
- [ ] Secrets não expostos
- [ ] CORS configurado
- [ ] Validação de inputs ativa

---

## 🐛 Troubleshooting

### **Problema: Backend não inicia**
```powershell
# Verificar logs
docker-compose -f docker-compose.prod.yml logs backend

# Verificar variáveis de ambiente
docker-compose -f docker-compose.prod.yml exec backend env | Select-String "NODE_ENV|DATABASE"

# Verificar conexão com banco
docker-compose -f docker-compose.prod.yml exec backend node -e "require('./src/config/database.js').default.\$queryRaw\`SELECT 1\`"
```

### **Problema: Frontend não carrega**
```powershell
# Verificar logs
docker-compose -f docker-compose.prod.yml logs frontend

# Verificar build
docker-compose -f docker-compose.prod.yml exec frontend ls -la /usr/share/nginx/html
```

### **Problema: Nginx não responde**
```powershell
# Verificar configuração
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Recarregar configuração
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

---

## 🔄 Rollback

Se algo der errado:

```powershell
# Parar ambiente de produção
docker-compose -f docker-compose.prod.yml down

# Voltar para desenvolvimento
docker-compose up -d

# Verificar logs
docker-compose logs -f
```

---

## ✅ Critérios de Sucesso

Para considerar o staging bem-sucedido:

1. ✅ Todos os containers healthy
2. ✅ Health check retorna 200 OK
3. ✅ Login funciona
4. ✅ CRUD operations funcionam
5. ✅ Compressão gzip ativa
6. ✅ Rate limiting funciona
7. ✅ Security headers presentes
8. ✅ Sem erros nos logs
9. ✅ Performance aceitável (< 100ms)
10. ✅ Memory usage normal (< 75%)

---

## 📝 Próximos Passos

Após validação em staging:

1. **Testes de Carga** - Validar performance sob carga
2. **Ajustes Finais** - Corrigir problemas encontrados
3. **Deploy em Produção** - Configurar domínio e SSL
4. **Monitoramento** - Configurar alertas

---

**Assinatura:** Guia de Deploy em Staging  
**Versão:** 1.0.0  
**Data:** 2026-01-11 15:02:00
