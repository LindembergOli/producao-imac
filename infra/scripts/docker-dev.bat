@echo off
REM ================================
REM Script de Inicialização - Desenvolvimento (Windows)
REM IMAC Congelados - Sistema de Controle de Produção
REM ================================

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║         IMAC Congelados - Ambiente de Desenvolvimento     ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Verificar se Docker está instalado
echo [INFO] Verificando Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Docker não está instalado!
    echo Por favor, instale o Docker Desktop: https://docs.docker.com/desktop/install/windows-install/
    pause
    exit /b 1
)
echo [OK] Docker encontrado

REM Verificar se Docker Compose está disponível
echo [INFO] Verificando Docker Compose...
docker compose version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Docker Compose não está disponível!
    echo Por favor, atualize o Docker Desktop
    pause
    exit /b 1
)
echo [OK] Docker Compose encontrado

REM Navegar para o diretório correto
cd /d "%~dp0..\docker"

REM Verificar se arquivo .env existe
echo [INFO] Verificando arquivo .env...
if not exist "..\..\..\.env" (
    echo [AVISO] Arquivo .env não encontrado!
    echo [INFO] Criando .env a partir de .env.example...
    copy "..\..\..\.env.example" "..\..\..\.env"
    echo [OK] Arquivo .env criado!
    echo [AVISO] IMPORTANTE: Revise as configurações em .env antes de continuar
    pause
) else (
    echo [OK] Arquivo .env encontrado
)

REM Verificar portas disponíveis
echo [INFO] Verificando portas...
netstat -ano | findstr ":3000" >nul 2>&1
if not errorlevel 1 (
    echo [AVISO] Porta 3000 está em uso!
)

netstat -ano | findstr ":3001" >nul 2>&1
if not errorlevel 1 (
    echo [AVISO] Porta 3001 está em uso!
)

netstat -ano | findstr ":5432" >nul 2>&1
if not errorlevel 1 (
    echo [AVISO] Porta 5432 está em uso!
)

REM Perguntar se deseja limpar volumes antigos
echo.
set /p CLEAN_VOLUMES="Deseja limpar volumes antigos? (Isso apagará dados do banco) (y/N): "
if /i "%CLEAN_VOLUMES%"=="y" (
    echo [INFO] Removendo volumes...
    docker compose down -v
    echo [OK] Volumes removidos
)

REM Opções de inicialização
echo.
echo Escolha uma opção:
echo   1^) Iniciar em foreground (ver logs)
echo   2^) Iniciar em background (daemon)
echo   3^) Rebuild e iniciar
echo   4^) Apenas PostgreSQL
echo.
set /p OPTION="Opção [1]: "
if "%OPTION%"=="" set OPTION=1

if "%OPTION%"=="1" (
    echo [INFO] Iniciando em foreground...
    docker compose up
) else if "%OPTION%"=="2" (
    echo [INFO] Iniciando em background...
    docker compose up -d
    echo [OK] Serviços iniciados!
    goto :show_info
) else if "%OPTION%"=="3" (
    echo [INFO] Rebuilding e iniciando...
    docker compose up --build -d
    echo [OK] Serviços iniciados!
    goto :show_info
) else if "%OPTION%"=="4" (
    echo [INFO] Iniciando apenas PostgreSQL...
    docker compose up postgres -d
    echo [OK] PostgreSQL iniciado!
    goto :show_info
) else (
    echo [ERRO] Opção inválida
    pause
    exit /b 1
)

goto :end

:show_info
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                    Serviços Disponíveis                    ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║  Frontend:    http://localhost:3000                        ║
echo ║  Backend:     http://localhost:3001/api                    ║
echo ║  PostgreSQL:  localhost:5432                               ║
echo ║               User: imac_user                              ║
echo ║               DB: imac_congelados                          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo [INFO] Comandos úteis:
echo   docker compose logs -f              # Ver logs
echo   docker compose ps                   # Status dos containers
echo   docker compose down                 # Parar serviços
echo   docker compose exec backend sh      # Acessar backend
echo.
echo [OK] Ambiente de desenvolvimento pronto!
pause

:end
