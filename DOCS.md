# HarmonyTrack — Documentación Completa del Proyecto

> **Análisis de estado de ánimo a través de tu actividad musical en Spotify**

---

## Tabla de Contenidos

1. [Descripción General](#1-descripción-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Estructura del Proyecto](#4-estructura-del-proyecto)
5. [Backend (Node.js/Express)](#5-backend-nodejsexpress)
   - [Endpoints API](#51-endpoints-api-completos)
   - [Middleware](#52-middleware)
   - [Gestión de Tokens](#53-gestión-de-tokens)
   - [Base de Datos](#54-base-de-datos-postgresql---opcional)
6. [Frontend (React/TypeScript/Vite)](#6-frontend-reacttypescriptvite)
   - [Páginas](#61-páginas)
   - [Servicios API](#62-servicios-api)
   - [Componentes y Visualizadores](#63-componentes-y-visualizadores)
   - [Hooks Personalizados](#64-hooks-personalizados)
7. [Flujo de Autenticación OAuth 2.0](#7-flujo-de-autenticación-oauth-20)
8. [Algoritmo de Mood (Estado de Ánimo)](#8-algoritmo-de-mood-estado-de-ánimo)
9. [Sistema de Recomendaciones](#9-sistema-de-recomendaciones)
10. [Endpoint Agregado /api/spotify/all](#10-endpoint-agregado-apispotifyall)
11. [Variables de Entorno](#11-variables-de-entorno)
12. [Seguridad](#12-seguridad)
13. [Despliegue](#13-despliegue)
    - [Desarrollo Local](#131-desarrollo-local)
    - [Producción — Vercel](#132-producción--vercel)
    - [Producción — Render](#133-producción--render)
14. [Tests](#14-tests)
15. [Permisos de Spotify (Scopes)](#15-permisos-de-spotify-scopes)
16. [Referencia Rápida de Comandos](#16-referencia-rápida-de-comandos)

---

## 1. Descripción General

**HarmonyTrack** es una aplicación web que se conecta con tu cuenta de Spotify para analizar tu actividad musical y derivar tu estado de ánimo actual basándose en las características de audio de tus canciones recientes.

### Funcionalidades principales

- **Autenticación OAuth 2.0** con Spotify (flujo Authorization Code)
- **Dashboard interactivo** con 3 pestañas: Overview, Evolution, Patterns
- **Análisis de mood en tiempo real** calculado a partir de audio features (valence, energy, acousticness, danceability)
- **Visualizaciones animadas**: ParticleField, MoodOrb, WaveformVisualizer, TrendChart
- **Recomendaciones de playlists** basadas en tu estado de ánimo
- **Historial de mood** con analytics y tendencias
- **Audio feedback** interactivo con Tone.js
- **Persistencia de tokens** con cifrado AES-256-GCM (PostgreSQL opcional)

---

## 2. Stack Tecnológico

### Backend

| Capa | Tecnología | Versión |
|------|------------|---------|
| Runtime | Node.js | ≥ 18.0.0 |
| Framework | Express.js | ^4.18.2 |
| Autenticación | jsonwebtoken (JWT) | ^9.0.0 |
| OAuth | Spotify Web API | OAuth 2.0 |
| Validación | express-validator | ^7.0.1 |
| Seguridad | helmet, CORS | ^7.0.0, ^2.8.5 |
| HTTP Client | axios | ^1.13.5 |
| Base de Datos | PostgreSQL (pg) | ^8.11.0 |
| Cifrado | crypto (built-in) | AES-256-GCM |
| Env | dotenv | ^17.2.4 |
| Cookies | cookie-parser | ^1.4.6 |

### Frontend

| Capa | Tecnología | Versión |
|------|------------|---------|
| Lenguaje | TypeScript | ^5.2.2 |
| Framework | React | ^18.2.0 |
| Build Tool | Vite | ^5.0.2 |
| Estilos | TailwindCSS | ^3.3.6 |
| HTTP Client | axios | ^1.6.2 |
| JWT Parsing | jwt-decode | ^4.0.0 |
| Animaciones | anime.js | ^4.3.5 |
| Charts | Chart.js + react-chartjs-2 | ^4.4.0 + ^5.2.0 |
| Audio | Tone.js | ^15.1.22 |
| Fechas | date-fns | ^2.30.0 |
| Testing | Vitest + Testing Library | ^1.0.0 + ^14.0.0 |

### Despliegue

| Entorno | Plataforma | Tipo |
|---------|------------|------|
| Producción (actual) | Vercel | Serverless (backend) + Edge (frontend) |
| Producción (alternativa) | Render | Node.js (backend) + Static (frontend) |
| Desarrollo | Local | Node.js + Vite dev server |

---

## 3. Arquitectura del Sistema

```
┌──────────────────────────────────────────────────────────────────────┐
│                         ARQUITECTURA GENERAL                         │
└──────────────────────────────────────────────────────────────────────┘

  ┌─────────────────┐         ┌─────────────────────┐        ┌──────────────────┐
  │   USUARIO        │         │   FRONTEND           │        │   BACKEND         │
  │   (Navegador)    │◄───────►│   React/Vite/TS      │◄──────►│   Express/Node    │
  │                  │  HTTPS  │   Vercel Edge        │  HTTPS │   Vercel Lambda   │
  └─────────────────┘         └─────────────────────┘        └────────┬─────────┘
                                                                      │
                                                               ┌──────┴──────┐
                                                               │             │
                                                        ┌──────▼──────┐ ┌───▼────────┐
                                                        │  Spotify    │ │ PostgreSQL  │
                                                        │  Web API    │ │ (Opcional)  │
                                                        └─────────────┘ └────────────┘

  Frontend URL:  https://harmony-track-sigma.vercel.app
  Backend URL:   https://backend-mock-chi.vercel.app
  Spotify API:   https://api.spotify.com/v1/
```

### Flujo de datos principal

1. El usuario se autentica con Spotify OAuth 2.0
2. El backend genera un JWT con tokens de Spotify embebidos
3. El frontend hace **una sola llamada** a `GET /api/spotify/all`
4. El backend obtiene todos los datos de Spotify en paralelo dentro de una sola invocación Lambda
5. El frontend calcula el mood a partir de audio features y renderiza las visualizaciones

---

## 4. Estructura del Proyecto

```
harmonytrack/
├── backend-mock/                    # Backend Node.js/Express
│   ├── api/
│   │   └── index.js                 # Entry point Vercel Lambda
│   ├── server.js                    # Servidor Express (1300+ líneas)
│   ├── db.js                        # PostgreSQL + cifrado AES-256-GCM
│   ├── tokenManager.js              # Refresh con locking distribuido
│   ├── tokens.json                  # Almacenamiento local de tokens
│   ├── package.json                 # Dependencias + scripts
│   ├── vercel.json                  # Configuración Vercel (rewrites)
│   ├── .env                         # Variables de entorno (NO committear)
│   └── README.md                    # Validación y ejemplos cURL
│
├── frontend/                        # Frontend React/TypeScript
│   ├── src/
│   │   ├── App.tsx                  # Estado de auth + routing condicional
│   │   ├── main.tsx                 # Entry point React
│   │   ├── pages/
│   │   │   ├── Login.tsx            # Página de login con Spotify
│   │   │   ├── Dashboard.tsx        # Dashboard principal (3 tabs)
│   │   │   └── Recommendations.tsx  # Recomendaciones de playlists
│   │   ├── services/
│   │   │   ├── api.ts               # Axios + auto-refresh interceptor
│   │   │   └── PlaylistEngine.ts    # Motor de playlists
│   │   ├── components/
│   │   │   ├── DateRangeSelector.tsx # Selector de rango de fechas
│   │   │   ├── TrendChart.tsx       # Gráfico de tendencias (Chart.js)
│   │   │   ├── PerformanceHUD.tsx   # Monitor FPS/memoria (dev)
│   │   │   └── VolumeControl.tsx    # Control de volumen audio
│   │   ├── visualizers/
│   │   │   ├── ParticleField.tsx    # Sistema de partículas animado
│   │   │   ├── MoodOrb.tsx          # Esfera de mood con colores
│   │   │   └── WaveformVisualizer.tsx # Visualizador de ondas
│   │   ├── hooks/
│   │   │   ├── useAudioFeedback.ts  # Feedback de audio (Tone.js)
│   │   │   ├── useAnimeTimeline.ts  # Timeline anime.js
│   │   │   └── useToneVisualizer.ts # Analizador de frecuencias
│   │   ├── animations/
│   │   │   ├── config.ts            # Constantes de duración
│   │   │   └── particles.ts         # Física de partículas
│   │   ├── audio/
│   │   │   └── SoundEffects.ts      # Patches de sintetizador
│   │   ├── data/
│   │   │   └── mockSpotifyData.ts   # (Deprecated - solo tipos)
│   │   └── test/
│   │       └── setup.ts             # Configuración Vitest
│   ├── public/
│   │   ├── index.html               # HTML base
│   │   └── test.html                # Página de prueba
│   ├── package.json                 # Dependencias + scripts
│   ├── vite.config.ts               # Build + proxy + test config
│   ├── tsconfig.json                # TypeScript config
│   └── vitest.config.ts             # Config de testing
│
├── plans/                           # Documentos de análisis
│   └── authentication-flow-analysis.md
│
├── render.yaml                      # IaC para Render
├── vercel.json                      # Configuración Vercel frontend
├── START_DEMO.bat                   # Script one-click Windows
├── START_DEMO.ps1                   # Script one-click PowerShell
├── deploy-to-render.bat             # Script deploy Render
├── README.md                        # Readme principal
├── DEMO_SETUP.md                    # Guía setup demo
├── RENDER_DEPLOYMENT.md             # Guía deploy Render
├── RENDER_QUICK_START.md            # Quick start Render
└── START_HERE.md                    # Checklist rápido
```

---

## 5. Backend (Node.js/Express)

El backend es un servidor Express desplegado como función serverless en Vercel. Maneja autenticación OAuth, proxy de Spotify API, gestión de mood y recomendaciones.

### 5.1 Endpoints API Completos

#### Autenticación

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/auth/spotify/login` | No | Retorna `{authUrl}` para redirigir al usuario a Spotify |
| `GET` | `/api/auth/spotify/redirect` | No | Redirección directa HTTP a Spotify authorize |
| `GET` | `/callback` | No | Callback OAuth: intercambia code por tokens, redirige al frontend con JWT |
| `POST` | `/api/auth/spotify/exchange` | No | SPA endpoint: body `{code}` → retorna `{token, warning?}` |
| `POST` | `/api/auth/refresh` | No* | Usa JWT expirado + httpOnly cookie para refrescar tokens |
| `POST` | `/api/auth/logout` | Sí | Limpia cookie de refresh |

#### Usuario

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/user` | Sí | Retorna datos del usuario extraídos del JWT: `{id, email, name, spotifyId}` |
| `PUT` | `/api/user` | Sí | Actualiza perfil: body `{name?, email?}` |

#### Spotify Proxy

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/spotify/all` | Sí | **Endpoint agregado** — todos los datos del dashboard en una sola llamada |
| `GET` | `/api/spotify/profile` | Sí | Proxy a `GET https://api.spotify.com/v1/me` |
| `GET` | `/api/spotify/top-tracks` | Sí | Query: `time_range` (short/medium/long_term), `limit` |
| `GET` | `/api/spotify/top-artists` | Sí | Query: `time_range`, `limit` |
| `GET` | `/api/spotify/recently-played` | Sí | Query: `limit` (default 50) |
| `GET` | `/api/spotify/audio-features` | Sí | Query: `ids` (IDs de tracks separados por coma) |

#### Mood (Estado de Ánimo)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/mood` | Sí | Crear entrada de mood: `{happiness, energy, calmness, danceability}` (0-1), `notes?` |
| `GET` | `/api/mood` | Sí | Historial de mood: query `page?`, `limit?` (default 10) |
| `GET` | `/api/mood/latest` | Sí | Última entrada de mood registrada |
| `GET` | `/api/mood/analytics` | Sí | Análisis por rango: query `start`, `end` (ISO 8601) |
| `GET` | `/api/mood/trends` | Sí | Tendencias: query `period` (weekly/monthly), `count` (1-52) |
| `GET` | `/api/mood/insights` | Sí | Estadísticas: query `days?` → varianza, max, min, promedios |

#### Recomendaciones

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/recommendations` | Sí | 3 recomendaciones basadas en último mood con géneros y scores |
| `POST` | `/api/recommendations` | Sí | Recomendación personalizada: body `{happiness?, energy?, calmness?, danceability?}` |
| `GET` | `/api/recommendations/:id` | Sí | Obtener recomendación específica por ID |
| `POST` | `/api/recommendations/refresh` | Sí | Generar nuevas recomendaciones |

#### Utilidades

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/health` | No | Health check: `{status: 'ok', timestamp, apiVersion}` |
| `GET` | `/api/debug/spotify` | No | Diagnóstico: estado de client_id, usuarios almacenados |
| `GET` | `/api/db/users` | No | Listar usuarios PostgreSQL (si está configurado) |
| `POST` | `/api/db/clear` | No | Limpiar tabla de usuarios |
| `POST` | `/api/db/migrate-tokens` | No | Migrar tokens.json → PostgreSQL |

### 5.2 Middleware

| Middleware | Propósito |
|------------|-----------|
| **CORS** | Whitelist de orígenes permitidos (`ALLOWED_ORIGINS` env) |
| **helmet** | Headers de seguridad (CSP, X-Frame-Options, etc.) |
| **express.json** | Body parser con límite de 200KB |
| **cookie-parser** | Manejo de cookies httpOnly para refresh tokens |
| **Request ID** | Trazabilidad via `req.requestId` (UUID) |
| **verifyJWT** | Verificación de JWT con distinción `token_expired` vs `invalid_token` |

### 5.3 Gestión de Tokens

#### Flujo de refresh

```
JWT expirado (401 token_expired)
    │
    ├→ Frontend interceptor detecta 401
    │  POST /api/auth/refresh
    │  Authorization: Bearer <JWT_expirado>
    │  Cookie: refresh_token=<httpOnly_cookie>
    │
    ├→ Backend extrae user_id del JWT expirado
    │  Lee refresh_token de la cookie httpOnly
    │  POST https://accounts.spotify.com/api/token
    │    {grant_type: refresh_token, refresh_token, client_id, client_secret}
    │
    ├→ Spotify retorna nuevo access_token
    │  Backend crea nuevo JWT con token fresco
    │  Establece nueva cookie httpOnly si Spotify rota el refresh_token
    │  Retorna {token: nuevoJWT}
    │
    └→ Frontend almacena nuevo JWT, reintenta request original
       El usuario no nota interrupción
```

#### Almacenamiento de tokens

- **JWT** (24h): `localStorage` key `harmonytrack_token`
- **Refresh token** (30 días): Cookie httpOnly, secure, sameSite=lax
- **En servidor**: `global.userTokens` (memoria), `tokens.json` (archivo), PostgreSQL (si configurado)
- **Cifrado DB**: AES-256-GCM con IV + auth tag para refresh tokens en PostgreSQL

#### Locking de refresh (serverless)

El archivo `tokenManager.js` implementa locking por usuario para evitar que múltiples invocaciones Lambda refresquen el mismo token simultáneamente:

```javascript
// refreshLocks[userId] = Promise que representa un refresh en progreso
// Si otro request llega y ya hay un lock, espera al resultado
```

### 5.4 Base de Datos PostgreSQL (Opcional)

**Tabla**: `spotify_users`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `spotify_id` | VARCHAR (PK) | ID de Spotify del usuario |
| `email` | VARCHAR | Email del usuario |
| `display_name` | VARCHAR | Nombre para mostrar |
| `profile` | JSONB | Perfil completo de Spotify |
| `access_token` | TEXT | Token de acceso actual |
| `refresh_token` | TEXT | Refresh token (plano, legacy) |
| `encrypted_refresh_token` | TEXT | Refresh token cifrado AES-256-GCM |
| `expires_at` | BIGINT | Timestamp de expiración (ms) |
| `cached_data` | JSONB | Datos cacheados del dashboard |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Última actualización |

---

## 6. Frontend (React/TypeScript/Vite)

### 6.1 Páginas

#### App.tsx — Estado de Autenticación

Controla el flujo de autenticación sin React Router (renderizado condicional):

1. **Al montar**: Revisa URL params (`logout`, `error`, `token`, `code`)
2. **Si hay `code`**: Intercambia por JWT via `POST /api/auth/spotify/exchange`
3. **Si hay token en localStorage**: Valida con `POST /api/auth/refresh`
4. **Renderiza**: `<Dashboard />` si autenticado, `<Login />` si no

```tsx
{isAuthenticated ? <Dashboard /> : <Login onLoginSuccess={handleLoginSuccess} />}
```

#### Login.tsx — Página de Login

- Botón "Connect with Spotify" que redirige a Spotify OAuth
- Animaciones de entrada con anime.js (scale, opacity, glow)
- Feedback de audio interactivo
- Display de errores con detalles expandibles

#### Dashboard.tsx — Dashboard Principal

**Estado que maneja:**

| Estado | Tipo | Fuente |
|--------|------|--------|
| `profile` | `SpotifyProfile` | `/api/spotify/all` → `.profile` |
| `topTracks` | `SpotifyTrack[]` | `/api/spotify/all` → `.topTracks.items` |
| `topTracksLong` | `SpotifyTrack[]` | `/api/spotify/all` → `.topTracksLong.items` |
| `topArtists` | `SpotifyArtist[]` | `/api/spotify/all` → `.topArtists.items` |
| `recentlyPlayed` | `RecentItem[]` | `/api/spotify/all` → `.recentlyPlayed.items` |
| `audioFeatures` | `AudioFeature[]` | `/api/spotify/all` → `.audioFeatures.audio_features` |
| `moodData` | `MoodData` | Calculado del promedio de audio features |
| `moodFromRealData` | `boolean` | `true` si calculado de datos reales |
| `activeTab` | `string` | Pestaña activa: overview / evolution / patterns |

**Pestañas:**

1. **Overview**: Perfil del usuario, mood actual, top tracks, artistas favoritos
2. **Evolution**: Tendencias de mood, analytics por rango de fechas
3. **Patterns**: Patrones de escucha, clusters de géneros, recomendaciones

#### Recommendations.tsx — Recomendaciones

- Obtiene 3 recomendaciones de playlists basadas en mood
- Animación de card flip con anime.js
- Panel de detalles con géneros y mood scores
- Botón para generar nuevas recomendaciones

### 6.2 Servicios API

**Archivo**: `src/services/api.ts`

```typescript
// Configuración base
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081',
  timeout: 10000,
});

// Interceptor de request: inyecta JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('harmonytrack_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor de response: auto-refresh en 401 token_expired
api.interceptors.response.use(response => response, async (error) => {
  if (error.response?.status === 401 && error.response.data?.error === 'token_expired') {
    // Refresca JWT, reintenta request original
  }
});
```

**Servicios disponibles:**

| Servicio | Métodos |
|----------|---------|
| `spotifyAuthService` | `getAuthURL()`, `exchangeCodeForToken(code)` |
| `spotifyService` | `getAllData()`, `getProfile()`, `getTopTracks()`, `getTopArtists()`, `getRecentlyPlayed()`, `getAudioFeatures(ids)` |
| `moodService` | `getCurrentMood()`, `getMoodHistory()`, `getMoodTrends()`, `getMoodAnalytics()`, `getMoodInsights()` |

### 6.3 Componentes y Visualizadores

| Componente | Propósito |
|------------|-----------|
| `ParticleField` | Sistema de partículas animado como fondo del dashboard |
| `MoodOrb` | Esfera central que cambia de color según el mood |
| `WaveformVisualizer` | Visualizador de ondas en canvas |
| `TrendChart` | Gráfico de tendencias de mood (Chart.js) |
| `DateRangeSelector` | Widget de calendario para analytics |
| `VolumeControl` | Control de volumen para audio feedback |
| `PerformanceHUD` | Monitor de FPS y memoria (solo desarrollo) |

### 6.4 Hooks Personalizados

| Hook | Propósito |
|------|-----------|
| `useAudioFeedback` | Wrapper de Tone.js para sonidos de mood |
| `useAnimeTimeline` | Gestión de timelines de anime.js |
| `useToneVisualizer` | Analizador de frecuencias Web Audio API |

---

## 7. Flujo de Autenticación OAuth 2.0

```
┌──────────┐         ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  USUARIO │         │   FRONTEND   │         │   BACKEND    │         │  SPOTIFY API │
│(Navegador│         │  React/Vite  │         │  Express     │         │              │
└────┬─────┘         └──────┬───────┘         └──────┬───────┘         └──────┬───────┘
     │                      │                        │                        │
     │  1. Click "Connect"  │                        │                        │
     ├─────────────────────►│                        │                        │
     │                      │                        │                        │
     │                      │  2. GET /api/auth/     │                        │
     │                      │     spotify/login      │                        │
     │                      ├───────────────────────►│                        │
     │                      │  ◄─ {authUrl}          │                        │
     │                      │◄───────────────────────┤                        │
     │                      │                        │                        │
     │  3. Redirect a Spotify (window.location.href = authUrl)               │
     ├──────────────────────────────────────────────────────────────────────►│
     │                                                                       │
     │  4. Usuario autoriza la app en Spotify                                │
     │                                                                       │
     │  5. Spotify redirige: /callback?code=XXXX                             │
     │◄──────────────────────────────────────────────────────────────────────┤
     │                      │                        │                        │
     │  6. Frontend detecta │                        │                        │
     │     ?code en URL     │                        │                        │
     │                      │  7. POST /api/auth/    │                        │
     │                      │     spotify/exchange   │                        │
     │                      │     {code: "XXXX"}     │                        │
     │                      ├───────────────────────►│                        │
     │                      │                        │                        │
     │                      │                        │  8. POST /api/token    │
     │                      │                        │  (code → tokens)       │
     │                      │                        ├───────────────────────►│
     │                      │                        │  ◄─ {access_token,    │
     │                      │                        │      refresh_token,    │
     │                      │                        │      expires_in}       │
     │                      │                        │◄───────────────────────┤
     │                      │                        │                        │
     │                      │                        │  9. GET /v1/me         │
     │                      │                        │  (fetch perfil)        │
     │                      │                        ├───────────────────────►│
     │                      │                        │◄───────────────────────┤
     │                      │                        │                        │
     │                      │                        │  10. Crear JWT (24h)   │
     │                      │                        │  con tokens embebidos  │
     │                      │                        │  + guardar en server   │
     │                      │                        │                        │
     │                      │  ◄─ {token: JWT}       │                        │
     │                      │◄───────────────────────┤                        │
     │                      │                        │                        │
     │                      │  11. localStorage.set  │                        │
     │                      │  ('harmonytrack_token') │                       │
     │                      │                        │                        │
     │  12. Mostrar Dashboard                        │                        │
     │◄─────────────────────┤                        │                        │
     │                      │                        │                        │
```

### Requests autenticados subsiguientes

```
Frontend                          Backend                         Spotify API
   │                                │                                │
   │  GET /api/spotify/all          │                                │
   │  Authorization: Bearer JWT     │                                │
   ├───────────────────────────────►│                                │
   │                                │                                │
   │                                │  Verificar JWT                 │
   │                                │  Extraer user_id               │
   │                                │  Obtener Spotify access_token  │
   │                                │  (de JWT o global.userTokens)  │
   │                                │                                │
   │                                │  Si token expirado:            │
   │                                │  → Refrescar con refresh_token │
   │                                │                                │
   │                                │  GET /v1/me                    │
   │                                │  GET /v1/me/top/tracks (x2)    │
   │                                │  GET /v1/me/top/artists        │
   │                                │  GET /v1/me/player/recently... │
   │                                ├───────────────────────────────►│
   │                                │◄───────────────────────────────┤
   │                                │                                │
   │                                │  GET /v1/audio-features        │
   │                                │  (con IDs de recently-played)  │
   │                                ├───────────────────────────────►│
   │                                │◄───────────────────────────────┤
   │                                │                                │
   │  ◄─ {profile, topTracks,       │                                │
   │      topTracksLong, topArtists,│                                │
   │      recentlyPlayed,           │                                │
   │      audioFeatures}            │                                │
   │◄───────────────────────────────┤                                │
   │                                │                                │
```

---

## 8. Algoritmo de Mood (Estado de Ánimo)

### Paso 1: Obtener Audio Features

Se obtienen las **audio features** de Spotify para los últimos 50 tracks reproducidos. Cada track tiene:

| Feature | Rango | Significado |
|---------|-------|-------------|
| `valence` | 0.0 – 1.0 | Positividad musical (alegre vs triste) |
| `energy` | 0.0 – 1.0 | Intensidad y actividad |
| `acousticness` | 0.0 – 1.0 | Probabilidad de ser acústico |
| `danceability` | 0.0 – 1.0 | Regularidad rítmica para bailar |
| `instrumentalness` | 0.0 – 1.0 | Predicción de ausencia de voz |
| `tempo` | BPM | Beats por minuto |

### Paso 2: Calcular Promedios

```typescript
moodData = {
  happiness:    promedio(tracks.map(t => t.valence)),
  energy:       promedio(tracks.map(t => t.energy)),
  calmness:     promedio(tracks.map(t => t.acousticness)),
  danceability: promedio(tracks.map(t => t.danceability)),
};
```

### Paso 3: Categorizar

```javascript
function deriveMoodCategory(mood) {
  if (mood.energy > 0.7 && mood.happiness > 0.6)
    return mood.danceability > 0.6 ? 'party' : 'energetic';
  if (mood.calmness > 0.7 && mood.energy < 0.4)   return 'calm';
  if (mood.happiness > 0.7)                         return 'happy';
  if (mood.happiness < 0.4 && mood.energy < 0.5)   return 'melancholic';
  if (mood.energy > 0.6)                            return 'focused';
  return 'introspective';
}
```

### Categorías de Mood

| Categoría | Condición | Color Visual |
|-----------|-----------|--------------|
| `party` | energy > 0.7, happiness > 0.6, dance > 0.6 | Rosa/Magenta |
| `energetic` | energy > 0.7, happiness > 0.6, dance ≤ 0.6 | Rojo/Naranja |
| `calm` | calmness > 0.7, energy < 0.4 | Azul claro |
| `happy` | happiness > 0.7 | Amarillo/Dorado |
| `melancholic` | happiness < 0.4, energy < 0.5 | Azul oscuro |
| `focused` | energy > 0.6 | Verde |
| `introspective` | (default) | Púrpura |

---

## 9. Sistema de Recomendaciones

El backend genera recomendaciones de playlists basadas en la categoría de mood:

### Géneros por Categoría

| Categoría | Géneros |
|-----------|---------|
| `party` | dance, electronic, hip-hop, edm |
| `energetic` | dance, electronic, hip-hop, pop |
| `calm` | ambient, chill, lo-fi, indie-pop |
| `happy` | pop, indie-pop, funk, dance-pop |
| `melancholic` | indie, alternative, soul, folk |
| `focused` | electronic, ambient, classical, lo-fi |
| `romantic` | r-and-b, soul, indie-pop, pop |
| `introspective` | indie, alternative, singer-songwriter, folk |

### Estructura de una Recomendación

```json
{
  "id": "rec_1234",
  "name": "Vibes Nocturnas",
  "description": "Playlist para tu mood actual",
  "mood_category": "calm",
  "confidence": 0.87,
  "mood_score": {
    "happiness": 0.45,
    "energy": 0.30,
    "calmness": 0.80,
    "danceability": 0.35
  },
  "genres": ["ambient", "chill", "lo-fi"],
  "tracks": [...]
}
```

---

## 10. Endpoint Agregado /api/spotify/all

### Problema identificado en Serverless

Anteriormente, el Dashboard hacía **5 requests HTTP en paralelo** a endpoints individuales:
- `/api/spotify/profile`
- `/api/spotify/top-tracks?time_range=short_term`
- `/api/spotify/top-tracks?time_range=long_term`
- `/api/spotify/top-artists`
- `/api/spotify/recently-played`

En Vercel, cada request puede aterrizar en una **instancia Lambda diferente**. Cada instancia:
1. Arranca en frío con `global.userTokens` vacío
2. Lee el token de Spotify del JWT (posiblemente expirado)
3. Intenta refrescar el token independientemente

**Race condition**: 5 instancias compiten para refrescar el mismo token → algunas obtienen token válido, otras fallan por rate limiting o rotación de token.

### Solución: Endpoint Agregado

`GET /api/spotify/all` ejecuta TODO en una sola invocación Lambda:

```
1. Verificar JWT (una vez)
2. Obtener/refrescar Spotify token (una vez)
3. Fetch paralelo server-side con el MISMO token:
   - GET /v1/me
   - GET /v1/me/top/tracks (short_term)
   - GET /v1/me/top/tracks (long_term)
   - GET /v1/me/top/artists
   - GET /v1/me/player/recently-played
4. Fetch audio features (con IDs obtenidos del paso anterior)
5. Retornar JSON agregado
```

### Respuesta del endpoint

```json
{
  "profile": { "id": "...", "display_name": "...", "images": [...], ... },
  "topTracks": { "items": [...], "total": 20 },
  "topTracksLong": { "items": [...], "total": 20 },
  "topArtists": { "items": [...], "total": 20 },
  "recentlyPlayed": { "items": [...] },
  "audioFeatures": { "audio_features": [...] },
  "_failures": ["artists:429"]
}
```

- Si alguna sub-llamada falla, el campo correspondiente es `null`
- `_failures` lista las fallas parciales para debugging
- Si TODAS fallan con 401, se fuerza un refresh y se reintenta automáticamente

---

## 11. Variables de Entorno

### Backend (`backend-mock/.env`)

| Variable | Requerida | Default | Descripción |
|----------|-----------|---------|-------------|
| `SPOTIFY_CLIENT_ID` | **Sí** | — | Client ID de tu app Spotify |
| `SPOTIFY_CLIENT_SECRET` | **Sí** | — | Client Secret de tu app Spotify |
| `SPOTIFY_REDIRECT_URI` | **Sí** | `http://127.0.0.1:3000/callback` | URI de callback OAuth |
| `JWT_SECRET` | **Sí** | `dev_jwt_secret` | Clave secreta para firmar JWT (32+ chars) |
| `PORT` | No | `8081` | Puerto del servidor |
| `NODE_ENV` | No | `development` | Entorno (development/production) |
| `FRONTEND_URL` | No | `http://localhost:3000` | URL del frontend para CORS |
| `ALLOWED_ORIGINS` | No | (auto) | Orígenes CORS adicionales separados por coma |
| `DATABASE_URL` | No | — | URL de PostgreSQL para persistencia |
| `SPOTIFY_TOKEN_ENCRYPTION_KEY` | No | — | Clave AES-256 Base64 para cifrar refresh tokens en DB |
| `COOKIE_SECURE` | No | `0` | `1` para cookies Secure (HTTPS) en producción |
| `LOG_LEVEL` | No | `debug` | Nivel de logging: debug/info/warn/error |

### Frontend

| Variable | Requerida | Default | Descripción |
|----------|-----------|---------|-------------|
| `VITE_API_URL` | No | `http://localhost:8081` | URL base del backend API |

---

## 12. Seguridad

### Autenticación y Tokens

| Medida | Implementación |
|--------|---------------|
| JWT firmado | HS256 con `JWT_SECRET` de 32+ caracteres |
| Expiración JWT | 24 horas |
| Refresh Token | Cookie httpOnly, Secure, SameSite=Lax (30 días) |
| Cifrado en DB | AES-256-GCM para refresh tokens en PostgreSQL |
| Escritura atómica | Tokens escritos a `.tmp` y renombrados |

### Headers de Seguridad

| Header | Estado |
|--------|--------|
| Content-Security-Policy | Habilitado (Helmet) |
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Strict-Transport-Security | Habilitado |
| X-XSS-Protection | 1; mode=block |

### Validación de Input

| Medida | Implementación |
|--------|---------------|
| Body parser | Límite 200KB JSON |
| express-validator | Todos los endpoints validan/sanitizan |
| Mood values | Float 0.0-1.0, rechaza fuera de rango |
| Query params | Type checking, allowlists |
| `.escape()` | Sanitización XSS en inputs de texto |

### CORS

| Configuración | Valor |
|--------------|-------|
| Orígenes | Whitelist explícita (no `*`) |
| Credentials | `true` (para cookies) |
| Methods | GET, POST, PUT, DELETE, OPTIONS |

### Prevención de Inyección SQL

- Queries parametrizadas con `$1, $2...` en PostgreSQL
- Sin concatenación de strings en queries

---

## 13. Despliegue

### 13.1 Desarrollo Local

```bash
# Terminal 1: Backend
cd backend-mock
npm install
npm start
# → http://localhost:8081

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
# → http://localhost:3000
# El proxy de Vite redirige /api a localhost:8081
```

**One-click (Windows)**:
```bash
START_DEMO.bat
# Lanza backend y frontend en ventanas separadas
```

### 13.2 Producción — Vercel

**URLs actuales:**
- Frontend: `https://harmony-track-sigma.vercel.app`
- Backend: `https://backend-mock-chi.vercel.app`

**Configuración Frontend** (`vercel.json` raíz):
```json
{
  "buildCommand": "cd frontend && npm install && npx vite build",
  "outputDirectory": "frontend/dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**Configuración Backend** (`backend-mock/vercel.json`):
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/api" }]
}
```

**Entry point Lambda** (`backend-mock/api/index.js`):
```javascript
const app = require('../server');
module.exports = app;
```

**Despliegue:**
- **Frontend**: Auto-deploy con `git push origin main`
- **Backend**: Deploy manual con `cd backend-mock && vercel --prod --yes`

### 13.3 Producción — Render

**Configuración**: `render.yaml` (Infrastructure as Code)

```yaml
services:
  - type: web
    name: harmonytrack-backend
    runtime: node
    region: oregon
    buildCommand: cd backend-mock && npm install
    startCommand: cd backend-mock && npm start
    envVars: [PORT, JWT_SECRET, SPOTIFY_*, ENCRYPTION_KEY, ...]

  - type: web
    name: harmonytrack-frontend
    runtime: node
    buildCommand: cd frontend && npm install && npm run build && npm install serve
    startCommand: npx serve frontend/dist -s -l $PORT
    envVars: [VITE_API_URL]
```

**Post-deploy**: Actualizar `SPOTIFY_REDIRECT_URI` con la URL real del frontend.

---

## 14. Tests

### Framework

- **Vitest** (test runner nativo de Vite)
- **@testing-library/react** para tests de componentes
- **jsdom** como entorno de DOM simulado

### Archivos de Test

| Archivo | Qué prueba |
|---------|------------|
| `frontend/src/pages/Login.test.tsx` | Componente Login: render, clicks, OAuth redirect |
| `frontend/src/components/DateRangeSelector.test.tsx` | Selector de fechas: selección, validación |
| `frontend/src/components/TrendChart.test.tsx` | Gráfico de tendencias: render con datos |
| `frontend/src/services/api.test.ts` | Interceptores Axios: JWT injection, auto-refresh |

### Comandos

```bash
cd frontend

# Ejecutar tests una vez
npm run test

# UI interactiva
npm run test:ui

# Generar reporte de cobertura
npm run test:coverage
```

### Configuración (`vite.config.ts`)

```typescript
test: {
  globals: true,
  environment: 'jsdom',
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    exclude: ['node_modules/', 'dist/', '**/*.config.ts']
  }
}
```

---

## 15. Permisos de Spotify (Scopes)

| Scope | Uso |
|-------|-----|
| `user-read-private` | Acceder a información privada de la cuenta |
| `user-read-email` | Leer email del usuario |
| `user-top-read` | Obtener top tracks y artistas |
| `user-read-recently-played` | Obtener historial de reproducción reciente |
| `user-library-read` | Leer biblioteca de tracks guardados |
| `user-read-playback-state` | Leer estado de reproducción actual |

---

## 16. Referencia Rápida de Comandos

### Desarrollo

```bash
# Instalar dependencias
cd backend-mock && npm install
cd frontend && npm install

# Iniciar backend (localhost:8081)
cd backend-mock && npm start

# Iniciar frontend (localhost:3000)
cd frontend && npm run dev

# Build de producción
cd frontend && npx vite build
```

### Testing

```bash
cd frontend
npm run test              # Tests una vez
npm run test:ui           # UI interactiva
npm run test:coverage     # Cobertura
```

### Deploy

```bash
# Push frontend (auto-deploy Vercel)
git add -A && git commit -m "..." && git push origin main

# Deploy backend manual (Vercel)
cd backend-mock && vercel --prod --yes

# Deploy Render (auto via git push si está conectado)
git push origin main
```

### Diagnóstico

```bash
# Health check backend
curl https://backend-mock-chi.vercel.app/health

# Debug Spotify config
curl https://backend-mock-chi.vercel.app/api/debug/spotify

# Ver logs Vercel
vercel logs https://backend-mock-chi.vercel.app
```

---

*Documentación generada para HarmonyTrack — Marzo 2026*
