# ⚡ Guia de Testes de Carga
## Sistema IMAC Congelados

**Data:** 11 de Janeiro de 2026  
**Objetivo:** Validar performance e estabilidade sob carga  
**Ferramentas:** Apache Bench (ab), PowerShell

---

## 📋 Pré-requisitos

### **1. Apache Bench (ab)**

**Instalação no Windows:**
```powershell
# Opção 1: Via Chocolatey
choco install apache-httpd

# Opção 2: Download manual
# https://www.apachelounge.com/download/
# Extrair e adicionar ao PATH
```

**Verificar instalação:**
```powershell
ab -V
```

### **2. Ambiente de Staging Rodando**
- [x] Containers iniciados
- [x] Health check healthy
- [x] Sistema acessível

---

## 🎯 Testes de Carga

### **Teste 1: Health Check - Carga Leve**

**Objetivo:** Validar endpoint básico sob carga moderada

```powershell
# 1000 requisições, 10 concorrentes
ab -n 1000 -c 10 http://localhost/health
```

**Métricas Esperadas:**
```
Requests per second:    > 100 req/s
Time per request:       < 100ms (mean)
Failed requests:        0
```

**Critérios de Sucesso:**
- ✅ 0% de falhas
- ✅ Response time médio < 100ms
- ✅ Throughput > 100 req/s

---

### **Teste 2: API Endpoint - Carga Média**

**Objetivo:** Testar endpoint de listagem sob carga

**Preparação:**
```powershell
# Fazer login e obter token
$loginBody = @{
    email = "admin@imac.com"
    password = "sua_senha"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $response.accessToken

# Salvar token em arquivo para ab
$token | Out-File -FilePath "token.txt" -NoNewline
```

**Executar teste:**
```powershell
# 5000 requisições, 50 concorrentes
ab -n 5000 -c 50 -H "Authorization: Bearer $token" http://localhost/api/products
```

**Métricas Esperadas:**
```
Requests per second:    > 50 req/s
Time per request:       < 200ms (mean)
Failed requests:        < 1%
```

---

### **Teste 3: Rate Limiting - Validação**

**Objetivo:** Verificar que rate limiting está funcionando

```powershell
# 100 requisições, 1 concorrente (mesmo IP)
ab -n 100 -c 1 http://localhost/api/products
```

**Resultado Esperado:**
- ✅ Primeiras 50 requisições: 200 OK
- ✅ Após 50: 429 Too Many Requests
- ✅ Rate limiting ativo

---

### **Teste 4: Compressão - Validação**

**Objetivo:** Verificar que compressão está ativa

```powershell
# Requisição com Accept-Encoding
$headers = @{
    "Accept-Encoding" = "gzip, deflate"
}

$response = Invoke-WebRequest -Uri "http://localhost/api/products" -Headers $headers
$response.Headers["Content-Encoding"]
```

**Resultado Esperado:**
- ✅ Header `Content-Encoding: gzip`
- ✅ Response size reduzido

---

### **Teste 5: Stress Test - Carga Alta**

**Objetivo:** Testar limites do sistema

```powershell
# 10000 requisições, 100 concorrentes
ab -n 10000 -c 100 http://localhost/health
```

**Métricas Esperadas:**
```
Requests per second:    > 80 req/s
Time per request:       < 300ms (mean)
Failed requests:        < 5%
```

**Monitorar durante o teste:**
```powershell
# Em outro terminal
docker stats
```

**Validar:**
- ✅ CPU usage < 80%
- ✅ Memory usage < 75%
- ✅ Sem crashes

---

### **Teste 6: Endurance Test - Longa Duração**

**Objetivo:** Validar estabilidade ao longo do tempo

```powershell
# 1 hora de requisições contínuas
# 1 req/s = 3600 req/hora
ab -n 3600 -c 1 -t 3600 http://localhost/health
```

**Validar:**
- ✅ Sem memory leaks
- ✅ Response time estável
- ✅ Sem degradação de performance

---

## 📊 Script de Teste Automatizado

```powershell
# test-load.ps1
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTES DE CARGA - IMAC CONGELADOS    " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Teste 1: Health Check
Write-Host "[1/5] Teste de Health Check..." -ForegroundColor Yellow
$result1 = ab -n 1000 -c 10 http://localhost/health 2>&1 | Out-String
if ($result1 -match "Failed requests:\s+0") {
    Write-Host "✅ Health Check: PASSOU" -ForegroundColor Green
} else {
    Write-Host "❌ Health Check: FALHOU" -ForegroundColor Red
}
Write-Host ""

# Teste 2: Rate Limiting
Write-Host "[2/5] Teste de Rate Limiting..." -ForegroundColor Yellow
$result2 = ab -n 100 -c 1 http://localhost/api/products 2>&1 | Out-String
if ($result2 -match "429") {
    Write-Host "✅ Rate Limiting: ATIVO" -ForegroundColor Green
} else {
    Write-Host "⚠️  Rate Limiting: Verificar configuração" -ForegroundColor Yellow
}
Write-Host ""

# Teste 3: Compressão
Write-Host "[3/5] Teste de Compressão..." -ForegroundColor Yellow
$headers = @{ "Accept-Encoding" = "gzip" }
$response = Invoke-WebRequest -Uri "http://localhost/health" -Headers $headers
if ($response.Headers["Content-Encoding"] -eq "gzip") {
    Write-Host "✅ Compressão: ATIVA" -ForegroundColor Green
} else {
    Write-Host "❌ Compressão: NÃO ATIVA" -ForegroundColor Red
}
Write-Host ""

# Teste 4: Stress Test
Write-Host "[4/5] Stress Test (10000 req, 100 concurrent)..." -ForegroundColor Yellow
Write-Host "⏳ Isso pode levar alguns minutos..." -ForegroundColor Gray
$result4 = ab -n 10000 -c 100 http://localhost/health 2>&1 | Out-String
$rps = [regex]::Match($result4, "Requests per second:\s+(\d+\.\d+)").Groups[1].Value
Write-Host "   Requests/sec: $rps" -ForegroundColor Gray
if ([double]$rps -gt 80) {
    Write-Host "✅ Stress Test: PASSOU (>80 req/s)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Stress Test: Performance abaixo do esperado" -ForegroundColor Yellow
}
Write-Host ""

# Teste 5: Memory Check
Write-Host "[5/5] Verificando uso de memória..." -ForegroundColor Yellow
$stats = docker stats --no-stream --format "{{.Container}}: {{.MemPerc}}" | Select-String "imac"
Write-Host $stats -ForegroundColor Gray
Write-Host ""

# Resumo
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTES CONCLUÍDOS                    " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Relatório salvo em: test-results.txt" -ForegroundColor White
Write-Host ""
```

---

## 📈 Métricas de Referência

### **Performance Aceitável**
```
Requests/second:     > 50 req/s
Response time (avg): < 200ms
Response time (p95): < 500ms
Response time (p99): < 1000ms
Failed requests:     < 1%
CPU usage:           < 80%
Memory usage:        < 75%
```

### **Performance Excelente**
```
Requests/second:     > 100 req/s
Response time (avg): < 100ms
Response time (p95): < 200ms
Response time (p99): < 500ms
Failed requests:     0%
CPU usage:           < 60%
Memory usage:        < 50%
```

---

## 🐛 Troubleshooting

### **Performance Baixa**
```powershell
# Verificar logs
docker-compose -f docker-compose.prod.yml logs backend --tail 100

# Verificar recursos
docker stats

# Verificar conexões com banco
docker-compose -f docker-compose.prod.yml exec backend node -e "console.log(process.env.DATABASE_URL)"
```

### **Memory Leaks**
```powershell
# Monitorar memória ao longo do tempo
while ($true) {
    docker stats --no-stream | Select-String "imac"
    Start-Sleep -Seconds 10
}
```

### **Rate Limiting Muito Restritivo**
```
Ajustar em production.env:
RATE_LIMIT_MAX_REQUESTS=100  # Aumentar se necessário
```

---

## ✅ Checklist de Validação

- [ ] Health check: > 100 req/s
- [ ] API endpoints: > 50 req/s
- [ ] Rate limiting ativo
- [ ] Compressão gzip ativa
- [ ] Stress test: < 5% falhas
- [ ] CPU usage: < 80%
- [ ] Memory usage: < 75%
- [ ] Sem memory leaks
- [ ] Response time estável
- [ ] Logs sem erros críticos

---

## 📝 Próximos Passos

Após testes de carga bem-sucedidos:

1. **Documentar Resultados** - Salvar métricas
2. **Ajustar Configurações** - Se necessário
3. **Deploy em Produção** - Configurar domínio e SSL
4. **Monitoramento Contínuo** - Configurar alertas

---

**Assinatura:** Guia de Testes de Carga  
**Versão:** 1.0.0  
**Data:** 2026-01-11 15:02:00
