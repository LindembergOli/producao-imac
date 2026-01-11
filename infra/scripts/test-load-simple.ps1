# Script de Teste de Carga Simplificado (PowerShell Puro)
# Usado quando Apache Bench (ab) não está disponível
# Este teste é menos preciso e gera menos carga, mas serve para validação básica

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTE DE CARGA SIMPLIFICADO (PS)     " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Aviso: 'ab' não encontrado. Usando modo de compatibilidade." -ForegroundColor Yellow
Write-Host ""

# Bypass SSL para testes locais (certificado auto-assinado)
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }

$baseUrl = "http://localhost"
$totalRequests = 50
$successCount = 0
$totalTime = 0

Write-Host "[1/2] Testando Health Check ($totalRequests requisições sequenciais)..." -ForegroundColor Yellow

$overallStart = Get-Date

1..$totalRequests | ForEach-Object {
    $i = $_
    $start = Get-Date
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get -ErrorAction Stop
        $end = Get-Date
        $duration = ($end - $start).TotalMilliseconds
        
        $status = if ($response.status) { $response.status } else { "OK" }
        
        Write-Host "  Req #$i - Status: $status - Tempo: ${duration}ms" -ForegroundColor Green
        $successCount++
        $totalTime += $duration
    }
    catch {
        Write-Host "  Req #$i - ERRO: $($_.Exception.Message)" -ForegroundColor Red
    }
}

$overallEnd = Get-Date
$totalDuration = ($overallEnd - $overallStart).TotalSeconds
$avgTime = $totalTime / $totalRequests
$rps = $totalRequests / $totalDuration

Write-Host ""
Write-Host "=== RESULTADOS (Estimados) ===" -ForegroundColor Cyan
Write-Host "Total Requisições: $totalRequests"
Write-Host "Sucessos:          $successCount"
Write-Host "Tempo Total:       $([math]::Round($totalDuration, 2))s"
Write-Host "Tempo Médio/Req:   $([math]::Round($avgTime, 2))ms"
Write-Host "Req/Segundo (RPS): $([math]::Round($rps, 2))"
Write-Host ""

if ($successCount -eq $totalRequests) {
    Write-Host "✅ Teste Básico: PASSOU" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Teste Básico: ALGUMAS FALHAS" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "[2/2] Validando Compressão..." -ForegroundColor Yellow
try {
    $resp = Invoke-WebRequest -Uri "$baseUrl/health" -Headers @{ "Accept-Encoding" = "gzip" }
    if ($resp.Headers["Content-Encoding"] -eq "gzip") {
        Write-Host "✅ Compressão GZIP Ativa" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Compressão GZIP Inativa" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ Falha ao testar compressão" -ForegroundColor Red
}
Write-Host ""
