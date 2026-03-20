import React from 'react';
import axios from 'axios';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { PerformanceHUD } from './components/PerformanceHUD';
import { isDemoMode } from './data/mockSpotifyData';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const exchangeInProgress = React.useRef(false);

  React.useEffect(() => {
    // Enable demo mode by default if not explicitly disabled
    try {
      const demoOverride = localStorage.getItem('harmonytrack_demo');
      if (demoOverride === null && import.meta.env.VITE_DEMO !== 'false') {
        localStorage.setItem('harmonytrack_demo', 'true');
      }
    } catch (e) {
      // ignore localStorage errors
    }

    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    const error = params.get('error');
    const code = params.get('code');
    const logout = params.get('logout');
    const path = window.location.pathname;

    // Force logout via URL param
    if (logout) {
      localStorage.removeItem('harmonytrack_token');
      localStorage.removeItem('harmonytrack_warning');
      setIsAuthenticated(false);
      window.history.replaceState({}, document.title, '/');
      setIsLoading(false);
      return;
    }

    if (error) {
      console.error('Auth error:', error);
      localStorage.removeItem('harmonytrack_token');
      setIsAuthenticated(false);
      setAuthError(error);
      window.history.replaceState({}, document.title, '/');
      setIsLoading(false);
      return;
    }

    if (tokenFromUrl) {
      localStorage.setItem('harmonytrack_token', tokenFromUrl);
      setIsAuthenticated(true);
      window.history.replaceState({}, document.title, '/');
      setIsLoading(false);
      return;
    }

    // Handle Spotify OAuth callback: /callback?code=xxx
    // Guard against React StrictMode double-firing (codes are single-use)
    if (code && (path === '/callback' || path === '/') && !exchangeInProgress.current) {
      exchangeInProgress.current = true;
      // Clear code from URL immediately to prevent re-use on refresh
      window.history.replaceState({}, document.title, '/');
      (async () => {
        try {
          console.log('[Auth] Exchanging code for token...');
          const response = await axios.post('http://127.0.0.1:8081/api/auth/spotify/exchange', { code });
          const { token, warning } = response.data;
          if (token) {
            console.log('[Auth] Token received, storing...', warning ? `(warning: ${warning})` : '');
            localStorage.setItem('harmonytrack_token', token);
            if (warning === 'spotify_403') {
              localStorage.setItem('harmonytrack_warning', 'spotify_403');
            }
            setIsAuthenticated(true);
          } else {
            console.error('[Auth] No token in response:', response.data);
            setAuthError('No token received from server');
          }
        } catch (err: any) {
          const serverError = err.response?.data;
          console.error('[Auth] Token exchange failed:', err.response?.status, serverError || err.message);
          if (serverError?.error === 'token_exchange_failed') {
            setAuthError(serverError.message || 'Spotify rejected the code. Try again.');
          } else {
            setAuthError(serverError?.message || 'Failed to authenticate with Spotify');
          }
        } finally {
          setIsLoading(false);
        }
      })();
      return; // Don't call setIsLoading(false) yet — async handler will do it
    }

    // If an exchange is already in progress (StrictMode 2nd run after URL was cleared),
    // don't set loading to false — the async handler from the 1st run will do it.
    if (exchangeInProgress.current) {
      return;
    }

    // If we have a token in localStorage (non-demo), try to validate/refresh it with backend
    const existing = localStorage.getItem('harmonytrack_token');
    if (existing) {
      (async () => {
        try {
          console.log('[Auth] Validating existing token...');
          const resp = await axios.post('http://127.0.0.1:8081/api/auth/refresh', {}, {
            headers: { Authorization: `Bearer ${existing}` }
          });
          if (resp.data?.token) {
            localStorage.setItem('harmonytrack_token', resp.data.token);
            console.log('[Auth] Token refreshed/validated');
            setIsAuthenticated(true);
          } else {
            throw new Error('no_token_returned');
          }
        } catch (err) {
          console.warn('[Auth] Existing token invalid or refresh failed, clearing demo/token');
          localStorage.removeItem('harmonytrack_token');
          localStorage.removeItem('harmonytrack_user');
          localStorage.removeItem('harmonytrack_warning');
          setIsAuthenticated(false);
        } finally {
          setIsLoading(false);
        }
      })();
      return;
    }

    setIsLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  if (isLoading) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        backgroundColor: '#1a1a1c',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
      }}>
        {['#FF6B6B', '#FFB84D', '#4ECDC4', '#9B8FFF', '#6BCB77'].map((c, i) => (
          <div key={i} style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: c,
            animation: `pulse 1.2s ease-in-out ${i * 0.15}s infinite`,
          }} />
        ))}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      {/* Performance monitoring HUD (dev only) */}
      <PerformanceHUD position="top-right" />
      
      {(isAuthenticated || isDemoMode()) ? (
        <Dashboard />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} externalError={authError} />
      )}
    </>
  );
}

