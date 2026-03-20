const axios = require('axios');
const db = require('./db');

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Simple in-process locks per userId
const locks = new Map();

async function _doRefresh(refreshToken) {
  const tokenRes = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: SPOTIFY_CLIENT_ID,
      client_secret: SPOTIFY_CLIENT_SECRET
    }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return tokenRes.data;
}

/**
 * Refresh access token with locking. Returns { accessToken, refreshToken, expiresAt }
 * Tries DB encrypted refresh token first, falls back to provided fallbackRefreshToken.
 */
async function refreshWithLock(userId, spotifyId, fallbackRefreshToken) {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) throw new Error('spotify_client_not_configured');

  if (locks.has(userId)) {
    return locks.get(userId);
  }

  const promise = (async () => {
    try {
      // Try DB-stored encrypted refresh token first
      let refreshToken = null;
      try {
        if (db && db.getDecryptedRefreshToken && spotifyId) {
          const fromDb = await db.getDecryptedRefreshToken(spotifyId);
          if (fromDb) refreshToken = fromDb;
        }
      } catch (e) {
        // ignore DB read failures and fallback
      }
      if (!refreshToken) refreshToken = fallbackRefreshToken;
      if (!refreshToken) throw new Error('no_refresh_token_available');

      let data;
      try {
        data = await _doRefresh(refreshToken);
      } catch (err) {
        // normalize axios errors
        const status = err.response?.status;
        const message = err.response?.data?.error_description || err.response?.data?.error || err.message;
        const e = new Error(message || 'refresh_failed');
        if (status) e.status = status;
        throw e;
      }
      const newAccess = data.access_token;
      const newExpires = Date.now() + (data.expires_in * 1000);
      const newRefresh = data.refresh_token || refreshToken;

      // Persist refreshed tokens to DB if available (db.upsertUser will encrypt refresh token)
      try {
        if (db && db.upsertUser && spotifyId) {
          await db.upsertUser({
            spotify_id: spotifyId,
            access_token: newAccess,
            refresh_token: newRefresh,
            expires_at: newExpires
          });
        }
      } catch (dberr) {
        // Log at caller; swallow here
      }

      return { accessToken: newAccess, refreshToken: newRefresh, expiresAt: newExpires };
    } catch (err) {
      // propagate errors to caller
      throw err;
    } finally {
      locks.delete(userId);
    }
  })();

  locks.set(userId, promise);
  return promise;
}

module.exports = { refreshWithLock };
