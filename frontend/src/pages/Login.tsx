import React, { useEffect, useRef } from 'react';
import axios from 'axios';
import { animate } from 'animejs';
import { ParticleField } from '../visualizers/ParticleField';
import { WaveformVisualizer } from '../visualizers/WaveformVisualizer';
import { useAudioFeedback } from '../hooks/useAudioFeedback';
import { DURATION } from '../animations/config';

interface LoginProps {
  onLoginSuccess: () => void;
  externalError?: string | null;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, externalError }) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(externalError || null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLHeadingElement>(null);
  const spotifyBtnRef = useRef<HTMLButtonElement>(null);

  const { playSound, isEnabled } = useAudioFeedback();

  // Entrance animations
  useEffect(() => {
    if (!cardRef.current || !logoRef.current) return;

    // Card entrance with dramatic bounce
    animate(cardRef.current, {
      opacity: [0, 1],
      scale: [0.8, 1],
      translateY: [50, 0],
      duration: DURATION.DRAMATIC,
      ease: 'outElastic(1, 0.75)',
    });

    // Logo morphing animation
    animate(logoRef.current, {
      opacity: [0, 1],
      scale: [0, 1],
      rotate: [180, 0],
      duration: DURATION.DRAMATIC,
      ease: 'outElastic(1, 0.8)',
      delay: 200,
    });

    // Spotify button glow pulse
    if (spotifyBtnRef.current) {
      animate(spotifyBtnRef.current, {
        boxShadow: [
          '0 0 0px rgba(255, 107, 107, 0)',
          '0 0 20px rgba(255, 107, 107, 0.15)',
          '0 0 0px rgba(255, 107, 107, 0)',
        ],
        duration: 2000,
        ease: 'inOutQuad',
        loop: true,
      });
    }
  }, []);

  const handleSpotifyLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (isEnabled) playSound('click');
      
      // Button click animation
      if (spotifyBtnRef.current) {
        animate(spotifyBtnRef.current, {
          scale: [1, 0.95, 1.05, 1],
          duration: 400,
          ease: 'inOutQuad',
        });
      }
      
      const response = await axios.get(`${(import.meta.env.VITE_API_URL || 'http://localhost:8081').trim()}/api/auth/spotify/login`);
      
      if (response.data.authUrl) {
        if (isEnabled) playSound('success');
        window.location.href = response.data.authUrl;
      }
    } catch (err: any) {
      setError('Failed to connect to Spotify: ' + (err.message || 'Unknown error'));
      setLoading(false);
      
      if (isEnabled) playSound('error');
      
      // Error shake animation
      if (cardRef.current) {
        animate(cardRef.current, {
          translateX: [0, -10, 10, -10, 10, 0],
          duration: 400,
          ease: 'inOutQuad',
        });
      }
    }
  };

  const handleDemoLogin = () => {
    if (isEnabled) playSound('click');
    
    const demoToken = 'demo_token_' + Date.now();
    localStorage.setItem('harmonytrack_token', demoToken);
    localStorage.setItem('harmonytrack_user', JSON.stringify({
      id: 'demo_user',
      email: 'demo@harmonytrack.local',
      name: 'Demo User'
    }));
    
    if (isEnabled) playSound('success');
    onLoginSuccess();
    window.location.href = '/';
  };

  return (
    <div 
      ref={containerRef}
      style={{
        width: '100%',
        minHeight: '100vh',
        background: '#1a1a1c',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        position: 'relative',
        overflow: 'hidden',
        padding: '20px',
      }}
    >
      {/* Particle background — subtle */}
      <ParticleField 
        density={25}
        colors={['#FF6B6B', '#4ECDC4', '#FFB84D', '#9B8FFF']}
      />

      {/* Animated waveform background */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: 0.04,
        zIndex: 1,
      }}>
        <WaveformVisualizer
          width={800}
          height={400}
          color="#FF6B6B"
          mood={{ happiness: 0.7, energy: 0.6, calmness: 0.5, danceability: 0.7 }}
        />
      </div>

      {/* Login card */}
      <div 
        ref={cardRef}
        style={{
          backgroundColor: '#222224',
          padding: '60px 50px',
          borderRadius: '16px',
          textAlign: 'center',
          maxWidth: '460px',
          width: '100%',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Logo */}
        <h1 
          ref={logoRef}
          style={{ 
            fontSize: '42px', 
            color: '#ffffff',
            margin: '0 0 12px 0',
            fontWeight: '700',
            letterSpacing: '-1.5px',
          }}
        >
          HarmonyTrack
        </h1>
        
        {/* Colored dots — animejs-style mood indicators */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '32px',
        }}>
          {['#FF6B6B', '#FFB84D', '#4ECDC4', '#9B8FFF', '#6BCB77', '#FF8FA3'].map((color, i) => (
            <div key={i} style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: color,
              opacity: 0.8,
            }} />
          ))}
        </div>

        <p style={{ 
          fontSize: '16px', 
          color: '#999999', 
          margin: '0 0 40px 0',
          fontWeight: '400',
          lineHeight: '1.6',
        }}>
          Connect your Spotify account to discover
          the emotional patterns in your music.
        </p>

        {error && (
          <div style={{
            background: '#2a2a2e',
            color: '#FF6B6B',
            padding: '14px 20px',
            borderRadius: '10px',
            marginBottom: '24px',
            fontSize: '13px',
            fontWeight: '500',
            border: '1px solid rgba(255, 107, 107, 0.2)',
          }}>
            {error}
          </div>
        )}

        {/* Spotify Connect Button */}
        <button
          ref={spotifyBtnRef}
          onClick={handleSpotifyLogin}
          disabled={loading}
          style={{
            background: loading 
              ? '#333338'
              : '#FF6B6B',
            color: '#fff',
            padding: '16px 40px',
            fontSize: '15px',
            fontWeight: '600',
            border: 'none',
            borderRadius: '10px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '16px',
            width: '100%',
            transition: 'all 0.2s ease',
            opacity: loading ? 0.5 : 1,
            position: 'relative',
            overflow: 'hidden',
            letterSpacing: '0.3px',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.backgroundColor = '#FF8585';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.backgroundColor = '#FF6B6B';
            }
          }}
        >
          {loading ? 'Connecting...' : 'Connect with Spotify'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ color: '#666', fontSize: '12px' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Demo Button */}
        <button
          onClick={handleDemoLogin}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #3a3a3e 0%, #2a2a2e 100%)',
            color: '#fff',
            padding: '14px',
            fontSize: '14px',
            fontWeight: '600',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #4a4a4e 0%, #3a3a3e 100%)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #3a3a3e 0%, #2a2a2e 100%)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          🎵 Try Demo Mode
        </button>
        <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#666', textAlign: 'center' }}>
          No Spotify account needed — explore with sample data
        </p>

        {/* Privacy info */}
        <div style={{ 
          marginTop: '32px', 
          fontSize: '12px', 
          color: '#666',
          lineHeight: '1.8',
        }}>
          <p style={{ margin: '4px 0' }}>We never store your Spotify password</p>
          <p style={{ margin: '4px 0' }}>Read-only access to listening history</p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          50% { transform: translateX(10px); }
          75% { transform: translateX(-10px); }
        }
      `}</style>
    </div>
  );
};

export default Login;
