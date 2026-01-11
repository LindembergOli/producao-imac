# Script de Testes de Carga Automatizados
# Sistema IMAC Congelados

param(
    [switch]$Quick,  # Testes rápidos
    [switch]$Full    # Testes completos
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTES DE CARGA - IMAC CONGELADOS    " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se ab está instalado
try {
    ab -V | Out-Null
}
catch {
    Write-Host "❌ Apache Bench (ab) não encontrado!" -ForegroundColor Red
    Write-Host "Instale com: choco install apache-httpd" -ForegroundColor Yellow
    exit 1
}

# Configurações
$baseUrl = "http://localhost"
$results = @()

# Função para executar teste
function Run-LoadTest {
    param($name, $requests, $concurrency, $url)
    
    Write-Host "Executando: $name..." -ForegroundColor Yellow
    Write-Host "  URL: $url" -ForegroundColor Gray
    Write-Host "  Requisições: $requests, Concorrência: $concurrency" -ForegroundColor Gray
    
    $output = ab -n $requests -c $concurrency $url 2>&1 | Out-String
    
    # Extrair métricas
    $rps = [regex]::Match($output, "Requests per second:\s+(\d+\.\d+)").Groups[1].Value
    $timePerReq = [regex]::Match($output, "Time per request:\s+(\d+\.\d+)\s+\[ms\]\s+\(mean\)").Groups[1].Value
    $failed = [regex]::Match($output, "Failed requests:\s+(\d+)").Groups[1].Value
    
    $result = [PSCustomObject]@{
        Test              = $name
        RequestsPerSecond = [double]$rps
        AvgResponseTime   = [double]$timePerReq
        FailedRequests    = [int]$failed
        TotalRequests     = $requests
        Status            = if ([int]$failed -eq 0 -and [double]$rps -gt 50) { "✅ PASSOU" } else { "❌ FALHOU" }
    }
    
    $script:results += $result
    
    Write-Host "  Req/s: $rps | Avg: ${timePerReq}ms | Failed: $failed" -ForegroundColor Gray
    Write-Host "  $($result.Status)" -ForegroundColor $(if ($result.Status -match "PASSOU") { "Green" } else { "Red" })
    Write-Host ""
    
    return $result
}

# Testes Rápidos
if ($Quick -or -not $Full) {
    Write-Host "=== TESTES RÁPIDOS ===" -ForegroundColor Cyan
    Write-Host ""
    
    Run-LoadTest "Health Check - Leve" 100 10 "$baseUrl/health"
    Run-LoadTest "Health Check - Médio" 500 25 "$baseUrl/health"
    
    Write-Host "✅ Testes rápidos concluídos" -ForegroundColor Green
}

# Testes Completos
if ($Full) {
    Write-Host "=== TESTES COMPLETOS ===" -ForegroundColor Cyan
    Write-Host ""
    
    Run-LoadTest "Health Check - Leve" 1000 10 "$baseUrl/health"
    Run-LoadTest "Health Check - Médio" 5000 50 "$baseUrl/health"
    Run-LoadTest "Health Check - Pesado" 10000 100 "$baseUrl/health"
    
    Write-Host "=== TESTE DE COMPRESSÃO ===" -ForegroundColor Cyan
    Write-Host ""
    
    $headers = @{ "Accept-Encoding" = "gzip" }
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -Headers $headers
    
    if ($response.Headers["Content-Encoding"] -eq "gzip") {
        Write-Host "✅ Compressão GZIP: ATIVA" -ForegroundColor Green
        $results += [PSCustomObject]@{
            Test   = "Compressão GZIP"
            Status = "✅ ATIVA"
        }
    }
    else {
        Write-Host "❌ Compressão GZIP: INATIVA" -ForegroundColor Red
        $results += [PSCustomObject]@{
            Test   = "Compressão GZIP"
            Status = "❌ INATIVA"
        }
    }
    Write-Host ""
    
    Write-Host "=== TESTE DE RECURSOS ===" -ForegroundColor Cyan
    Write-Host ""
    
    $stats = docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemPerc}}" | Select-String "imac"
    Write-Host $stats -ForegroundColor Gray
    Write-Host ""
}

# Resumo
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESUMO DOS TESTES                    " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$results | Format-Table -AutoSize

# Salvar resultados
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$results | Export-Csv -Path "test-results-$timestamp.csv" -NoTypeInformation
Write-Host "📊 Resultados salvos em: test-results-$timestamp.csv" -ForegroundColor White
Write-Host ""

# Análise
$passed = ($results | Where-Object { $_.Status -match "PASSOU" }).Count
$total = $results.Count

Write-Host "Testes passados: $passed/$total" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Yellow" })
Write-Host ""

if ($passed -eq $total) {
    Write-Host "🎉 TODOS OS TESTES PASSARAM!" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Alguns testes falharam. Verifique os logs." -ForegroundColor Yellow
}
Write-Host ""
