# Script para gerar certificados SSL auto-assinados para teste local
# Uso: .\init-dev-certs.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Gerador de Certificados SSL (DEV)" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$domain = "producaoimac.com"
$certPath = ".\certbot\conf\live\$domain"

# Criar diretórios necessários
Write-Host "Criando estrutura de diretórios..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "$certPath" | Out-Null
New-Item -ItemType Directory -Force -Path ".\certbot\conf" | Out-Null
New-Item -ItemType Directory -Force -Path ".\certbot\www" | Out-Null

# Baixar arquivos de configuração SSL recomendados
Write-Host "Baixando parâmetros TLS recomendados..." -ForegroundColor Yellow

try {
    Invoke-WebRequest -Uri "https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf" `
        -OutFile ".\certbot\conf\options-ssl-nginx.conf" -ErrorAction Stop
    
    Invoke-WebRequest -Uri "https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem" `
        -OutFile ".\certbot\conf\ssl-dhparams.pem" -ErrorAction Stop
    
    Write-Host "✓ Parâmetros TLS baixados com sucesso" -ForegroundColor Green
} catch {
    Write-Host "⚠ Erro ao baixar parâmetros TLS. Continuando..." -ForegroundColor Yellow
}

# Gerar certificado auto-assinado usando OpenSSL
Write-Host ""
Write-Host "Gerando certificado auto-assinado para $domain..." -ForegroundColor Yellow

$opensslPath = "openssl"

# Verificar se OpenSSL está disponível
try {
    $null = & $opensslPath version 2>&1
} catch {
    Write-Host "✗ OpenSSL não encontrado no PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Opções:" -ForegroundColor Yellow
    Write-Host "1. Instalar OpenSSL: https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor White
    Write-Host "2. Ou usar Git Bash (vem com OpenSSL): C:\Program Files\Git\usr\bin\openssl.exe" -ForegroundColor White
    Write-Host ""
    
    # Tentar encontrar OpenSSL do Git
    $gitOpenSSL = "C:\Program Files\Git\usr\bin\openssl.exe"
    if (Test-Path $gitOpenSSL) {
        Write-Host "✓ OpenSSL encontrado no Git Bash!" -ForegroundColor Green
        $opensslPath = $gitOpenSSL
    } else {
        Write-Host "Execute novamente após instalar OpenSSL." -ForegroundColor Red
        exit 1
    }
}

# Gerar chave privada e certificado
$certFile = "$certPath\fullchain.pem"
$keyFile = "$certPath\privkey.pem"

& $opensslPath req -x509 -nodes -days 365 -newkey rsa:2048 `
    -keyout $keyFile `
    -out $certFile `
    -subj "/C=BR/ST=SP/L=SaoPaulo/O=IMAC/OU=Dev/CN=$domain"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Certificados gerados com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Arquivos criados:" -ForegroundColor Cyan
    Write-Host "  - $certFile" -ForegroundColor White
    Write-Host "  - $keyFile" -ForegroundColor White
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Yellow
    Write-Host "1. Adicione ao arquivo hosts:" -ForegroundColor White
    Write-Host "   C:\Windows\System32\drivers\etc\hosts" -ForegroundColor Gray
    Write-Host "   127.0.0.1 $domain" -ForegroundColor Gray
    Write-Host "   127.0.0.1 www.$domain" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Inicie o ambiente de produção:" -ForegroundColor White
    Write-Host "   docker-compose -f docker-compose.prod.yml up -d" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Acesse: https://$domain" -ForegroundColor White
    Write-Host "   (Aceite o aviso de certificado auto-assinado)" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "✗ Erro ao gerar certificados" -ForegroundColor Red
    exit 1
}
