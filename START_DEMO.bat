@echo off
REM 🎵 HarmonyTrack - Lanzador Automático
REM Haz doble-click para ejecutar

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  🎵 HarmonyTrack - Iniciando Demo Automáticamente...           ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Matar procesos node previos
taskkill /F /IM node.exe /T >nul 2>&1

REM Esperar un poco
timeout /t 2 /nobreak >nul

REM Lanzar Backend en nueva ventana
echo Iniciando Backend en puerto 8081...
start "HarmonyTrack Backend" cmd /k "cd c:\desarollo seguro\backend-mock && npm start"

REM Esperar a que backend arranque
timeout /t 5 /nobreak >nul

REM Lanzar Frontend en nueva ventana
echo Iniciando Frontend en puerto 3000...
start "HarmonyTrack Frontend" cmd /k "cd c:\desarollo seguro\frontend && npm run dev"

REM Esperar a que frontend arranque
timeout /t 5 /nobreak >nul

REM Mostrar información
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  ✅ HARMONYTRACK INICIADA                                      ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo  🌍 Abre en navegador: http://localhost:3000
echo.
echo  Backend:  http://localhost:8081
echo  Frontend: http://localhost:3000
echo.
echo.  📚 Ver DEMO_SETUP.md para instrucciones completas
echo.
pause
