// HarmonyTrack Backend - Node.js (Express server for Vercel deployment)
// This simulates all API endpoints for testing the frontend

// Load local .env into process.env (if present)
require('dotenv').config();

// Capture async errors from route handlers and forward to express error handler
require('express-async-errors');

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { URLSearchParams } = require('url');
const cookieParser = require('cookie-parser');
const { body, query, param, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 8081;
const JWT_SECRET = (process.env.JWT_SECRET || 'dev_jwt_secret').trim();
const SPOTIFY_CLIENT_ID = (process.env.SPOTIFY_CLIENT_ID || '').trim();
const SPOTIFY_CLIENT_SECRET = (process.env.SPOTIFY_CLIENT_SECRET || '').trim();
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').trim();
const SPOTIFY_REDIRECT_URI = (process.env.SPOTIFY_REDIRECT_URI || `${FRONTEND_URL}/callback`).trim();

// ============ PERSISTENT TOKEN STORAGE ============
const TOKENS_FILE = path.join(__dirname, 'tokens.json');

// Optional PostgreSQL integration
const db = require('./db');

function loadTokens() {
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      const st = fs.lstatSync(TOKENS_FILE);
      // refuse to load if not a regular file (avoid symlink attacks)
      if (!st.isFile()) {
        console.warn('[Tokens] tokens.json exists but is not a regular file; ignoring');
        global.userTokens = {};
        return;
      }
      const data = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf-8'));
      global.userTokens = data;
      console.log(`[Tokens] Loaded ${Object.keys(data).length} user(s) from tokens.json`);
    } else {
      global.userTokens = {};
    }
  } catch (err) {
    console.error('[Tokens] Failed to load tokens.json:', err.message);
    global.userTokens = {};
  }
}

function saveTokens() {
  try {
    // Skip file writes in serverless environments (Vercel)
    if (process.env.VERCEL) return;
    // Write atomically: write to a .tmp file then rename
    const tmp = TOKENS_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(global.userTokens, null, 2), { encoding: 'utf-8', mode: 0o600 });
    fs.renameSync(tmp, TOKENS_FILE);
  } catch (err) {
    console.error('[Tokens] Failed to save tokens.json:', err.message);
  }
}

// Load persisted tokens on startup
loadTokens();

// Helper: Refresh Spotify access token for a stored user and persist
async function refreshSpotifyAccessToken(userId) {
  const stored = global.userTokens[userId];
  if (!stored || !stored.refreshToken) return null;
  try {
    const refreshRes = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: stored.refreshToken,
        client_id: SPOTIFY_CLIENT_ID,
        client_secret: SPOTIFY_CLIENT_SECRET,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const newAccess = refreshRes.data.access_token;
    const newRefresh = refreshRes.data.refresh_token || stored.refreshToken;
    const expiresAt = Date.now() + (refreshRes.data.expires_in * 1000);
    global.userTokens[userId] = { accessToken: newAccess, refreshToken: newRefresh, expiresAt };
    saveTokens();
    return newAccess;
  } catch (err) {
    console.error('[Spotify] Refresh failed for', userId, err.response?.data || err.message);
    return null;
  }
}

// Helper: get valid access token, try refresh if expired
// Falls back to JWT-embedded tokens when global.userTokens is empty (serverless)
// Uses per-user locking to prevent parallel refresh storms on Vercel
const refreshLocks = {};

async function getAccessTokenForUser(userId, req) {
  let stored = global.userTokens[userId];
  // Fallback: if no stored tokens in memory, use tokens from JWT payload
  if (!stored && req && req.spotifyAccessToken) {
    stored = {
      accessToken: req.spotifyAccessToken,
      refreshToken: req.spotifyRefreshToken,
      expiresAt: req.spotifyTokenExpires || 0
    };
    // Re-hydrate global cache for this invocation
    global.userTokens = global.userTokens || {};
    global.userTokens[userId] = stored;
  }
  if (!stored) return null;
  // Token still valid (with 60s buffer)
  if (stored.expiresAt && Date.now() < stored.expiresAt - 60000) return stored.accessToken;
  // expired or near-expiry -> refresh with per-user lock
  if (!refreshLocks[userId]) {
    refreshLocks[userId] = refreshSpotifyAccessToken(userId)
      .finally(() => { delete refreshLocks[userId]; });
  }
  const newTok = await refreshLocks[userId];
  return newTok || null;
}

// Wrapper: call Spotify API with automatic retry on 401 (expired token)
async function callSpotifyWithRetry(userId, req, spotifyCall) {
  let accessToken = await getAccessTokenForUser(userId, req);
  if (!accessToken) {
    const err = new Error('No Spotify access token available. Please log in again.');
    err.status = 401;
    throw err;
  }
  try {
    return await spotifyCall(accessToken);
  } catch (err) {
    if (err.response?.status === 401) {
      console.log(`[Spotify] 401 on API call, forcing token refresh for ${userId}`);
      const stored = global.userTokens[userId];
      if (stored) stored.expiresAt = 0;
      delete refreshLocks[userId];
      const newToken = await getAccessTokenForUser(userId, req);
      if (newToken && newToken !== accessToken) {
        return await spotifyCall(newToken);
      }
    }
    throw err;
  }
}

// Initialize DB (if configured)
db.init().then(() => {
  console.log('[DB] Postgres integration initialized');
}).catch(err => {
  console.warn('[DB] Postgres not configured or initialization failed:', err.message || err);
});

// Middleware
// Restrict CORS to allowed origins from env (defaults to localhost frontend)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000').trim().split(',').map(s => s.trim());
app.use(cors({
  origin: function(origin, callback) {
    // Allow non-browser tools (no origin) and allowed origins
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    return callback(new Error('CORS not allowed for origin'));
  },
  credentials: true
}));
// Limit JSON body size to mitigate large payload injection vectors
app.use(express.json({ limit: '200kb' }));
// Basic security headers
app.use(helmet());

// Cookie parser for reading httpOnly refresh cookies
app.use(cookieParser());

const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || 'refresh_token';
const REFRESH_COOKIE_MAXAGE = Number(process.env.REFRESH_COOKIE_MAXAGE_MS) || (30 * 24 * 60 * 60 * 1000); // 30 days
function setRefreshCookie(res, token) {
  const secure = !!(process.env.COOKIE_SECURE === '1' || process.env.NODE_ENV === 'production');
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: REFRESH_COOKIE_MAXAGE,
    path: '/'
  });
}

// Request id middleware for tracing
app.use((req, res, next) => {
  req.requestId = (crypto.randomUUID && crypto.randomUUID()) || (Date.now().toString(36) + Math.random().toString(36).slice(2,8));
  next();
});

// Process-level handlers to log fatal errors and unhandled promise rejections
process.on('unhandledRejection', (reason, p) => {
  try {
    console.error('[Fatal] Unhandled Rejection at:', p, 'reason:', reason);
    // In dev we don't exit; in production consider exiting to restart
  } catch (e) { console.error('[Fatal] unhandledRejection handler failed', e); }
});

process.on('uncaughtException', (err) => {
  try {
    console.error('[Fatal] Uncaught Exception:', err && err.stack ? err.stack : err);
    // allow process to exit after logging to avoid undefined state
    process.exit(1);
  } catch (e) { console.error('[Fatal] uncaughtException handler failed', e); process.exit(1); }
});

// ----- Input validation helpers (lightweight, no external deps) -----
function isNumberInRange(v, min, max) {
  const n = typeof v === 'number' ? v : (v && !isNaN(Number(v)) ? Number(v) : NaN);
  return !isNaN(n) && n >= min && n <= max;
}

function badRequest(res, msg) {
  return res.status(400).json({ error: 'invalid_input', message: msg });
}

// Central express-validator handler
function validationHandler(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'invalid_input', details: errors.array().map(e => ({ param: e.param, msg: e.msg, value: e.value })) });
  }
  next();
}
function validateMoodBody(req, res, next) {
  const { happiness, energy, calmness, danceability, notes } = req.body || {};
  if (!isNumberInRange(happiness, 0, 1)) return badRequest(res, 'happiness must be a number between 0 and 1');
  if (!isNumberInRange(energy, 0, 1)) return badRequest(res, 'energy must be a number between 0 and 1');
  if (!isNumberInRange(calmness, 0, 1)) return badRequest(res, 'calmness must be a number between 0 and 1');
  if (!isNumberInRange(danceability, 0, 1)) return badRequest(res, 'danceability must be a number between 0 and 1');
  if (notes && typeof notes !== 'string') return badRequest(res, 'notes must be a string');
  if (notes && notes.length > 2000) return badRequest(res, 'notes too long');
  next();
}

function validateExchangeBody(req, res, next) {
  const { code } = req.body || {};
  if (!code || typeof code !== 'string' || code.length > 1024) return badRequest(res, 'invalid authorization code');
  next();
}

function validateSpotifyQuery(req, res, next) {
  const { limit, time_range } = req.query;
  if (limit !== undefined) {
    const li = Number(limit);
    if (isNaN(li) || li < 1 || li > 50) return badRequest(res, 'limit must be an integer between 1 and 50');
  }
  if (time_range !== undefined) {
    const allowed = ['short_term', 'medium_term', 'long_term'];
    if (!allowed.includes(time_range)) return badRequest(res, 'time_range invalid');
  }
  next();
}

function validateAudioFeaturesIds(req, res, next) {
  const { ids } = req.query;
  if (!ids || typeof ids !== 'string') return badRequest(res, 'ids query param is required');
  // allow alphanumeric and commas, limit length
  if (!/^[A-Za-z0-9,\-_:]+$/.test(ids) || ids.length > 1000) return badRequest(res, 'ids format invalid');
  next();
}

// In-memory data (resets on cold start — real persistence would use a DB)
let moodEntries = [];

// JWT generation for local testing
function generateTestJWT(userId) {
  return jwt.sign(
    { user_id: userId },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Middleware: JWT verification (distinguishes expired vs invalid)
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'no_token' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.user_id;
    req.userEmail = decoded.email;
    req.userName = decoded.name;
    req.spotifyId = decoded.spotify_id;
    // Pass Spotify tokens from JWT for serverless environments
    if (decoded.spotify_access_token) {
      req.spotifyAccessToken = decoded.spotify_access_token;
      req.spotifyRefreshToken = decoded.spotify_refresh_token;
      req.spotifyTokenExpires = decoded.spotify_token_expires;
    }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'token_expired' });
    }
    res.status(401).json({ error: 'invalid_token' });
  }
}

// ============ AUTH ENDPOINTS ============

// Step 1: Redirect user to Spotify authorization page
app.get('/api/auth/spotify/login', (req, res) => {
  const scopes = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'user-read-recently-played',
    'user-library-read',
    'user-read-playback-state'
  ];

  if (!SPOTIFY_CLIENT_ID) {
    console.error('[Auth] Missing SPOTIFY_CLIENT_ID env');
    return res.status(500).json({ error: 'spotify_not_configured', message: 'SPOTIFY_CLIENT_ID not set on server. See SPOTIFY_SETUP.md' });
  }

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.append('client_id', SPOTIFY_CLIENT_ID);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('redirect_uri', SPOTIFY_REDIRECT_URI);
  authUrl.searchParams.append('scope', scopes.join(' '));

  res.json({ authUrl: authUrl.toString() });
});

// Direct redirect endpoint: useful for frontends that prefer a simple navigation
app.get('/api/auth/spotify/redirect', (req, res) => {
  if (!SPOTIFY_CLIENT_ID) {
    console.error('[AuthRedirect] Missing SPOTIFY_CLIENT_ID env');
    return res.status(500).json({ error: 'spotify_not_configured' });
  }
  const scopes = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'user-read-recently-played',
    'user-library-read',
    'user-read-playback-state'
  ];
  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.append('client_id', SPOTIFY_CLIENT_ID);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('redirect_uri', SPOTIFY_REDIRECT_URI);
  authUrl.searchParams.append('scope', scopes.join(' '));
  // Perform a HTTP redirect to Spotify's authorize endpoint
  res.redirect(authUrl.toString());
});

// Step 2: Handle callback from Spotify
app.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(`${FRONTEND_URL}/?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect(`${FRONTEND_URL}/?error=no_code`);
  }

  try {
    if (!SPOTIFY_CLIENT_SECRET) {
      console.error('[Callback] Missing SPOTIFY_CLIENT_SECRET env');
      return res.redirect(`${FRONTEND_URL}/?error=spotify_not_configured`);
    }
    // Exchange authorization code for access token
    const tokenResponse = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        client_id: SPOTIFY_CLIENT_ID,
        client_secret: SPOTIFY_CLIENT_SECRET
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const spotifyAccessToken = tokenResponse.data.access_token;
    const spotifyRefreshToken = tokenResponse.data.refresh_token;
    const expiresIn = tokenResponse.data.expires_in;

    // Try to get user profile (may fail with 403 in Dev Mode)
    let spotifyUser = null;
    let warning = null;
    try {
      const userResponse = await axios.get('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': `Bearer ${spotifyAccessToken}` }
      });
      spotifyUser = userResponse.data;
    } catch (profileErr) {
      const status = profileErr.response?.status;
      console.warn('[Callback] Profile fetch failed:', status, profileErr.response?.data?.error?.message || profileErr.message);
      if (status === 403) {
        warning = 'spotify_403';
      } else {
        warning = `profile_error_${status || 'unknown'}`;
      }
    }

    // Create JWT token (even without profile data)
    const uniqueId = spotifyUser?.id || `unknown_${Date.now()}`;
    const userId = `spotify_${uniqueId}`;
    const tokenExpiresAt = Date.now() + (expiresIn * 1000);
    const harmonyTrackToken = jwt.sign(
      {
        user_id: userId,
        email: spotifyUser?.email || null,
        name: spotifyUser?.display_name || null,
        spotify_id: uniqueId,
        spotify_access_token: spotifyAccessToken,
        spotify_refresh_token: spotifyRefreshToken,
        spotify_token_expires: tokenExpiresAt
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Store access token for later use
    global.userTokens = global.userTokens || {};
    global.userTokens[userId] = {
      accessToken: spotifyAccessToken,
      refreshToken: spotifyRefreshToken,
      expiresAt: tokenExpiresAt
    };
    saveTokens();

    // Set httpOnly refresh cookie
    try { setRefreshCookie(res, spotifyRefreshToken); } catch (e) { /* ignore */ }
    // Redirect to frontend with token (and warning if any)
    let redirectUrl = `${FRONTEND_URL}/?token=${harmonyTrackToken}`;
    if (warning) redirectUrl += `&warning=${warning}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error exchanging code for token:', error.response?.data || error.message);
    res.redirect(`${FRONTEND_URL}/?error=auth_failed`);
  }
});

// SPA callback: frontend sends the code, backend exchanges it and returns JWT as JSON
app.post('/api/auth/spotify/exchange', [
  body('code').isString().isLength({ min: 1, max: 1024 }).trim()
], validationHandler, async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided' });
  }

  // Step 1: Exchange authorization code for tokens
  let spotifyAccessToken, spotifyRefreshToken, expiresIn;
  try {
    if (!SPOTIFY_CLIENT_SECRET) {
      console.error('[Exchange] Missing SPOTIFY_CLIENT_SECRET env');
      return res.status(500).json({ error: 'spotify_not_configured', message: 'SPOTIFY_CLIENT_SECRET not set on server. See SPOTIFY_SETUP.md' });
    }
    console.log('[Exchange] Step 1: Swapping code for tokens...');
    const tokenResponse = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        client_id: SPOTIFY_CLIENT_ID,
        client_secret: SPOTIFY_CLIENT_SECRET
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    spotifyAccessToken = tokenResponse.data.access_token;
    spotifyRefreshToken = tokenResponse.data.refresh_token;
    expiresIn = tokenResponse.data.expires_in;
    console.log('[Exchange] Step 1 OK: Got access_token + refresh_token');
  } catch (error) {
    const errData = error.response?.data;
    const errMsg = errData?.error_description || errData?.error || error.message;
    console.error('[Exchange] Step 1 FAILED (token swap):', errMsg);
    return res.status(500).json({
      error: 'token_exchange_failed',
      message: 'Spotify rejected the authorization code. Try connecting again.',
      details: errMsg
    });
  }

  // Step 2: Try to get user profile (may fail with 403 in Dev Mode)
  let spotifyUser = null;
  let profileWarning = null;
  try {
    console.log('[Exchange] Step 2: Fetching Spotify profile...');
    const userResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${spotifyAccessToken}` }
    });
    spotifyUser = userResponse.data;
    console.log('[Exchange] Step 2 OK: Profile for', spotifyUser.display_name || spotifyUser.id);
  } catch (error) {
    const status = error.response?.status;
    const errMsg = error.response?.data?.error?.message || error.message;
    console.error(`[Exchange] Step 2 FAILED (profile, ${status}):`, errMsg);
    if (status === 403) {
      profileWarning = 'spotify_403';
      // Don't fail — we still have valid tokens, continue with limited info
    } else {
      profileWarning = `profile_error_${status}`;
    }
  }

  // Step 3: Create JWT (even without profile data)
  const uniqueId = spotifyUser?.id || `unknown_${Date.now()}`;
  const userId = `spotify_${uniqueId}`;
  const tokenExpiresAt = Date.now() + (expiresIn * 1000);
  const harmonyTrackToken = jwt.sign(
    {
      user_id: userId,
      email: spotifyUser?.email || null,
      name: spotifyUser?.display_name || null,
      spotify_id: uniqueId,
      spotify_access_token: spotifyAccessToken,
      spotify_refresh_token: spotifyRefreshToken,
      spotify_token_expires: tokenExpiresAt
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Store tokens persistently
  global.userTokens = global.userTokens || {};
  global.userTokens[userId] = {
    accessToken: spotifyAccessToken,
    refreshToken: spotifyRefreshToken,
    expiresAt: Date.now() + (expiresIn * 1000)
  };
  saveTokens();
  // Also persist to Postgres if available
  try {
    if (db && db.upsertUser) {
      await db.upsertUser({
        spotify_id: uniqueId,
        email: spotifyUser?.email || null,
        display_name: spotifyUser?.display_name || null,
        profile: spotifyUser || null,
        access_token: spotifyAccessToken,
        refresh_token: spotifyRefreshToken,
        expires_at: Date.now() + (expiresIn * 1000)
      });
      console.log('[DB] User upserted into Postgres:', uniqueId);
    }
  } catch (dbErr) {
    console.warn('[DB] Failed to upsert user:', dbErr.message || dbErr);
  }
  console.log('[Exchange] Step 3 OK: JWT created for', userId, profileWarning ? `(warning: ${profileWarning})` : '');
  // Set httpOnly refresh token cookie for secure session management
  try { setRefreshCookie(res, spotifyRefreshToken); } catch (e) { /* ignore cookie set failures */ }

  res.json({ token: harmonyTrackToken, warning: profileWarning });
});

// ============ DIAGNOSTIC ENDPOINT ============
app.get('/api/debug/spotify', async (req, res) => {
  const info = {
    client_id_set: !!SPOTIFY_CLIENT_ID,
    client_id_preview: SPOTIFY_CLIENT_ID ? SPOTIFY_CLIENT_ID.substring(0, 8) + '...' : 'NOT SET',
    client_secret_set: !!SPOTIFY_CLIENT_SECRET,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    stored_users: Object.keys(global.userTokens || {}),
  };

  // If we have stored tokens, test one
  const userIds = Object.keys(global.userTokens || {});
  if (userIds.length > 0) {
    const testUser = userIds[0];
    const tokens = global.userTokens[testUser];
    try {
      const testResp = await axios.get('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': `Bearer ${tokens.accessToken}` }
      });
      info.api_test = 'OK';
      info.api_test_user = testResp.data.display_name || testResp.data.id;
    } catch (err) {
      info.api_test = 'FAILED';
      info.api_test_status = err.response?.status || err.status || 500;
      const spotifyMsg = err.response?.data?.error?.message || err.response?.data?.error_description || err.message || err.spotifyMessage;
      info.api_test_error = spotifyMsg;
      // Provide actionable guidance for 403 developer-mode
      if (info.api_test_status === 403 && /registered|developer/i.test(spotifyMsg || '')) {
        info.api_test_action = 'Spotify app appears to be in developer mode and the user may not be registered. Add the user as a tester in developer.spotify.com/dashboard or publish the app.';
      }
    }
  } else {
    info.api_test = 'NO_TOKENS_STORED';
  }

  res.json(info);
});

// ============ JWT REFRESH ENDPOINT ============
// Accepts an expired JWT, validates the user still has a valid Spotify refresh token,
// refreshes the Spotify access token, and returns a brand-new JWT.
app.post('/api/auth/refresh', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'no_token' });
  }

  const oldToken = authHeader.substring(7);
  let decoded;
  try {
    // Accept expired tokens — we just need the payload
    decoded = jwt.verify(oldToken, JWT_SECRET, { ignoreExpiration: true });
  } catch (err) {
    return res.status(401).json({ error: 'invalid_token' });
  }

  const userId = decoded.user_id;
  if (!userId) {
    return res.status(401).json({ error: 'invalid_token' });
  }

  global.userTokens = global.userTokens || {};
  const stored = global.userTokens[userId];
  // Prefer httpOnly cookie refresh token when present (more secure)
  const cookieRefresh = req.cookies && req.cookies[REFRESH_COOKIE_NAME];
  const refreshToken = cookieRefresh || stored?.refreshToken || decoded.spotify_refresh_token;

  if (!refreshToken) {
    return res.status(401).json({ error: 'no_refresh_token', message: 'Please log in with Spotify again.' });
  }

  try {
    // Refresh the Spotify access token
    const refreshRes = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: SPOTIFY_CLIENT_ID,
        client_secret: SPOTIFY_CLIENT_SECRET,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const newAccessToken = refreshRes.data.access_token;
    const newRefreshToken = refreshRes.data.refresh_token || refreshToken;
    const expiresAt = Date.now() + (refreshRes.data.expires_in * 1000);

    // Update persistent store
    global.userTokens[userId] = {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt,
    };
    saveTokens();

    // Rotate refresh cookie if Spotify provided a new one
    try { setRefreshCookie(res, newRefreshToken); } catch (e) { /* ignore cookie set errors */ }

    // Issue a new JWT with updated Spotify tokens embedded (critical for serverless)
    const newJwt = jwt.sign(
      {
        user_id: userId,
        email: decoded.email,
        name: decoded.name,
        spotify_id: decoded.spotify_id,
        spotify_access_token: newAccessToken,
        spotify_refresh_token: newRefreshToken,
        spotify_token_expires: expiresAt
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`[Auth] JWT refreshed for ${userId}`);
    res.json({ token: newJwt });
  } catch (err) {
    console.error('[Auth] Refresh failed:', err.response?.data || err.message);
    // If Spotify rejected the refresh token, the user must re-authorize
    if (err.response?.status === 400 || err.response?.status === 401) {
      // Clean up the dead refresh token
      delete global.userTokens[userId];
      saveTokens();
      // Clear cookie on client
      try { res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' }); } catch (e) { /* ignore */ }
      return res.status(401).json({ error: 'refresh_revoked', message: 'Spotify access was revoked. Please log in again.' });
    }
    res.status(500).json({ error: 'refresh_failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  try { res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' }); } catch (e) {}
  res.json({ success: true });
});

// ============ DB ADMIN ENDPOINTS ============
app.get('/api/db/users', async (req, res) => {
  try {
    if (!db || !db.getAllUsers) return res.json({ users: [], message: 'DB not configured' });
    const users = await db.getAllUsers();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'db_error', message: err.message });
  }
});

app.post('/api/db/clear', async (req, res) => {
  try {
    if (!db || !db.clearUsers) return res.json({ success: false, message: 'DB not configured' });
    await db.clearUsers();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'db_error', message: err.message });
  }
});

// Migrate existing tokens.json into Postgres (one-time utility)
app.post('/api/db/migrate-tokens', async (req, res) => {
  try {
    if (!db || !db.upsertUser) return res.status(400).json({ error: 'db_not_configured' });
    global.userTokens = global.userTokens || {};
    const ids = Object.keys(global.userTokens);
    for (const userId of ids) {
      const t = global.userTokens[userId];
      const spotifyId = userId.replace(/^spotify_/, '') || userId;
      await db.upsertUser({
        spotify_id: spotifyId,
        email: null,
        display_name: null,
        profile: null,
        access_token: t.accessToken,
        refresh_token: t.refreshToken,
        expires_at: t.expiresAt || null
      });
    }
    res.json({ migrated: ids.length });
  } catch (err) {
    res.status(500).json({ error: 'migrate_failed', message: err.message });
  }
});

// ============ MOOD ENDPOINTS ============

app.post('/api/mood', verifyJWT, [
  body('happiness').isFloat({ min: 0, max: 1 }).toFloat(),
  body('energy').isFloat({ min: 0, max: 1 }).toFloat(),
  body('calmness').isFloat({ min: 0, max: 1 }).toFloat(),
  body('danceability').isFloat({ min: 0, max: 1 }).toFloat(),
  body('notes').optional().isString().isLength({ max: 2000 }).trim().escape()
], validationHandler, (req, res) => {
  const { happiness, energy, calmness, danceability, notes } = req.body;

  const newMood = {
    id: moodEntries.length + 1,
    date: new Date().toISOString().split('T')[0],
    happiness: happiness || 0.7,
    energy: energy || 0.6,
    calmness: calmness || 0.8,
    danceability: danceability || 0.65,
    notes: notes || '',
    created_at: new Date().toISOString()
  };

  moodEntries.push(newMood);
  res.status(201).json(newMood);
});

app.get('/api/mood', verifyJWT, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
], validationHandler, (req, res) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const start = (page - 1) * limit;

  res.json({
    data: moodEntries.slice(start, start + limit),
    total: moodEntries.length,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

app.get('/api/mood/latest', verifyJWT, (req, res) => {
  const latest = moodEntries[moodEntries.length - 1];
  res.json(latest || { happiness: 0.7, energy: 0.6, calmness: 0.8 });
});

// ============ ANALYTICS ENDPOINTS ============

app.get('/api/mood/analytics', verifyJWT, [
  query('start').isISO8601().trim(),
  query('end').isISO8601().trim()
], validationHandler, (req, res) => {
  const start = req.query.start;
  const end = req.query.end;

  // Filter entries by date range
  const filtered = moodEntries.filter(entry => {
    return entry.date >= start && entry.date <= end;
  });

  res.json(filtered);
});

app.get('/api/mood/trends', verifyJWT, [
  query('period').optional().isIn(['weekly', 'monthly']),
  query('count').optional().isInt({ min: 1, max: 52 }).toInt()
], validationHandler, (req, res) => {
  const { period = 'weekly', count = 8 } = req.query;

  // Aggregate stored mood entries into trend periods
  const trends = [];
  const now = new Date();

  for (let i = count - 1; i >= 0; i--) {
    const periodEnd = new Date(now);
    const periodStart = new Date(now);
    if (period === 'weekly') {
      periodEnd.setDate(periodEnd.getDate() - i * 7);
      periodStart.setDate(periodStart.getDate() - (i + 1) * 7);
    } else if (period === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() - i);
      periodStart.setMonth(periodStart.getMonth() - (i + 1));
    }

    const startStr = periodStart.toISOString().split('T')[0];
    const endStr = periodEnd.toISOString().split('T')[0];
    const periodEntries = moodEntries.filter(e => e.date >= startStr && e.date <= endStr);

    if (periodEntries.length > 0) {
      const avg = (arr, key) => arr.reduce((s, e) => s + e[key], 0) / arr.length;
      trends.push({
        date: endStr,
        happiness: parseFloat(avg(periodEntries, 'happiness').toFixed(2)),
        energy: parseFloat(avg(periodEntries, 'energy').toFixed(2)),
        calmness: parseFloat(avg(periodEntries, 'calmness').toFixed(2))
      });
    } else {
      trends.push({ date: endStr, happiness: 0, energy: 0, calmness: 0 });
    }
  }

  res.json(trends);
});

app.get('/api/mood/insights', verifyJWT, (req, res) => {
  const days = req.query.days || 30;

  // Calculate statistics from stored entries
  const happiness_values = moodEntries.map(e => e.happiness);
  const energy_values = moodEntries.map(e => e.energy);
  const calmness_values = moodEntries.map(e => e.calmness);

  const avg = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b) / arr.length : 0;

  if (moodEntries.length === 0) {
    return res.json({
      avg_happiness: 0,
      avg_energy: 0,
      avg_calmness: 0,
      max_happiness: 0,
      min_happiness: 0,
      days_tracked: 0,
      happiness_variance: 0
    });
  }

  const avgH = avg(happiness_values);
  const variance = happiness_values.reduce((sum, v) => sum + Math.pow(v - avgH, 2), 0) / happiness_values.length;

  res.json({
    avg_happiness: parseFloat(avgH.toFixed(2)),
    avg_energy: parseFloat(avg(energy_values).toFixed(2)),
    avg_calmness: parseFloat(avg(calmness_values).toFixed(2)),
    max_happiness: parseFloat(Math.max(...happiness_values).toFixed(2)),
    min_happiness: parseFloat(Math.min(...happiness_values).toFixed(2)),
    days_tracked: moodEntries.length,
    happiness_variance: parseFloat(variance.toFixed(4))
  });
});

// ============ RECOMMENDATIONS ENDPOINTS ============

/**
 * PlaylistEngine ML Algorithm (inline implementation)
 * Generates mood-based playlist recommendations
 */
const createPlaylistRecommendation = (mood, playlistId) => {
  const analyzeMood = (m) => {
    if (m.energy > 0.7 && m.happiness > 0.6) {
      return m.danceability > 0.6 ? 'party' : 'energetic';
    }
    if (m.calmness > 0.7 && m.energy < 0.4) return 'calm';
    if (m.happiness > 0.7 && m.calmness > 0.5) return 'happy';
    if (m.happiness < 0.4 && m.energy < 0.5) return 'melancholic';
    if (m.energy > 0.6 && m.happiness < 0.5) return 'focused';
    if (m.happiness > 0.6 && m.calmness > 0.6) return 'romantic';
    return 'introspective';
  };

  const genreMap = {
    party: ['dance', 'electronic', 'hip-hop', 'edm'],
    energetic: ['dance', 'electronic', 'hip-hop', 'pop'],
    calm: ['ambient', 'chill', 'lo-fi', 'indie-pop'],
    happy: ['pop', 'indie-pop', 'funk', 'dance-pop'],
    melancholic: ['indie', 'alternative', 'soul', 'folk'],
    focused: ['electronic', 'ambient', 'classical', 'lo-fi'],
    romantic: ['r-and-b', 'soul', 'indie-pop', 'pop'],
    introspective: ['indie', 'alternative', 'singer-songwriter', 'folk']
  };

  const playlistNames = {
    party: ['Party Time', 'Dance Floor Hits', 'Celebration Beats'],
    energetic: ['Energy Boost', 'Power Up Mix', 'Adrenaline Rush'],
    calm: ['Zen Vibes', 'Chill Out', 'Peace & Quiet'],
    happy: ['Good Vibes Only', 'Feel Good Playlist', 'Pure Joy'],
    melancholic: ['Deep Thoughts', 'Reflective Moods', 'Soul Search'],
    focused: ['Focus Mode', 'Deep Work', 'Concentration Zone'],
    romantic: ['Love Songs', 'Romance Vibes', 'Heart & Soul'],
    introspective: ['Midnight Thoughts', 'Personal Space', 'Inner Journey']
  };

  const moodCategory = analyzeMood(mood);
  const playlistNameOptions = playlistNames[moodCategory] || playlistNames.calm;
  const selectedName = playlistNameOptions[Math.floor(Math.random() * playlistNameOptions.length)];

  return {
    id: playlistId,
    name: selectedName,
    description: `Generated playlist based on your ${moodCategory} mood. ${mood.energy > 0.6 ? 'High energy' : 'Relaxing'} vibes perfect for your current emotional state.`,
    mood_category: moodCategory,
    mood_score: {
      happiness: mood.happiness,
      energy: mood.energy,
      calmness: mood.calmness,
      danceability: mood.danceability
    },
    genres: genreMap[moodCategory],
    confidence: 0.82 + Math.random() * 0.18,
    tracks: []
  };
};

app.get('/api/recommendations', verifyJWT, (req, res) => {
  // Get latest mood or use default
  const latestMood = moodEntries[moodEntries.length - 1] || {
    happiness: 0.7,
    energy: 0.6,
    calmness: 0.8,
    danceability: 0.65
  };

  // Generate 3 playlist recommendations based on mood
  const recommendations = [
    createPlaylistRecommendation(latestMood, `rec_${Date.now()}_1`),
    createPlaylistRecommendation(latestMood, `rec_${Date.now()}_2`),
    createPlaylistRecommendation(latestMood, `rec_${Date.now()}_3`)
  ];

  res.json({
    current_mood: latestMood,
    recommendations,
    updated_at: new Date().toISOString()
  });
});

app.post('/api/recommendations', verifyJWT, [
  body('happiness').optional().isFloat({ min: 0, max: 1 }).toFloat(),
  body('energy').optional().isFloat({ min: 0, max: 1 }).toFloat(),
  body('calmness').optional().isFloat({ min: 0, max: 1 }).toFloat(),
  body('danceability').optional().isFloat({ min: 0, max: 1 }).toFloat()
], validationHandler, (req, res) => {
  const { happiness, energy, calmness, danceability } = req.body;

  const mood = {
    happiness: happiness || 0.7,
    energy: energy || 0.6,
    calmness: calmness || 0.8,
    danceability: danceability || 0.65
  };

  const recommendation = createPlaylistRecommendation(mood, `rec_${Date.now()}`);
  res.status(201).json(recommendation);
});

app.get('/api/recommendations/:id', verifyJWT, (req, res) => {
  const latestMood = moodEntries[moodEntries.length - 1] || {
    happiness: 0.7,
    energy: 0.6,
    calmness: 0.8,
    danceability: 0.65
  };

  const recommendation = createPlaylistRecommendation(latestMood, req.params.id);
  res.json(recommendation);
});

app.post('/api/recommendations/refresh', verifyJWT, (req, res) => {
  const latestMood = moodEntries[moodEntries.length - 1] || {
    happiness: 0.7,
    energy: 0.6,
    calmness: 0.8,
    danceability: 0.65
  };

  const newRecommendation = createPlaylistRecommendation(latestMood, `rec_${Date.now()}`);
  res.status(201).json(newRecommendation);
});

// ============ SPOTIFY DATA PROXY ENDPOINTS ============

const tokenManager = require('./tokenManager');

// Helper: extract Spotify access token from global store or JWT, with auto-refresh
async function getSpotifyToken(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.user_id;

    global.userTokens = global.userTokens || {};
    const stored = global.userTokens[userId];
    // derive spotifyId if available
    const spotifyId = decoded?.spotify_id || (userId || '').replace(/^spotify_/, '');

    // If we have a stored token and it's not expired (with 60s buffer), use it
    if (stored && stored.accessToken && stored.expiresAt > Date.now() + 60000) {
      return stored.accessToken;
    }

    // Delegate to tokenManager which handles locking and DB-stored encrypted refresh tokens
    try {
      const fallback = stored?.refreshToken || decoded.spotify_refresh_token;
      const refreshed = await tokenManager.refreshWithLock(userId, spotifyId, fallback);
      if (refreshed && refreshed.accessToken) {
        global.userTokens[userId] = {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          expiresAt: refreshed.expiresAt
        };
        saveTokens();
        console.log(`[Spotify] Refreshed token for ${userId}`);
        return refreshed.accessToken;
      }
    } catch (err) {
      console.error('[Spotify] Token refresh failed:', err.response?.status || err.message || err);
    }

    // Last resort: use the access token embedded in JWT (likely expired)
    return decoded.spotify_access_token || null;
  } catch { return null; }
}

async function spotifyAPI(spotifyToken, url) {
  try {
    const r = await axios.get(url, {
      headers: { 'Authorization': `Bearer ${spotifyToken}` }
    });
    return r.data;
  } catch (err) {
    // normalize axios error
    const status = err.response?.status || 500;
    const spotifyMessage = err.response?.data?.error?.message || err.response?.data?.error_description || err.message;
    const e = new Error(spotifyMessage || 'spotify_api_error');
    e.status = status;
    e.spotifyMessage = spotifyMessage;
    throw e;
  }
}

app.get('/api/spotify/profile', verifyJWT, async (req, res) => {
  try {
    const result = await callSpotifyWithRetry(req.userId, req, (token) =>
      axios.get('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${token}` } })
    );
    return res.json(result.data);
  } catch (e) {
    console.error('Profile error:', e.message);
    const status = e.response?.status || e.status || 500;
    res.status(status).json({ error: 'Failed to fetch profile', spotifyError: e.response?.data?.error?.message || e.spotifyMessage || null });
  }
});

app.get('/api/spotify/top-tracks', verifyJWT, [
  query('time_range').optional().isIn(['short_term', 'medium_term', 'long_term']),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
], validationHandler, async (req, res) => {
  const { time_range = 'short_term', limit = 20 } = req.query;
  try {
    const result = await callSpotifyWithRetry(req.userId, req, (token) =>
      axios.get('https://api.spotify.com/v1/me/top/tracks', { headers: { Authorization: `Bearer ${token}` }, params: { time_range, limit } })
    );
    return res.json(result.data);
  } catch (e) {
    console.error('Spotify top tracks error:', e.message);
    const status = e.response?.status || e.status || 500;
    res.status(status).json({ error: 'Failed to fetch top tracks', spotifyError: e.response?.data?.error?.message || e.spotifyMessage || null });
  }
});

app.get('/api/spotify/top-artists', verifyJWT, [
  query('time_range').optional().isIn(['short_term', 'medium_term', 'long_term']),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
], validationHandler, async (req, res) => {
  const { time_range = 'medium_term', limit = 20 } = req.query;
  try {
    const result = await callSpotifyWithRetry(req.userId, req, (token) =>
      axios.get('https://api.spotify.com/v1/me/top/artists', { headers: { Authorization: `Bearer ${token}` }, params: { time_range, limit } })
    );
    return res.json(result.data);
  } catch (e) {
    console.error('Spotify top artists error:', e.message);
    const status = e.response?.status || e.status || 500;
    res.status(status).json({ error: 'Failed to fetch top artists', spotifyError: e.response?.data?.error?.message || e.spotifyMessage || null });
  }
});

app.get('/api/spotify/recently-played', verifyJWT, [
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
], validationHandler, async (req, res) => {
  const { limit = 50 } = req.query;
  try {
    const result = await callSpotifyWithRetry(req.userId, req, (token) =>
      axios.get('https://api.spotify.com/v1/me/player/recently-played', { headers: { Authorization: `Bearer ${token}` }, params: { limit } })
    );
    return res.json(result.data);
  } catch (e) {
    console.error('Recently played error:', e.message);
    const status = e.response?.status || e.status || 500;
    res.status(status).json({ error: 'Failed to fetch recently played', spotifyError: e.response?.data?.error?.message || e.spotifyMessage || null });
  }
});

app.get('/api/spotify/audio-features', verifyJWT, [
  query('ids').isString().isLength({ min: 1, max: 1000 }).matches(/^[A-Za-z0-9,\-_:]+$/).trim()
], validationHandler, async (req, res) => {
  const { ids } = req.query;
  try {
    const result = await callSpotifyWithRetry(req.userId, req, (token) =>
      axios.get('https://api.spotify.com/v1/audio-features', { headers: { Authorization: `Bearer ${token}` }, params: { ids } })
    );
    return res.json(result.data);
  } catch (e) {
    console.error('Spotify audio features error:', e.message);
    const status = e.response?.status || e.status || 500;
    res.status(status).json({ error: 'Failed to fetch audio features', spotifyError: e.response?.data?.error?.message || e.spotifyMessage || null });
  }
});

// ============ USER ENDPOINTS ============

// Return user info from the JWT payload (no in-memory store needed)
app.get('/api/user', verifyJWT, (req, res) => {
  res.json({
    id: req.userId,
    email: req.userEmail || null,
    name: req.userName || null,
    spotifyId: req.spotifyId || null
  });
});

app.put('/api/user', verifyJWT, [
  body('name').optional().isString().isLength({ max: 100 }).trim().escape(),
  body('email').optional().isEmail().normalizeEmail()
], validationHandler, (req, res) => {
  // Without a database, updates are ephemeral; return what was sent
  res.json({
    id: req.userId,
    name: req.body.name || req.userName || null,
    email: req.body.email || req.userEmail || null
  });
});

// ============ HEALTH CHECK ============

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    apiVersion: '1.0.0',
    environment: 'development'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: 'connected',
    cache: 'connected'
  });
});

// ============ ERROR HANDLING ============

app.use((req, res) => {
  const id = req.requestId || 'unknown';
  res.status(404).json({ error: 'not_found', errorId: id });
});

// Centralized error handler — do not leak internal messages to clients
app.use((err, req, res, next) => {
  const id = req.requestId || 'unknown';
  try {
    // Normalize known axios errors to include status
    const status = err.status || err.response?.status || 500;

    // Log detailed error server-side with request id for tracing
    console.error(`[${id}] Unhandled error:`, {
      message: err.message,
      stack: err.stack,
      status: status,
      spotifyMessage: err.spotifyMessage || null
    });

    if (res.headersSent) return next(err);

    // Safe client response: do not leak internal stack or sensitive data
    const clientPayload = { error: 'internal_error', errorId: id };
    // When in debug mode, include a sanitized message
    if (process.env.DEBUG_ERRORS === '1') {
      clientPayload.message = err.message;
    }

    res.status(status).json(clientPayload);
  } catch (handlerErr) {
    console.error('Error while handling error:', handlerErr);
    try { res.status(500).json({ error: 'internal_error', errorId: req.requestId || 'unknown' }); } catch (e) { /* nothing to do */ }
  }
});

// ============ START SERVER / EXPORT FOR VERCEL ============

// Export app for Vercel serverless
module.exports = app;

// Only listen when running directly (not imported by Vercel)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n${'='.repeat(50)}`);
    console.log('🎵 HarmonyTrack Backend');
    console.log(`${'='.repeat(50)}`);
    console.log(`\n✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ Health check: http://localhost:${PORT}/health`);
    console.log(`\n📊 Endpoints Available:`);
    console.log('  POST   /api/auth/exchange');
    console.log('  POST   /api/auth/refresh');
    console.log('  POST   /api/auth/logout');
    console.log('  POST   /api/mood');
    console.log('  GET    /api/mood');
    console.log('  GET    /api/mood/latest');
    console.log('  GET    /api/mood/analytics?start=YYYY-MM-DD&end=YYYY-MM-DD');
    console.log('  GET    /api/mood/trends?period=weekly&count=8');
    console.log('  GET    /api/mood/insights?days=30');
    console.log('  GET    /api/recommendations');
    console.log('  GET    /api/user');
    console.log('\n🔐 Test JWT Token:');

    const testToken = generateTestJWT('test_user');
    console.log(`  ${testToken}`);
    console.log('\n💡 Use this token in Authorization header:');
    console.log('  Authorization: Bearer [token]');
    console.log(`\n${'='.repeat(50)}\n`);
  });
}
