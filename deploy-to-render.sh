#!/bin/bash
# HarmonyTrack Render Deployment Script
# This script helps prepare your app for deployment to Render

set -e

echo "🚀 HarmonyTrack - Render Deployment Helper"
echo "==========================================="
echo ""

# Check if git is clean
echo "✓ Checking git status..."
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Warning: You have uncommitted changes"
    echo "   It's recommended to commit before deploying"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Verify render.yaml exists
echo "✓ Checking render.yaml..."
if [ ! -f "render.yaml" ]; then
    echo "❌ Error: render.yaml not found!"
    exit 1
fi

# Check dependencies are installed
echo "✓ Checking dependencies..."
if [ ! -d "backend-mock/node_modules" ]; then
    echo "  Installing backend dependencies..."
    cd backend-mock
    npm install --production
    cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "  Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

echo ""
echo "✅ Deployment Preparation Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Go to https://render.com/dashboard"
echo "2. Click '+ New' → 'Blueprint'"
echo "3. Select your HarmonyTrack GitHub repository"
echo "4. Render will detect render.yaml automatically"
echo ""
echo "🔐 Before deploying, prepare:"
echo "   - SPOTIFY_CLIENT_ID (from https://developer.spotify.com/dashboard)"
echo "   - SPOTIFY_CLIENT_SECRET"
echo "   - JWT_SECRET (random secure string)"
echo "   - ENCRYPTION_KEY (random secure string)"
echo ""
echo "📖 Full guide: See RENDER_DEPLOYMENT.md"
echo ""
