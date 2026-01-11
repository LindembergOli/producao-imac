@echo off
echo ========================================
echo   IMAC Congelados - Iniciando Sistema
echo ========================================
echo.
echo Iniciando Backend e Frontend...
echo.

start "IMAC Backend" cmd /k "cd backend && npm run dev"
start "IMAC Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ✓ Backend e Frontend iniciados em janelas separadas
echo.
echo Para parar os servidores, feche as janelas ou pressione Ctrl+C em cada uma.
echo.
pause
