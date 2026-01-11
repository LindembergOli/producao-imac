# Deploy em Staging - Sistema IMAC Congelados
# Este script automatiza o deploy do ambiente de staging

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY EM STAGING - IMAC CONGELADOS  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navegar para pasta docker
Set-Location -Path "infra/docker"

# Passo 1: Parar ambiente de desenvolvimento
Write-Host "[1/7] Parando ambiente de desenvolvimento..." -ForegroundColor Yellow
docker-compose down
Write-Host "✅ Ambiente de desenvolvimento parado" -ForegroundColor Green
Write-Host ""

# Passo 2: Validar production.env
Write-Host "[2/7] Validando configuração de produção..." -ForegroundColor Yellow
if (Test-Path "production.env") {
    Write-Host "✅ production.env encontrado" -ForegroundColor Green
    
    # Verificar variáveis essenciais
    $envContent = Get-Content "production.env"
    $requiredVars = @("NODE_ENV", "DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET")
    $missingVars = @()
    
    foreach ($var in $requiredVars) {
        if (-not ($envContent | Select-String "^$var=")) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Host "❌ Variáveis faltando: $($missingVars -join ', ')" -ForegroundColor Red
        Write-Host "Configure production.env antes de continuar" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Todas as variáveis essenciais configuradas" -ForegroundColor Green
}
else {
    Write-Host "❌ production.env não encontrado!" -ForegroundColor Red
    Write-Host "Crie o arquivo production.env com as configurações de produção" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Passo 3: Build das imagens
Write-Host "[3/7] Fazendo build das imagens de produção..." -ForegroundColor Yellow
Write-Host "⏳ Isso pode levar 5-10 minutos..." -ForegroundColor Gray
docker-compose -f docker-compose.prod.yml build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no build das imagens" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build concluído com sucesso" -ForegroundColor Green
Write-Host ""

# Passo 4: Iniciar containers
Write-Host "[4/7] Iniciando containers de staging..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml --env-file production.env up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao iniciar containers" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Containers iniciados" -ForegroundColor Green
Write-Host ""

# Passo 5: Aguardar inicialização
Write-Host "[5/7] Aguardando inicialização dos serviços..." -ForegroundColor Yellow
Write-Host "⏳ Aguardando 30 segundos..." -ForegroundColor Gray
Start-Sleep -Seconds 30

# Passo 6: Verificar status
Write-Host "[6/7] Verificando status dos containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml ps
Write-Host ""

# Passo 7: Testar health check
Write-Host "[7/7] Testando health check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 10
    if ($response.status -eq "healthy") {
        Write-Host "✅ Health check: HEALTHY" -ForegroundColor Green
        Write-Host "   Database: $($response.checks.database.status)" -ForegroundColor Gray
        Write-Host "   Memory: $($response.checks.memory.status)" -ForegroundColor Gray
        Write-Host "   Uptime: $([math]::Round($response.uptime, 2))s" -ForegroundColor Gray
    }
    else {
        Write-Host "⚠️  Health check: $($response.status)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "❌ Health check falhou: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Verifique os logs: docker-compose -f docker-compose.prod.yml logs backend" -ForegroundColor Yellow
}
Write-Host ""

# Resumo
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY EM STAGING CONCLUÍDO!         " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Próximos passos:" -ForegroundColor White
Write-Host "1. Acessar frontend: http://localhost" -ForegroundColor Gray
Write-Host "2. Testar login e funcionalidades" -ForegroundColor Gray
Write-Host "3. Verificar logs: docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor Gray
Write-Host "4. Executar testes de carga" -ForegroundColor Gray
Write-Host ""
Write-Host "🔧 Comandos úteis:" -ForegroundColor White
Write-Host "   Ver logs:     docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor Gray
Write-Host "   Parar:        docker-compose -f docker-compose.prod.yml down" -ForegroundColor Gray
Write-Host "   Reiniciar:    docker-compose -f docker-compose.prod.yml restart" -ForegroundColor Gray
Write-Host "   Status:       docker-compose -f docker-compose.prod.yml ps" -ForegroundColor Gray
Write-Host ""
