@echo off
cd /d "%~dp0"
echo ==========================================
echo   INICIANDO SISTEMA IMAC CONGELADOS
echo ==========================================
echo.
echo Iniciando Backend em nova janela...
start "IMAC Backend" cmd /k "cd backend && npm run dev"

echo Iniciando Frontend em nova janela...
start "IMAC Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Sistema iniciado! Duas janelas foram abertas.
echo Nao feche as janelas do Backend e Frontend enquanto usar o sistema.
echo.
pause
