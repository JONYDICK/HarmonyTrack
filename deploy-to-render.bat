@echo off
REM HarmonyTrack Render Deployment Script (Windows)
REM This script helps prepare your app for deployment to Render

echo.
echo 🚀 HarmonyTrack - Render Deployment Helper
echo ===========================================
echo.

REM Check if render.yaml exists
if not exist "render.yaml" (
    echo ❌ Error: render.yaml not found!
    pause
    exit /b 1
)

echo ✓ Checking render.yaml...

REM Check and install backend dependencies
echo ✓ Checking backend dependencies...
if not exist "backend-mock\node_modules" (
    echo   Installing backend dependencies...
    cd backend-mock
    call npm install --production
    cd ..
)

REM Check and install frontend dependencies
echo ✓ Checking frontend dependencies...
if not exist "frontend\node_modules" (
    echo   Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo.
echo ✅ Deployment Preparation Complete!
echo.
echo 📋 Next Steps:
echo 1. Go to https://render.com/dashboard
echo 2. Click '+ New' -^> 'Blueprint'
echo 3. Select your HarmonyTrack GitHub repository
echo 4. Render will detect render.yaml automatically
echo.
echo 🔐 Before deploying, prepare:
echo    - SPOTIFY_CLIENT_ID (from https://developer.spotify.com/dashboard)
echo    - SPOTIFY_CLIENT_SECRET
echo    - JWT_SECRET (random secure string)
echo    - ENCRYPTION_KEY (random secure string)
echo.
echo 📖 Full guide: See RENDER_DEPLOYMENT.md
echo.
pause
