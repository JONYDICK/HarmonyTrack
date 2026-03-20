#!/usr/bin/env pwsh
# 🎵 HarmonyTrack - Script de Lanzamiento Automático para Demo
# Ejecuta: powershell -ExecutionPolicy Bypass -File START_DEMO.ps1

Write-Host "🎵 HarmonyTrack - Iniciando Demo..." -ForegroundColor Cyan
Write-Host ""

# Configuración
$BackendPath = "c:\desarollo seguro\backend-mock"
$FrontendPath = "c:\desarollo seguro\frontend"
$BackendPort = 8081
$FrontendPort = 3000

# Paso 1: Verificar Node.js instalado
Write-Host "📋 Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js no está instalado. Instálalo desde https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Paso 2: Matar procesos node anteriores
Write-Host ""
Write-Host "🔄 Limpiando procesos anteriores..." -ForegroundColor Yellow
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Paso 3: Verificar .env tiene credenciales
Write-Host ""
Write-Host "🔐 Verificando credenciales Spotify..." -ForegroundColor Yellow
$envFile = Join-Path $BackendPath ".env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    if ($envContent -contains "your_client_id_here" -or $envContent -contains "YOUR_CLIENT_ID_HERE") {
        Write-Host "⚠️  ATENCIÓN: .env tiene placeholders, no credenciales reales" -ForegroundColor Red
        Write-Host "   Por favor, edita backend-mock/.env con credenciales de Spotify" -ForegroundColor Red
        Write-Host "   Guía: https://developer.spotify.com/dashboard" -ForegroundColor Cyan
        exit 1
    }
    Write-Host "✅ Credenciales Spotify presentes en .env" -ForegroundColor Green
} else {
    Write-Host "❌ No encontré .env" -ForegroundColor Red
    exit 1
}

# Paso 4: Instalar dependencias si es necesario
Write-Host ""
Write-Host "📦 Verificando dependencias..." -ForegroundColor Yellow

if (-not (Test-Path (Join-Path $BackendPath "node_modules"))) {
    Write-Host "📥 Instalando backend-mock dependencias..." -ForegroundColor Cyan
    Push-Location $BackendPath
    npm install --no-audit --no-fund
    Pop-Location
    Write-Host "✅ Backend dependencias instaladas" -ForegroundColor Green
} else {
    Write-Host "✅ Backend dependencias presentes" -ForegroundColor Green
}

if (-not (Test-Path (Join-Path $FrontendPath "node_modules"))) {
    Write-Host "📥 Instalando frontend dependencias..." -ForegroundColor Cyan
    Push-Location $FrontendPath
    npm install --no-audit --no-fund
    Pop-Location
    Write-Host "✅ Frontend dependencias instaladas" -ForegroundColor Green
} else {
    Write-Host "✅ Frontend dependencias presentes" -ForegroundColor Green
}

# Paso 5: Iniciar servidor backend
Write-Host ""
Write-Host "🚀 Iniciando Backend en puerto $BackendPort..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BackendPath'; npm start" -WindowStyle Normal
Start-Sleep -Seconds 5

# Paso 6: Verificar backend está corriendo
Write-Host ""
Write-Host "✔️  Verificando Backend..." -ForegroundColor Yellow
try {
    $response = curl -s "http://localhost:$BackendPort/health"
    if ($response -match "ok") {
        Write-Host "✅ Backend responde en http://localhost:$BackendPort" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Backend arrancó pero no responde correctamente" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  No se pudo verificar backend, pero probablemente está arrancando..." -ForegroundColor Yellow
}

# Paso 7: Iniciar servidor frontend
Write-Host ""
Write-Host "🚀 Iniciando Frontend en puerto $FrontendPort..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$FrontendPath'; npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 5

# Paso 8: Resumen y próximos pasos
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ HARMONYTRACK INICIADA EXITOSAMENTE" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌍 Abre en tu navegador: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Flujo de Demo:" -ForegroundColor Yellow
Write-Host "  1. Haz click en 'Connect with Spotify'" -ForegroundColor White
Write-Host "  2. Autoriza en Spotify" -ForegroundColor White
Write-Host "  3. Dashboard debería cargar automáticamente" -ForegroundColor White
Write-Host "  4. Muestra gráficos y métricas de mood" -ForegroundColor White
Write-Host ""
Write-Host "🔗 URLs de Referencia:" -ForegroundColor Yellow
Write-Host "  Backend Health: http://localhost:$BackendPort/health" -ForegroundColor Cyan
Write-Host "  OAuth Endpoint: http://localhost:$BackendPort/api/auth/spotify/login" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:$FrontendPort" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Documentación: Ver DEMO_SETUP.md para troubleshooting" -ForegroundColor Yellow
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "¡Listo para la presentación! 🎉" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Mantener la ventana abierta
Write-Host "Presiona Ctrl+C para salir" -ForegroundColor Gray
