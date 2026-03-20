# HarmonyTrack Backend Mock — Validation & Usage

Este README documenta las reglas de validación y algunos ejemplos de prueba para el servidor mock localizado en `backend-mock`.

## Reglas de validación principales

- `POST /api/auth/spotify/exchange`
  - body.code: string, 1..1024 chars (trimmed & escaped)

- `POST /api/mood`
  - body.happiness, energy, calmness, danceability: float entre 0 y 1
  - body.notes: optional string, max 2000 chars (trimmed & escaped)

- `GET /api/mood`
  - query.page: optional integer >=1
  - query.limit: optional integer 1..100

- `GET /api/mood/analytics`
  - query.start, end: ISO8601 date strings (YYYY-MM-DD)

- `GET /api/mood/trends`
  - query.period: optional `weekly` or `monthly`
  - query.count: optional int 1..52

- `POST /api/recommendations`
  - optional mood floats: same ranges as `/api/mood`

- `PUT /api/user`
  - body.name: optional string max 100 chars
  - body.email: optional valid email (normalized)

- Spotify proxy endpoints:
  - `GET /api/spotify/top-tracks` and `/api/spotify/top-artists`
    - query.time_range: optional one of `short_term|medium_term|long_term`
    - query.limit: optional int 1..50
  - `GET /api/spotify/recently-played`
    - query.limit: optional int 1..50
  - `GET /api/spotify/audio-features`
    - query.ids: required string (alphanumeric, comma, - _ :) length 1..1000

## Ejemplos de prueba (curl)

Obtener token demo (no requiere credenciales externas):

```
curl -s -X POST http://127.0.0.1:8081/api/auth/spotify -H "Content-Type: application/json" -d '{}'
```

Usando el token recibido en `Authorization: Bearer <token>`:

```
# Top tracks válido
curl -s "http://127.0.0.1:8081/api/spotify/top-tracks?limit=10&time_range=short_term" -H "Authorization: Bearer <token>"

# Top tracks inválido (limit demasiado grande -> 400)
curl -s "http://127.0.0.1:8081/api/spotify/top-tracks?limit=500" -H "Authorization: Bearer <token>"

# Audio features (ids válidos)
curl -s "http://127.0.0.1:8081/api/spotify/audio-features?ids=1,2,3" -H "Authorization: Bearer <token>"

# Analytics con fechas
curl -s "http://127.0.0.1:8081/api/mood/analytics?start=2024-02-01&end=2024-02-07" -H "Authorization: Bearer <token>"

# Crear mood (POST JSON)
curl -s -X POST "http://127.0.0.1:8081/api/mood" -H "Content-Type: application/json" -H "Authorization: Bearer <token>" -d '{"happiness":0.75,"energy":0.6,"calmness":0.7,"danceability":0.5}'
```

## Notas de pruebas realizadas

- Instalé `express-validator` y añadí validación/sanitización en las rutas listadas arriba.
- Probé la obtención del token demo y ejercicios rápidos de `/api/spotify/top-tracks` y `/api/auth/spotify/exchange` para verificar respuestas 200/400 según entradas válidas e inválidas.

Si quieres, puedo agregar pruebas automatizadas (scripts Mocha/Jest) para cubrir estos casos y ejecutarlas en CI local.

---
Generated on 2026-02-20 by dev tooling.

## Protección contra inyección (SQL/NoSQL/OS)

- Consultas a Postgres usan sentencias parametrizadas (`$1,$2...`) en `backend-mock/db.js` para prevenir SQL injection.
- Validación y sanitización en las rutas (via `express-validator`) evita entrada malformada antes de usarse en consultas o lógica.
- tokens.json ahora se escribe de forma atómica y se rechaza si no es un fichero regular (protege contra symlink/TOCTOU).
- El servidor aplica un límite de tamaño de cuerpo JSON (200kb) y usa `helmet` para cabeceras de seguridad.
- Hay helpers en `backend-mock/security.js` para validar rutas relativas seguras y escapar argumentos de shell si se necesita ejecutar procesos.

Si deseas, puedo:

- Añadir pruebas unitarias que intenten inyección (SQL/noSQL/OS) para verificar las protecciones.
- Migrar almacenamiento de refresh tokens a httpOnly cookies para reducir exposición en el frontend.

### Uso de cookies httpOnly para refresh tokens

- El servidor coloca ahora el refresh token en una cookie `refresh_token` httpOnly y secure cuando aplica. Esto evita que el frontend acceda al refresh token desde JavaScript.
- Flujo recomendado:
  - Tras el intercambio de código (`/api/auth/spotify/exchange`) o el callback, el backend establece la cookie httpOnly y devuelve el JWT de acceso (short-lived) al frontend.
  - Para renovar el JWT, el frontend debe llamar a `/api/auth/refresh` pasando el JWT expirado en la cabecera `Authorization: Bearer <expired_jwt>`; el servidor usará la cookie httpOnly para refrescar con Spotify y rotará la cookie si Spotify devuelve un nuevo refresh token.

Si quieres, adapto el frontend para dejar de guardar `refreshToken` en `localStorage` y usar este nuevo flujo cookie-based.

## Manejo de errores y excepciones

- Se añadió `express-async-errors` para que errores rechazados en handlers async sean atrapados por el middleware de error central.
- Hay un handler centralizado que: 1) registra error detallado junto con `requestId`, 2) responde al cliente con { error, errorId } sin filtrar stack traces por defecto, 3) admite `DEBUG_ERRORS=1` para incluir un mensaje sanitizado en respuestas en entornos de desarrollo.
- Hay listeners de proceso para `unhandledRejection` y `uncaughtException` (el último provoca salida del proceso tras loguear). En producción recomendamos integrar con un sistema de monitoreo (Sentry, Datadog, etc.) y un proceso supervisor que reinicie la app.

Recomendaciones:
- Establecer `DEBUG_ERRORS=0` en producción.
- Integrar un servicio de errores (Sentry/Beacon) para capturar `errorId` y detalles de stack para depuración.
- Para endpoints críticos, considerar wrapping adicional o circuit-breakers para degradado controlado.
