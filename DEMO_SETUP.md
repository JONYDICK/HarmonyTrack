# 🎵 HarmonyTrack - Guía de Demostración

**Última actualización:** 20 Febrero 2026  
**Presentación:** Mañana ✨

---

## ⚡ Quick Start (5 minutos)

Si todo está configurado:

```powershell
# Terminal 1: Backend
cd "c:\desarollo seguro\backend-mock"
npm start

# Terminal 2: Frontend  
cd "c:\desarollo seguro\frontend"
npm run dev
```

Luego abre en navegador: **http://localhost:3000**

---

## 📋 Configuración Completa (10-15 minutos)

### Paso 1: Obtén credenciales Spotify

1. Ve a https://developer.spotify.com/dashboard
2. Inicia sesión o crea cuenta
3. Crea una "Application" llamada "HarmonyTrack"
4. Acepta términos
5. Copia tu **Client ID** y **Client Secret**
6. En "Edit Settings" → "Redirect URIs" agrega:
   ```
   http://localhost:3000/callback
   http://127.0.0.1:3000/callback
   ```
7. Guarda cambios

### Paso 2: Configura variables de entorno

Edita `c:\desarollo seguro\backend-mock\.env`:

```dotenv
DATABASE_URL=postgres://harmonytrack:harmonytrack_dev@127.0.0.1:5432/harmonytrack
SPOTIFY_CLIENT_ID=YOUR_CLIENT_ID_HERE
SPOTIFY_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
NODE_ENV=development
PORT=8081
JWT_SECRET=dev_jwt_secret_change_in_production
SPOTIFY_TOKEN_ENCRYPTION_KEY=w7Zs9s8Kk1b3X2v6Yq0pR8uN5tV3yZ1a4sQ6eR9tU0o=
```

**IMPORTANTE:** Reemplaza `YOUR_CLIENT_ID_HERE` y `YOUR_CLIENT_SECRET_HERE` con valores REALES de Spotify.

### Paso 3: Instala dependencias

```powershell
cd "c:\desarollo seguro\backend-mock"
npm install

cd "c:\desarollo seguro\frontend"
npm install
```

### Paso 4: Inicia los servidores

**Terminal 1 - Backend:**
```powershell
cd "c:\desarollo seguro\backend-mock"
npm start
# Debes ver: ✓ Server running on port 8081
```

**Terminal 2 - Frontend:**
```powershell
cd "c:\desarollo seguro\frontend"
npm run dev
# Debes ver: ➜ Local:   http://localhost:3000/
```

### Paso 5: Accede a la app

1. Abre en navegador: **http://localhost:3000**
2. Haz click en "Connect with Spotify"
3. Autoriza en Spotify
4. ¡Debería mostrar el dashboard! 🎉

---

## 🧪 Verifica que TODO funciona

**Antes de la presentación (30 minutos antes):**

```powershell
# 1. Backend responde?
curl http://localhost:8081/health
# Response: {"status":"ok", ...}

# 2. Frontend accesible?
curl http://localhost:3000 | Select-String "<!DOCTYPE"
# Response: <!DOCTYPE

# 3. OAuth endpoint funciona?
curl http://localhost:8081/api/auth/spotify/login
# Response: {"authUrl":"https://accounts.spotify.com/authorize?..."}
```

---

## 🆘 Troubleshooting

### Error: "Cannot find module 'express'"
→ Ejecuta `npm install` en esa carpeta

### Error: "CORS not allowed for origin"
→ Asegúrate que estés en `http://localhost:3000` (no `127.0.0.1:3000`)

### Error: "SPOTIFY_CLIENT_ID is not configured"
→ Verifica que backend-mock/.env tiene credenciales reales (no placeholders)

### Error: "Port 8081 already in use"
→ Ejecuta: `Stop-Process -Name node -Force`

### Error: "Port 3000 already in use"
→ Ejecuta en otra terminal: `Stop-Process -Name node -Force`

### Error: "authorization_pending" en Spotify login
→ Spotify credenciales pueden estar expiradas o no registradas

---

## 📊 Flujo de Demo Recomendado

1. **Login Screen** → Explicar OAuth real con Spotify
2. **Click "Connect Spotify"** → Mostrar redirección a Spotify
3. **Autorizar** → Explicar permisos solicitados
4. **Dashboard** → Mostrar métricas de mood
5. **Gráficos** → Tendencias semanales/mensuales  
6. **Análisis** → Features de personalización

---

## 💡 Puntos Clave a Resaltar

✅ **OAuth Real** - Autenticación verdadera con Spotify  
✅ **Responsive Design** - Funciona en móviles y desktop  
✅ **Gráficos Dinámicos** - Visualización de datos en tiempo real  
✅ **JWT Security** - Tokens seguros y encriptados  
✅ **Mood Tracking** - Análisis de patrones de ánimo

---

## ⚠️ Limitaciones Conocidas (Mencionar si preguntan)

- Recomendaciones de playlists son mock (para MVP, sistema de recomendaciones educativo)
- Base de datos no persistente entre sesiones (por ahora en memoria)
- Audio feedback es demonstrativo

---

## 🎯 Tiempo Estimado de Demo

- Configuración inicial: 5 min
- Demo del flujo completo: 5-10 min  
- Preguntas y explicación técnica: 10-15 min

**Total recomendado: 20-30 minutos**

---

**¡Listo para la presentación!** 🎉

Si algo no funciona, revisa:
1. ✅ Credenciales Spotify en backend-mock/.env
2. ✅ Ambos servidores corriendo (npm start y npm run dev)
3. ✅ URL correcta: http://localhost:3000 (no 127.0.0.1)
