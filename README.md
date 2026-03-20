# 🎵 HarmonyTrack - Mood Tracking with Spotify Integration

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Platform](https://img.shields.io/badge/platform-web-blue)
![License](https://img.shields.io/badge/license-MIT-green)

HarmonyTrack es una aplicación web moderna que **analiza tu estado de ánimo (mood) a través de tu actividad en Spotify**. La aplicación detecta patrones musicales, crea visualizaciones animadas del mood y proporciona insights detallados sobre tus hábitos de escucha.

---

## 🚀 Quick Start (60 segundos)

### Windows (Recomendado)
```powershell
# 1. Doble-click en START_DEMO.bat
# ó ejecuta en PowerShell:
cd "c:\desarollo seguro"
npm run dev
```

### macOS / Linux
```bash
cd "c:\desarollo seguro"
npm run dev
```

Abre **http://localhost:3000** en tu navegador. ✅

---

## 📋 Flujo de Trabajo de la Aplicación

### 1. **Autenticación (Spotify OAuth 2.0)**

```
┌─────────────────────────────────────────────────────────────┐
│                      USER LOGIN FLOW                         │
└─────────────────────────────────────────────────────────────┘

1. Usuario hace click en "Connect with Spotify"
                    ↓
2. App redirige a https://accounts.spotify.com/authorize
                    ↓
3. Usuario autoriza permisos (top-tracks, recently-played, user-profile)
                    ↓
4. Spotify redirige con código: /callback?code=xxx
                    ↓
5. Backend mock intercambia código por access_token
     POST /api/auth/spotify/exchange { code }
                    ↓
6. Backend genera JWT (JSON Web Token)
     HS256, 24h expiration
                    ↓
7. JWT se almacena en localStorage
     Key: harmonytrack_token
                    ↓
8. Dashboard carga y obtiene datos de Spotify
```

**Archivos involucrados:**
- Frontend: `src/pages/Login.tsx`, `src/App.tsx`
- Backend: `backend-mock/server.js` (endpoints `/api/auth/*`)

---

### 2. **Carga de Datos Iniciales**

Una vez autenticado, el dashboard ejecuta 5 peticiones en paralelo:

```
Dashboard Component
        ↓
    useEffect (on mount)
        ↓
    Promise.allSettled([
      1. GET /api/spotify/profile          → User info, profile picture
      2. GET /api/spotify/top-tracks?term=short_term   → Top 20 tracks (últimas 4 semanas)
      3. GET /api/spotify/top-tracks?term=long_term    → Top 20 tracks (todo el tiempo)
      4. GET /api/spotify/top-artists      → Top 20 artists
      5. GET /api/spotify/recently-played  → Últimas 50 canciones
    ])
        ↓
    Audio Features Analysis
        ↓
    Mood Derivation (valence, energy, acousticness, danceability)
        ↓
    Render Dashboard
```

**Endpoints del Backend Mock:**
```
GET  /api/spotify/profile
GET  /api/spotify/top-tracks?time_range=XXX&limit=N
GET  /api/spotify/top-artists?time_range=XXX&limit=N
GET  /api/spotify/recently-played?limit=N
GET  /api/spotify/audio-features?ids=id1,id2,id3...
POST /api/auth/spotify/login
POST /api/auth/spotify/exchange { code }
POST /api/auth/refresh
```

---

### 3. **Derivación de Mood (Estado Emocional)**

La aplicación calcula el **mood** a partir de características de audio de Spotify:

```json
{
  "happiness":     valence      (0-1, qué tan positiva es la canción),
  "energy":        energy       (0-1, intensidad),
  "calmness":      acousticness (0-1, cuán acústica),
  "danceability":  danceability (0-1, cuán bailable)
}
```

**Lógica de Categorización:**
```
if (energy > 0.7 && happiness > 0.6) → "party" o "energetic"
else if (calmness > 0.7 && energy < 0.4) → "calm"
else if (happiness > 0.7) → "happy"
else if (happiness < 0.4 && energy < 0.5) → "melancholic"
else if (energy > 0.6) → "focused"
else → "introspective"
```

**Archivo:** `src/pages/Dashboard.tsx` (función `deriveMoodCategory`)

---

### 4. **Visualización en Tiempo Real**

```
┌─────────────────────────────────────────┐
│         DASHBOARD VISUALIZERS            │
├─────────────────────────────────────────┤
│ 1. ParticleField                        │
│    - Fondo animado con partículas       │
│    - Movimiento suave y continuo        │
│    - Deltatime clamped para estabilidad│
│                                          │
│ 2. WaveformVisualizer                   │
│    - Onda sonora canvas animada         │
│    - Sincronizada con mood              │
│    - Patrón de frecuencia visual        │
│                                          │
│ 3. MoodOrb                               │
│    - Esfera central que cambia color    │
│    - Indica mood actual (happy/calm/...) │
│    - Animaciones con anime.js           │
│                                          │
│ 4. TrendChart                            │
│    - Gráfico de tendencias de mood      │
│    - Últimos 7-30 días                  │
│    - Chart.js / recharts                │
└─────────────────────────────────────────┘
```

**Archivos:**
- `src/visualizers/ParticleField.tsx` - Sistema de partículas
- `src/visualizers/WaveformVisualizer.tsx` - Onda de audio
- `src/visualizers/MoodOrb.tsx` - Orbe central
- `src/components/TrendChart.tsx` - Gráfico de tendencias

---

### 5. **Análisis de Datos en Dashboard**

El dashboard muestra 3 tabs principales:

#### **Tab 1: Overview (Resumen)**
```
┌──────────────────────────────────┐
│ 👤 User Profile Card             │
├──────────────────────────────────┤
│ Username: {display_name}         │
│ Followers: {follower_count}      │
│ Top Genre: {mostCommonGenre}     │
│ Hours Listened: {totalHours}     │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ 🎵 MOOD STATS                    │
├──────────────────────────────────┤
│ Happiness:    [████░░░░] 0.62    │
│ Energy:       [██████░░] 0.75    │
│ Calmness:     [███░░░░░] 0.35    │
│ Danceability: [█████░░░] 0.68    │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ 🎵 TOP TRACKS (últimas 4 semanas)│
├──────────────────────────────────┤
│ 1. Song Name - Artist            │
│ 2. Song Name - Artist            │
│ ... (top 15)                     │
└──────────────────────────────────┘
```

#### **Tab 2: Evolution (Evolución)**
- Gráfico de tendencias de mood en el tiempo
- Resoluciones: Diaria, Semanal, Mensual
- Compara periodos de tiempo

#### **Tab 3: Patterns (Patrones)**
- Artistas más escuchados
- Géneros por hora del día
- Tempo promedio de canciones
- Patrones de escucha

---

### 6. **Sistema de Audio Feedback**

La app incluye efectos de sonido para UX mejorada:

```javascript
useAudioFeedback() → {
  playSound('click'),     // Click botones
  playSound('success'),   // Operación exitosa
  playSound('error'),     // Error ocurrido
  playSound('hover'),     // Hover elementos
  isEnabled              // Toggle on/off
}
```

**Archivos:**
- `src/audio/SoundEffects.ts` - Librería Web Audio API
- `src/hooks/useAudioFeedback.ts` - Hook custom

---

## 🏗️ Arquitectura

### Stack Tecnológico

```
┌─────────────────────────────────┐
│         FRONTEND                 │
│  ┌──────────────────────────────┐│
│  │ React 18 + TypeScript        ││
│  │ Vite (dev server)            ││
│  │ Tailwind CSS (estilos)       ││
│  └──────────────────────────────┘│
│  ┌──────────────────────────────┐│
│  │ Canvas Visualizers:          ││
│  │  - ParticleSystem            ││
│  │  - WaveformVisualizer        ││
│  │  - anime.js (animations)     ││
│  └──────────────────────────────┘│
│  ┌──────────────────────────────┐│
│  │ Data Visualization:          ││
│  │  - Chart.js                  ││
│  │  - recharts                  ││
│  └──────────────────────────────┘│
└─────────────────────────────────┘
         ↓ HTTP (API calls)
┌─────────────────────────────────┐
│      BACKEND MOCK (Dev)          │
│  ┌──────────────────────────────┐│
│  │ Node.js + Express            ││
│  │ Port: 8081                   ││
│  │ Spotify OAuth Proxy          ││
│  │ JWT Security                 ││
│  └──────────────────────────────┘│
└─────────────────────────────────┘
         ↓ HTTPS (API calls)
┌─────────────────────────────────┐
│    SPOTIFY WEB API               │
│  ┌──────────────────────────────┐│
│  │ /v1/me/top/tracks            ││
│  │ /v1/me/top/artists           ││
│  │ /v1/me/player/recently-played││
│  │ /v1/audio-features           ││
│  └──────────────────────────────┘│
└─────────────────────────────────┘
```

---

## 📁 Estructura del Proyecto

```
HarmonyTrack/
│
├── 📄 README.md                 (este archivo)
├── 📄 START_DEMO.bat           (quick start Windows)
├── 📄 DEMO_SETUP.md            (instrucciones setup)
├── 📄 START_HERE.md            (guía inicial)
├── .env                         (variables de entorno)
│
├── 📁 frontend/                (React + Vite SPA)
│   ├── src/
│   │   ├── App.tsx             (componente raíz)
│   │   ├── main.tsx            (entry point)
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.tsx        (OAuth login form)
│   │   │   ├── Dashboard.tsx    (main dashboard)
│   │   │   └── Recommendations.tsx
│   │   │
│   │   ├── visualizers/         (canvas-based visualizations)
│   │   │   ├── ParticleField.tsx
│   │   │   ├── WaveformVisualizer.tsx
│   │   │   └── MoodOrb.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── TrendChart.tsx
│   │   │   ├── PerformanceHUD.tsx
│   │   │   └── VolumeControl.tsx
│   │   │
│   │   ├── services/
│   │   │   ├── api.ts           (axios client + interceptors)
│   │   │   └── PlaylistEngine.ts
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAudioFeedback.ts
│   │   │   ├── useAnimeTimeline.ts
│   │   │   └── useToneVisualizer.ts
│   │   │
│   │   ├── animations/
│   │   │   ├── config.ts        (constants + timing)
│   │   │   └── particles.ts     (ParticleSystem class)
│   │   │
│   │   ├── audio/
│   │   │   └── SoundEffects.ts  (Web Audio API)
│   │   │
│   │   ├── data/
│   │   │   └── mockSpotifyData.ts (demo mode data)
│   │   │
│   │   └── utils/
│   │       └── performance.ts
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── 📁 backend-mock/             (Node.js Express server)
│   ├── server.js                (main server + routes)
│   ├── db.js                    (database/cache layer)
│   ├── security.js              (JWT + validation)
│   ├── tokenManager.js          (token encryption)
│   ├── package.json
│   └── tokens.json              (persistent token storage)
│
├── 📁 plans/                    (documentación de análisis)
│   └── authentication-flow-analysis.md
│
└── .gitignore
```

---

## 🔐 Seguridad

### Autenticación

**JWT (JSON Web Token)**
- Algoritmo: HS256
- Duración: 24 horas
- Almacenamiento: localStorage
- Refresh: Automático con interceptor

**Spotify OAuth 2.0**
- Client ID: Configurado en `.env`
- Redirect URI: `http://localhost:3000/callback`
- Scopes: `user-read-private`, `user-library-read`, `user-top-read`

### Headers de Seguridad

```javascript
// CORS habilitado para localhost
// Helmet.js para headers de seguridad
// Rate limiting en endpoints sensibles
```

### Validación de Entrada

```javascript
// Express Validator
- Sanitización de querystring
- Validación de formatos de usuario
- Rechazo de payloads grandes
```

---

## 🚀 Instalación y Ejecución

### Prerequisitos
- **Node.js** 18+
- **npm** o **yarn**
- **Spotify Developer Account** (opcional para modo demo)
- **Git**

### Pasos

#### 1. Clonar repositorio
```bash
git clone https://github.com/JONYDICK/HarmonyTrack.git
cd HarmonyTrack
```

#### 2. Instalar dependencias
```bash
# Backend mock
cd backend-mock
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..
```

#### 3. Configurar variables de entorno
```bash
# Crear .env en raíz
touch .env
```

**Contenido (.env):**
```env
# Spotify OAuth (obtén en https://developer.spotify.com/dashboard)
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback

# JWT
JWT_SECRET=dev_jwt_secret_change_in_production

# Database (opcional)
DATABASE_URL=postgresql://user:pass@localhost:5432/harmonytrack

# Encryption
ENCRYPTION_KEY=your_encryption_key_here
```

#### 4. Ejecutar en desarrollo

**Opción A: Windows (más fácil)**
```powershell
# Doble-click en START_DEMO.bat
```

**Opción B: Línea de comandos**
```bash
npm run dev
```

Esto inicia:
- Backend mock en `http://localhost:8081`
- Frontend en `http://localhost:3000`

#### 5. Acceder a la aplicación
```
http://localhost:3000
```

---

## 🔌 API Endpoints

### Autenticación

```http
GET /api/auth/spotify/login
  Response: { authUrl: "https://accounts.spotify.com/authorize?..." }

POST /api/auth/spotify/exchange
  Body: { code: "authorization_code_from_spotify" }
  Response: { token: "jwt_token", warning?: "spotify_403" }

POST /api/auth/refresh
  Headers: Authorization: Bearer {token}
  Response: { token: "new_jwt_token" }
```

### Datos de Spotify

```http
GET /api/spotify/profile
  Response: { id, display_name, images, followers, ... }

GET /api/spotify/top-tracks?time_range=short_term&limit=20
  Response: { items: [ { id, name, artists, album, duration_ms, ... } ] }

GET /api/spotify/top-artists?time_range=medium_term&limit=20
  Response: { items: [ { id, name, genres, images, popularity, ... } ] }

GET /api/spotify/recently-played?limit=50
  Response: { items: [ { track, played_at, ... } ] }

GET /api/spotify/audio-features?ids=id1,id2,id3
  Response: { audio_features: [ { danceability, energy, valence, ... } ] }
```

### Health Check

```http
GET /api/health
  Response: { status: "ok", database: "connected", cache: "connected" }
```

---

## 📊 Modo Demo

La aplicación incluye un **Demo Mode** que permite explorar todas las features sin conectar a Spotify.

**Activar Demo Mode:**
```javascript
// En navegador console:
localStorage.setItem('harmonytrack_demo', 'true');
location.reload();
```

**Datos incluidos:**
- Perfil de usuario demo
- Top tracks y artists
- Audio features simuladas
- Tendencias de mood

**Archivo:** `src/data/mockSpotifyData.ts`

---

## 🎨 Características Principales

✅ **Autenticación Segura**
- OAuth 2.0 con Spotify
- JWT con auto-refresh
- LocalStorage con fallback

✅ **Análisis de Mood**
- Derivación automática a partir de audio features
- Categorización emocional
- Cálculo de tendencias

✅ **Visualizaciones Avanzadas**
- Sistema de partículas animado
- Onda de audio en canvas
- Gráficos de tendencias interactivos
- Orbe central de mood

✅ **Audio Feedback**
- Efectos de sonido personalizados
- Control de volumen
- Web Audio API

✅ **Performance**
- GPU-accelerated canvas rendering
- Lazy loading de imágenes
- Code splitting con Vite
- Performance HUD (dev)

✅ **Responsive Design**
- Mobile-first approach
- Tailwind CSS utilities
- Soporte touch en visualizadores

---

## 🐛 Troubleshooting

### Puerto 8081 ya en uso
```powershell
# Matar todos los procesos Node
Stop-Process -Name node -Force

# Esperar 2 segundos
Start-Sleep -Seconds 2

# Reintentar
npm run dev
```

### Spotify 403 Forbidden
- Tu cuenta no está registrada en la app de Spotify
- Ve a: https://developer.spotify.com/dashboard → Tu app → Settings → User Management
- Agrega tu email de Spotify

### Dashboard no carga
1. Abre DevTools (F12)
2. Ve a Network tab
3. Recarga la página
4. Busca requests fallidas (status 403, 401, 500)
5. Verifica `.env` y credenciales de Spotify

### Animaciones lentas
- Abre Performance HUD (esquina superior derecha)
- Verifica FPS (debe estar > 30)
- Si es bajo, reduce PARTICLE_COUNT en `src/animations/config.ts`

---

## 📚 Documentación Adicional

- [DEMO_SETUP.md](./DEMO_SETUP.md) - Setup detallado
- [START_HERE.md](./START_HERE.md) - Quick start guide
- [plans/authentication-flow-analysis.md](./plans/authentication-flow-analysis.md) - Análisis técnico

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para contribuir:

1. Fork el repositorio
2. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](./LICENSE) para más detalles.

---

## 👨‍💻 Autor

**HarmonyTrack Development Team**
- GitHub: [@JONYDICK](https://github.com/JONYDICK)
- Repo: https://github.com/JONYDICK/HarmonyTrack

---

## 🎯 Roadmap

- [ ] Backend real (C++ con PostgreSQL)
- [ ] Análisis ML de mood patterns
- [ ] Recomendaciones personalizadas
- [ ] Comparativa con otros usuarios (anónima)
- [ ] Modo offline
- [ ] Exportar datos a PDF
- [ ] Integración con otras plataformas (Apple Music, YouTube Music)
- [ ] Mobile app (React Native)

---

**🎵 Hecho con ❤️ para los amantes de la música y el análisis de datos**
