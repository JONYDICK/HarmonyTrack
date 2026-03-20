const { Client } = require('pg');
const crypto = require('crypto');

const DATABASE_URL = process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING || null;

let client = null;

async function init() {
  if (!DATABASE_URL) {
    // Not configured; no-op
    return;
  }

  client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  // Create users table if not exists. Includes encrypted_refresh_token for secure storage.
  await client.query(`
    CREATE TABLE IF NOT EXISTS spotify_users (
      spotify_id TEXT PRIMARY KEY,
      email TEXT,
      display_name TEXT,
      profile JSONB,
      access_token TEXT,
      refresh_token TEXT,
      encrypted_refresh_token TEXT,
      expires_at BIGINT,
      cached_data JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

function _getKey() {
  const k = process.env.SPOTIFY_TOKEN_ENCRYPTION_KEY || '';
  if (!k) return null;
  // Derive 32-byte key via SHA-256
  return crypto.createHash('sha256').update(k).digest();
}

function encryptToken(plain) {
  const key = _getKey();
  if (!key) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // store as base64 iv:cipher:tag
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decryptToken(blob) {
  const key = _getKey();
  if (!key || !blob) return null;
  try {
    const b = Buffer.from(blob, 'base64');
    const iv = b.slice(0, 12);
    const tag = b.slice(12, 28);
    const encrypted = b.slice(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (e) { return null; }
}

async function upsertUser(u) {
  if (!client) return;
  const now = new Date();
  // If an encryption key is configured and a refresh token provided, encrypt it and store in encrypted_refresh_token
  let encrypted = null;
  if (u.refresh_token) {
    encrypted = encryptToken(u.refresh_token);
  }

  await client.query(
    `INSERT INTO spotify_users(spotify_id, email, display_name, profile, access_token, refresh_token, encrypted_refresh_token, expires_at, created_at, updated_at)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (spotify_id) DO UPDATE SET
       email = EXCLUDED.email,
       display_name = EXCLUDED.display_name,
       profile = EXCLUDED.profile,
       access_token = EXCLUDED.access_token,
       refresh_token = COALESCE(EXCLUDED.refresh_token, spotify_users.refresh_token),
       encrypted_refresh_token = COALESCE(EXCLUDED.encrypted_refresh_token, spotify_users.encrypted_refresh_token),
       expires_at = EXCLUDED.expires_at,
       updated_at = EXCLUDED.updated_at;
    `,
    [u.spotify_id, u.email, u.display_name, u.profile ? JSON.stringify(u.profile) : null, u.access_token, null, encrypted, u.expires_at || null, now, now]
  );
}

async function getDecryptedRefreshToken(spotifyId) {
  if (!client) return null;
  const res = await client.query('SELECT encrypted_refresh_token FROM spotify_users WHERE spotify_id = $1', [spotifyId]);
  const row = res.rows[0];
  if (!row || !row.encrypted_refresh_token) return null;
  return decryptToken(row.encrypted_refresh_token);
}

async function revokeRefreshToken(spotifyId) {
  if (!client) return;
  await client.query('UPDATE spotify_users SET refresh_token = NULL, encrypted_refresh_token = NULL, updated_at = NOW() WHERE spotify_id = $1', [spotifyId]);
}

async function setCachedData(spotifyId, key, data) {
  if (!client) return;
  // merge into cached_data JSONB
  await client.query(
    `UPDATE spotify_users SET cached_data = COALESCE(cached_data, '{}'::jsonb) || $2::jsonb, updated_at = NOW() WHERE spotify_id = $1`,
    [spotifyId, JSON.stringify({ [key]: data })]
  );
}

async function getCachedData(spotifyId, key) {
  if (!client) return null;
  const res = await client.query('SELECT cached_data FROM spotify_users WHERE spotify_id = $1', [spotifyId]);
  const row = res.rows[0];
  if (!row || !row.cached_data) return null;
  return row.cached_data[key] || null;
}

async function getUserBySpotifyId(id) {
  if (!client) return null;
  const res = await client.query('SELECT * FROM spotify_users WHERE spotify_id = $1', [id]);
  return res.rows[0] || null;
}

async function getAllUsers() {
  if (!client) return [];
  const res = await client.query('SELECT * FROM spotify_users');
  return res.rows || [];
}

async function clearUsers() {
  if (!client) return;
  await client.query('DELETE FROM spotify_users');
}

module.exports = { init, upsertUser, getUserBySpotifyId, getAllUsers, clearUsers, setCachedData, getCachedData, getDecryptedRefreshToken, revokeRefreshToken };
