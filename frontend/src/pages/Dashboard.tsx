import React, { useEffect, useRef, useState } from 'react';
import { animate, stagger } from 'animejs';
import { ParticleField } from '../visualizers/ParticleField';
import { MoodOrb } from '../visualizers/MoodOrb';
import { WaveformVisualizer } from '../visualizers/WaveformVisualizer';
import { VolumeControl } from '../components/VolumeControl';
import { useAudioFeedback } from '../hooks/useAudioFeedback';
import { DURATION } from '../animations/config';
import { spotifyService } from '../services/api';


// ── Types ──────────────────────────────────────────────
interface SpotifyImage { url: string; width?: number; height?: number; }
interface SpotifyArtistMin { name: string; }
interface SpotifyAlbum { name: string; images: SpotifyImage[]; }
interface SpotifyTrack { id: string; name: string; artists: SpotifyArtistMin[]; album: SpotifyAlbum; duration_ms: number; }
interface SpotifyArtist { id: string; name: string; genres: string[]; images: SpotifyImage[]; popularity: number; }
interface RecentItem { track: SpotifyTrack; played_at: string; }
interface AudioFeature { id: string; danceability: number; energy: number; valence: number; acousticness: number; instrumentalness: number; tempo: number; }
interface SpotifyProfile { id: string; display_name: string; images: SpotifyImage[]; followers: { total: number }; product: string; country: string; }
interface MoodData { happiness: number; energy: number; calmness: number; danceability: number; }

// ── Helpers ────────────────────────────────────────────
function formatMs(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function timeAgo(isoDate: string) {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function deriveMoodCategory(mood: MoodData): string {
  if (mood.energy > 0.7 && mood.happiness > 0.6) return mood.danceability > 0.6 ? 'party' : 'energetic';
  if (mood.calmness > 0.7 && mood.energy < 0.4) return 'calm';
  if (mood.happiness > 0.7) return 'happy';
  if (mood.happiness < 0.4 && mood.energy < 0.5) return 'melancholic';
  if (mood.energy > 0.6) return 'focused';
  return 'introspective';
}

function getHourBucket(iso: string) { return new Date(iso).getHours(); }

// Safe image helpers
function pickImageUrlFromArray(images?: SpotifyImage[] | null, preferLast = true): string | null {
  if (!images || images.length === 0) return null;
  try {
    if (preferLast && images.length > 0) return images[images.length - 1]?.url || images[0]?.url || null;
    return images[0]?.url || images[images.length - 1]?.url || null;
  } catch (e) {
    return null;
  }
}

// (Note: use pickImageUrlFromArray directly where needed)

// ── Component ──────────────────────────────────────────
const Dashboard: React.FC = () => {
  const headerRef = useRef<HTMLDivElement>(null);
  const moodCardRef = useRef<HTMLDivElement>(null);
  const statsCardRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<SpotifyProfile | null>(null);
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
  const [topTracksLong, setTopTracksLong] = useState<SpotifyTrack[]>([]);
  const [topArtists, setTopArtists] = useState<SpotifyArtist[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentItem[]>([]);
  const [audioFeatures, setAudioFeatures] = useState<AudioFeature[]>([]);
  const [moodData, setMoodData] = useState<MoodData>({ happiness: 0.5, energy: 0.5, calmness: 0.5, danceability: 0.5 });
  const [activeTab, setActiveTab] = useState<'overview' | 'evolution' | 'patterns'>('overview');

  const { playSound, isEnabled } = useAudioFeedback();

  // ── Fetch ALL Spotify data ─────
  useEffect(() => {
    // Check if auth completed with a 403 warning (Spotify Dev Mode issue)
    const authWarning = localStorage.getItem('harmonytrack_warning');
    if (authWarning === 'spotify_403') {
      localStorage.removeItem('harmonytrack_warning');
      setError(
        'SPOTIFY 403: Your Spotify app is in Development Mode and your account is not registered. ' +
        'Go to developer.spotify.com/dashboard → your app → Settings → User Management → Add your Spotify email. ' +
        'If this is not your app (client_id: 8f61e675...), create your own Spotify app at developer.spotify.com/dashboard.'
      );
    }
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileRes, topShortRes, topLongRes, artistsRes, recentRes] = await Promise.allSettled([
          spotifyService.getProfile(),
          spotifyService.getTopTracks('short_term', 20),
          spotifyService.getTopTracks('long_term', 20),
          spotifyService.getTopArtists('medium_term', 20),
          spotifyService.getRecentlyPlayed(50),
        ]);

        if (profileRes.status === 'fulfilled') {
          setProfile(profileRes.value.data);
        } else {
          console.warn('[Dashboard] Profile failed:', profileRes.reason?.message);
        }

        let shortTracks: SpotifyTrack[] = [];
        if (topShortRes.status === 'fulfilled') {
          shortTracks = topShortRes.value.data.items || [];
          setTopTracks(shortTracks);
        } else {
          console.warn('[Dashboard] Top tracks (short) failed:', topShortRes.reason?.message);
        }
        if (topLongRes.status === 'fulfilled') {
          setTopTracksLong(topLongRes.value.data.items || []);
        } else {
          console.warn('[Dashboard] Top tracks (long) failed:', topLongRes.reason?.message);
        }
        if (artistsRes.status === 'fulfilled') {
          setTopArtists(artistsRes.value.data.items || []);
        } else {
          console.warn('[Dashboard] Top artists failed:', artistsRes.reason?.message);
        }

        let recentItems: RecentItem[] = [];
        if (recentRes.status === 'fulfilled') {
          recentItems = recentRes.value.data.items || [];
          setRecentlyPlayed(recentItems);
        } else {
          console.warn('[Dashboard] Recently played failed:', recentRes.reason?.message);
        }

        // Diagnostics: identify tracks missing album/images to explain render crash
        if (shortTracks.length > 0) {
          const missingAlbum = shortTracks.filter(t => !t.album);
          const missingImages = shortTracks.filter(t => !t.album?.images || t.album.images.length === 0);
          if (missingAlbum.length > 0 || missingImages.length > 0) {
            console.warn('[Dashboard] Top tracks missing album/images', {
              total: shortTracks.length,
              missingAlbum: missingAlbum.length,
              missingImages: missingImages.length,
              sampleMissingAlbum: missingAlbum[0],
              sampleMissingImages: missingImages[0],
            });
          }
        }

        // Fetch audio features for recent tracks to derive REAL mood
        const trackIds = recentItems.map(r => r.track.id).filter(Boolean);
        const uniqueIds = [...new Set(trackIds)].slice(0, 50);
        if (uniqueIds.length > 0) {
          try {
            const afRes = await spotifyService.getAudioFeatures(uniqueIds);
            const features = (afRes.data.audio_features || []).filter(Boolean);
            setAudioFeatures(features);
            if (features.length > 0) {
              const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
              setMoodData({
                happiness: avg(features.map((f: AudioFeature) => f.valence)),
                energy: avg(features.map((f: AudioFeature) => f.energy)),
                calmness: avg(features.map((f: AudioFeature) => f.acousticness)),
                danceability: avg(features.map((f: AudioFeature) => f.danceability)),
              });
            }
          } catch (afErr) {
            console.warn('Audio features unavailable:', afErr);
          }
        }

        const allFailed = [profileRes, topShortRes, recentRes].every(r => r.status === 'rejected');
        if (allFailed) {
          console.warn('[Dashboard] All Spotify API calls failed');
          const firstRejected = [profileRes, topShortRes, recentRes].find(r => r.status === 'rejected');
          const resStatus = firstRejected?.status === 'rejected' ? firstRejected.reason?.response?.status : null;
          const spotifyMsg = firstRejected?.status === 'rejected' ? firstRejected.reason?.response?.data?.spotifyError : null;
          if (resStatus === 403) {
            setError(`Spotify rejected the request (403). ${spotifyMsg || 'Your account may not be registered in the app. Go to developer.spotify.com/dashboard, your app, Settings, User Management and add your Spotify email.'}`);
          } else if (resStatus === 401) {
            setError('Your Spotify session has expired. Please log out and log in again.');
          } else {
            setError('Could not load Spotify data. Try logging out and reconnecting.');
          }
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Entrance animations
  useEffect(() => {
    if (loading) return;
    animate([moodCardRef.current, statsCardRef.current].filter(Boolean), {
      opacity: [0, 1], translateY: [50, 0], scale: [0.95, 1],
      duration: DURATION.DRAMATIC, delay: stagger(150), ease: 'outElastic(1, 0.7)',
    });
    if (featuresRef.current) {
      animate(featuresRef.current.children, {
        opacity: [0, 1], translateY: [30, 0], scale: [0.9, 1],
        duration: DURATION.SLOW, delay: stagger(100, { start: 600 }), ease: 'outQuad',
      });
    }
  }, [loading]);

  const handleLogout = () => {
    localStorage.removeItem('harmonytrack_token');
    window.location.href = '/';
  };

  // NOTE: handleRelogin kept for backward compatibility but not used when using anchor fallback

  // ── Derived analytics ─────────────────────────────
  const moodCategory = deriveMoodCategory(moodData);
  const totalListeningMs = recentlyPlayed.reduce((sum, r) => sum + (r.track.duration_ms || 0), 0);
  const totalListeningHours = (totalListeningMs / 3600000).toFixed(1);

  const artistCounts: Record<string, number> = {};
  recentlyPlayed.forEach(r => {
    const name = r.track.artists[0]?.name || 'Unknown';
    artistCounts[name] = (artistCounts[name] || 0) + 1;
  });
  const topRecentArtist = Object.entries(artistCounts).sort((a, b) => b[1] - a[1])[0];

  const allGenres = topArtists.flatMap(a => a.genres || []);
  const uniqueGenres = [...new Set(allGenres)];
  const genreCounts: Record<string, number> = {};
  allGenres.forEach(g => { genreCounts[g] = (genreCounts[g] || 0) + 1; });
  const topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const hourCounts = new Array(24).fill(0);
  recentlyPlayed.forEach(r => { hourCounts[getHourBucket(r.played_at)]++; });
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const peakLabel = peakHour < 6 ? 'Late Night' : peakHour < 12 ? 'Morning' : peakHour < 18 ? 'Afternoon' : 'Evening';

  const shortIds = new Set(topTracks.map(t => t.id));
  const longIds = new Set(topTracksLong.map(t => t.id));
  const overlapCount = [...shortIds].filter(id => longIds.has(id)).length;
  const newDiscoveries = topTracks.filter(t => !longIds.has(t.id));

  // ── Styles ──────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    backgroundColor: '#222224', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px', padding: '28px', transition: 'all 0.2s ease',
  };
  const labelStyle: React.CSSProperties = {
    margin: 0, color: '#999', fontSize: '11px', fontWeight: 600,
    textTransform: 'uppercase' as const, letterSpacing: '0.8px',
  };
  const valueStyle: React.CSSProperties = { margin: 0, color: '#fff', fontSize: '22px', fontWeight: 700 };
  const dot = (color: string): React.CSSProperties => ({
    width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, display: 'inline-block',
  });

  // ── Loading state ──────────────────────────────
  if (loading) {
    return (
      <div style={{ width: '100%', minHeight: '100vh', background: '#1a1a1c', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['#FF6B6B','#FFB84D','#4ECDC4','#9B8FFF','#6BCB77'].map((c,i) => (
            <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: c, animation: `pulse 1.2s ease-in-out ${i*0.15}s infinite` }} />
          ))}
        </div>
        <p style={{ color: '#666', fontSize: '14px' }}>Loading your Spotify data...</p>
        <style>{`@keyframes pulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }`}</style>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#1a1a1c', color: '#fff', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", padding: '20px', position: 'relative', overflow: 'hidden' }}>
      <ParticleField density={20} colors={['#FF6B6B','#4ECDC4','#FFB84D','#9B8FFF']} style={{ zIndex: 0 }} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* ─── Header ─────────────────────────────── */}
        <div ref={headerRef} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {profile ? (
              <img src={pickImageUrlFromArray(profile.images) || ''} alt={profile.display_name} style={{ width: '52px', height: '52px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', objectFit: 'cover', background: 'linear-gradient(135deg, #FF6B6B, #9B8FFF)' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', background: 'linear-gradient(135deg, #FF6B6B, #9B8FFF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
            )}
            <div>
              <h1 style={{ fontSize: '26px', color: '#fff', margin: '0 0 2px 0', fontWeight: 700, letterSpacing: '-1px' }}>
                {profile?.display_name ? `Hey, ${profile.display_name}` : 'Dashboard'}
              </h1>
              {profile?.id && (
                <p style={{ margin: '0 0 4px 0', color: '#1DB954', fontSize: '12px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                  @{profile.id}
                </p>
              )}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {['#FF6B6B','#FFB84D','#4ECDC4','#9B8FFF','#6BCB77'].map((c,i) => (
                  <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: c, opacity: 0.7 }} />
                ))}
                {profile && <span style={{ color: '#666', fontSize: '12px', marginLeft: '6px' }}>{profile.product === 'premium' ? 'Premium' : 'Free'} · {profile.followers?.total ?? 0} followers</span>}
              </div>
            </div>
          </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <VolumeControl showLabel={false} orientation="horizontal" />
            {/* Anchor link to backend redirect endpoint — more reliable than AJAX navigation */}
            <a
              href={(import.meta.env.VITE_API_URL || 'http://localhost:8081').trim() + '/api/auth/spotify/redirect'}
              onClick={() => {
                try {
                  if (isEnabled) playSound('click');
                  localStorage.removeItem('harmonytrack_token');
                } catch (e) {}
                // Fallback: if navigation doesn't happen (popup blocker / JS prevention), open in new tab after a short delay
                try {
                  const href = (import.meta.env.VITE_API_URL || 'http://localhost:8081').trim() + '/api/auth/spotify/redirect';
                  const timer = setTimeout(() => {
                    // If page still loaded (navigation didn't occur), open a new tab
                    try { window.open(href, '_blank'); } catch (e) {}
                  }, 700);
                  // Clear timer on unload (navigation happened)
                  window.addEventListener('beforeunload', () => clearTimeout(timer));
                } catch (e) {}
              }}
              style={{ display: 'inline-block', textDecoration: 'none', background: 'transparent', color: '#999', padding: '8px 14px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, transition: 'all 0.2s ease' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#999'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
            >
              Conectar otra cuenta
            </a>

            <button onClick={() => { if (isEnabled) playSound('click'); handleLogout(); }} style={{ background: 'transparent', color: '#999', padding: '8px 20px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, transition: 'all 0.2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#999'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>
              Logout
            </button>
          </div>
        </div>

        {/* ─── Error banner ─────────────────────── */}
        {error && (
          <div style={{ backgroundColor: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: '10px', padding: '14px 20px', marginBottom: '24px', color: '#FF6B6B', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <span style={{ lineHeight: '1.5' }}>{error}</span>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button onClick={() => { localStorage.removeItem('harmonytrack_token'); window.location.href = '/'; }} style={{ background: 'rgba(107,203,119,0.15)', color: '#6BCB77', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}>Re-connect Spotify</button>
                <button onClick={() => window.location.reload()} style={{ background: 'rgba(255,107,107,0.15)', color: '#FF6B6B', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}>Retry</button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Tab Navigation ─────────────────────── */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', backgroundColor: '#222224', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
          {(['overview', 'evolution', 'patterns'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: activeTab === tab ? '#333338' : 'transparent', color: activeTab === tab ? '#fff' : '#666',
              border: 'none', borderRadius: '8px', padding: '8px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, transition: 'all 0.2s ease', textTransform: 'capitalize',
            }}>{tab}</button>
          ))}
        </div>

        {/* ═══════════ OVERVIEW TAB ═══════════ */}
        {activeTab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
              {/* Current Mood card */}
              <div ref={moodCardRef} style={cardStyle}>
                <h2 style={{ fontSize: '16px', marginBottom: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={dot('#FF6B6B')} /> Your Mood — <span style={{ color: '#FF6B6B', textTransform: 'capitalize' }}>{moodCategory}</span>
                </h2>
                <div style={{ marginBottom: '20px' }}><MoodOrb mood={moodData} moodCategory={moodCategory} size={160} /></div>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}><WaveformVisualizer width={300} height={60} color="#FF6B35" mood={moodData} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { label: 'Happiness', value: moodData.happiness, color: '#FFB84D' },
                    { label: 'Energy', value: moodData.energy, color: '#FF6B6B' },
                    { label: 'Calmness', value: moodData.calmness, color: '#4ECDC4' },
                    { label: 'Danceability', value: moodData.danceability, color: '#9B8FFF' },
                  ].map((m, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <p style={{ ...labelStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '6px' }}>
                        <span style={{ ...dot(m.color), width: '5px', height: '5px' }} /> {m.label}
                      </p>
                      <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden', marginBottom: '4px' }}>
                        <div style={{ width: `${m.value * 100}%`, height: '100%', backgroundColor: m.color, borderRadius: '2px', opacity: 0.8 }} />
                      </div>
                      <p style={{ margin: 0, color: '#fff', fontSize: '15px', fontWeight: 600 }}>{(m.value * 100).toFixed(0)}%</p>
                    </div>
                  ))}
                </div>
                <p style={{ margin: '16px 0 0', color: '#555', textAlign: 'center', fontSize: '11px' }}>
                  Calculated from audio features of your {recentlyPlayed.length} recently played tracks
                </p>
              </div>

              {/* Quick stats column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div ref={statsCardRef} style={cardStyle}>
                  <h2 style={{ fontSize: '16px', marginBottom: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={dot('#4ECDC4')} /> Listening Stats
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div><p style={labelStyle}>Recent listening</p><p style={valueStyle}>{totalListeningHours}h</p></div>
                    <div><p style={labelStyle}>Tracks played</p><p style={valueStyle}>{recentlyPlayed.length}</p></div>
                    <div>
                      <p style={labelStyle}>Top artist</p>
                      <p style={{ ...valueStyle, fontSize: '16px' }}>{topRecentArtist?.[0] || '—'}</p>
                      <p style={{ margin: 0, color: '#666', fontSize: '11px' }}>{topRecentArtist ? `${topRecentArtist[1]} plays` : ''}</p>
                    </div>
                    <div>
                      <p style={labelStyle}>Peak time</p>
                      <p style={{ ...valueStyle, fontSize: '16px' }}>{peakLabel}</p>
                      <p style={{ margin: 0, color: '#666', fontSize: '11px' }}>{peakHour}:00 - {(peakHour + 1) % 24}:00</p>
                    </div>
                  </div>
                </div>

                {/* Genre diversity */}
                <div style={cardStyle}>
                  <h2 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={dot('#9B8FFF')} /> Genre Diversity
                    <span style={{ marginLeft: 'auto', color: '#666', fontSize: '12px', fontWeight: 400 }}>{uniqueGenres.length} genres</span>
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {topGenres.map(([genre, count], i) => {
                      const pct = topGenres[0] ? (count / topGenres[0][1]) * 100 : 0;
                      const colors = ['#FF6B6B', '#FFB84D', '#4ECDC4', '#9B8FFF', '#6BCB77'];
                      return (
                        <div key={genre}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: '#ccc', fontSize: '12px', textTransform: 'capitalize' }}>{genre}</span>
                            <span style={{ color: '#666', fontSize: '11px' }}>{count} artists</span>
                          </div>
                          <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', backgroundColor: colors[i % colors.length], borderRadius: '2px', opacity: 0.7 }} />
                          </div>
                        </div>
                      );
                    })}
                    {topGenres.length === 0 && <p style={{ color: '#555', fontSize: '13px', textAlign: 'center' }}>No genre data available</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Tracks */}
            <div style={{ ...cardStyle, marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', marginBottom: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={dot('#FFB84D')} /> Top Tracks
                <span style={{ marginLeft: 'auto', color: '#666', fontSize: '12px', fontWeight: 400 }}>Last 4 weeks</span>
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
                {topTracks.slice(0, 10).map((track, i) => (
                  <div key={track.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', transition: 'background 0.15s', cursor: 'default' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <span style={{ color: '#555', fontSize: '12px', width: '18px', textAlign: 'right', fontWeight: 600 }}>{i + 1}</span>
                    <img
                      src={pickImageUrlFromArray(track.album?.images) || ''}
                      alt={track.name}
                      style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#2a2a2e' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, color: '#fff', fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.name}</p>
                      <p style={{ margin: 0, color: '#666', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.artists.map(a => a.name).join(', ')}</p>
                    </div>
                    <span style={{ color: '#555', fontSize: '11px' }}>{formatMs(track.duration_ms)}</span>
                  </div>
                ))}
                {topTracks.length === 0 && <p style={{ color: '#555', fontSize: '13px', textAlign: 'center', gridColumn: '1/-1', padding: '20px 0' }}>No top tracks data available</p>}
              </div>
            </div>

            {/* Top Artists + Recently Played */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
              <div style={cardStyle}>
                <h2 style={{ fontSize: '16px', marginBottom: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={dot('#6BCB77')} /> Top Artists
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {topArtists.slice(0, 8).map((artist, i) => (
                    <div key={artist.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 10px', borderRadius: '10px', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <span style={{ color: '#555', fontSize: '12px', width: '18px', textAlign: 'right', fontWeight: 600 }}>{i + 1}</span>
                      <img src={pickImageUrlFromArray(artist.images) || ''} alt={artist.name} style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#2a2a2e' }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, color: '#fff', fontSize: '13px', fontWeight: 500 }}>{artist.name}</p>
                        <p style={{ margin: 0, color: '#666', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(artist.genres || []).slice(0, 3).join(', ')}</p>
                      </div>
                      <div style={{ width: '50px' }}>
                        <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${artist.popularity}%`, height: '100%', backgroundColor: '#6BCB77', borderRadius: '2px', opacity: 0.7 }} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {topArtists.length === 0 && <p style={{ color: '#555', fontSize: '13px', textAlign: 'center' }}>No artist data available</p>}
                </div>
              </div>

              <div style={cardStyle}>
                <h2 style={{ fontSize: '16px', marginBottom: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={dot('#FF8FA3')} /> Recently Played
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {recentlyPlayed.slice(0, 10).map((item, i) => (
                    <div key={`${item.track.id}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 10px', borderRadius: '10px', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      {pickImageUrlFromArray(item.track.album?.images) ? (
                        <img src={pickImageUrlFromArray(item.track.album?.images) as string} alt={item.track.album?.name || item.track.name} style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: '#2a2a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, color: '#fff', fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.track.name}</p>
                        <p style={{ margin: 0, color: '#666', fontSize: '11px' }}>{item.track.artists.map(a => a.name).join(', ')}</p>
                      </div>
                      <span style={{ color: '#555', fontSize: '11px', whiteSpace: 'nowrap' }}>{timeAgo(item.played_at)}</span>
                    </div>
                  ))}
                  {recentlyPlayed.length === 0 && <p style={{ color: '#555', fontSize: '13px', textAlign: 'center' }}>No recent plays available</p>}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══════════ EVOLUTION TAB ═══════════ */}
        {activeTab === 'evolution' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            <div style={cardStyle}>
              <h2 style={{ fontSize: '16px', marginBottom: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={dot('#FFB84D')} /> Taste Evolution
              </h2>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <p style={{ margin: '0 0 4px', color: '#999', fontSize: '12px' }}>Taste stability score</p>
                <p style={{ margin: 0, color: '#FFB84D', fontSize: '48px', fontWeight: 700 }}>
                  {topTracks.length > 0 ? Math.round((overlapCount / Math.max(topTracks.length, 1)) * 100) : 0}%
                </p>
                <p style={{ margin: '4px 0 0', color: '#666', fontSize: '12px' }}>
                  {overlapCount} of your current top {topTracks.length} were also in your all-time top
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                  <p style={labelStyle}>Consistent favorites</p>
                  <p style={valueStyle}>{overlapCount}</p>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                  <p style={labelStyle}>New discoveries</p>
                  <p style={valueStyle}>{newDiscoveries.length}</p>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <h2 style={{ fontSize: '16px', marginBottom: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={dot('#4ECDC4')} /> New in Your Rotation
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {newDiscoveries.slice(0, 8).map((track) => (
                  <div key={track.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 10px', borderRadius: '10px' }}>
                    {pickImageUrlFromArray(track.album?.images) && <img src={pickImageUrlFromArray(track.album?.images)!} alt="" style={{ width: '36px', height: '36px', borderRadius: '6px' }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, color: '#fff', fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.name}</p>
                      <p style={{ margin: 0, color: '#666', fontSize: '11px' }}>{track.artists.map(a => a.name).join(', ')}</p>
                    </div>
                  </div>
                ))}
                {newDiscoveries.length === 0 && <p style={{ color: '#555', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Your taste has been very consistent!</p>}
              </div>
            </div>

            <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
              <h2 style={{ fontSize: '16px', marginBottom: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={dot('#9B8FFF')} /> All-Time Favorites
                <span style={{ marginLeft: 'auto', color: '#666', fontSize: '12px', fontWeight: 400 }}>Long term</span>
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
                {topTracksLong.slice(0, 10).map((track, i) => (
                  <div key={track.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <span style={{ color: '#555', fontSize: '12px', width: '18px', textAlign: 'right', fontWeight: 600 }}>{i + 1}</span>
                    {pickImageUrlFromArray(track.album?.images) && <img src={pickImageUrlFromArray(track.album?.images)!} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px' }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, color: '#fff', fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.name}</p>
                      <p style={{ margin: 0, color: '#666', fontSize: '11px' }}>{track.artists.map(a => a.name).join(', ')}</p>
                    </div>
                    {shortIds.has(track.id) && <span style={{ backgroundColor: 'rgba(78,205,196,0.15)', color: '#4ECDC4', fontSize: '10px', padding: '2px 8px', borderRadius: '10px' }}>Still hot</span>}
                  </div>
                ))}
                {topTracksLong.length === 0 && <p style={{ color: '#555', fontSize: '13px', textAlign: 'center', gridColumn: '1/-1', padding: '20px 0' }}>No long-term data available</p>}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ PATTERNS TAB ═══════════ */}
        {activeTab === 'patterns' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {/* Listening schedule heatmap */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: '16px', marginBottom: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={dot('#FF6B6B')} /> Listening Schedule
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                {hourCounts.map((count, hour) => {
                  const max = Math.max(...hourCounts, 1);
                  const intensity = count / max;
                  return (
                    <div key={hour} style={{ textAlign: 'center' }}>
                      <div style={{
                        width: '100%', aspectRatio: '1', borderRadius: '8px',
                        backgroundColor: count > 0 ? `rgba(255, 107, 107, ${0.1 + intensity * 0.7})` : 'rgba(255,255,255,0.03)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', color: intensity > 0.5 ? '#fff' : '#666', fontWeight: 600,
                      }}>
                        {count > 0 ? count : ''}
                      </div>
                      <p style={{ margin: '4px 0 0', color: '#555', fontSize: '9px' }}>{hour}:00</p>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#999', fontSize: '12px' }}>Peak: <strong style={{ color: '#FF6B6B' }}>{peakLabel} ({peakHour}:00)</strong></span>
                <span style={{ color: '#666', fontSize: '11px' }}>{recentlyPlayed.length} plays analyzed</span>
              </div>
            </div>

            {/* Audio profile */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: '16px', marginBottom: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={dot('#4ECDC4')} /> Your Audio Profile
              </h2>
              {audioFeatures.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {(() => {
                    const avg = (key: keyof AudioFeature) => {
                      const vals = audioFeatures.map(f => f[key] as number).filter(v => typeof v === 'number');
                      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                    };
                    const avgTempo = avg('tempo');
                    const metrics = [
                      { label: 'Danceability', value: avg('danceability'), color: '#9B8FFF' },
                      { label: 'Energy', value: avg('energy'), color: '#FF6B6B' },
                      { label: 'Valence (Happiness)', value: avg('valence'), color: '#FFB84D' },
                      { label: 'Acousticness', value: avg('acousticness'), color: '#4ECDC4' },
                      { label: 'Instrumentalness', value: avg('instrumentalness'), color: '#6BCB77' },
                    ];
                    return (
                      <>
                        {metrics.map((m, i) => (
                          <div key={i}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ color: '#ccc', fontSize: '12px' }}>{m.label}</span>
                              <span style={{ color: m.color, fontSize: '12px', fontWeight: 600 }}>{(m.value * 100).toFixed(0)}%</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${m.value * 100}%`, height: '100%', backgroundColor: m.color, borderRadius: '3px', opacity: 0.8 }} />
                            </div>
                          </div>
                        ))}
                        <div style={{ marginTop: '8px', padding: '14px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px', textAlign: 'center' }}>
                          <p style={labelStyle}>Average Tempo</p>
                          <p style={{ ...valueStyle, color: '#FF8FA3' }}>{avgTempo.toFixed(0)} BPM</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <p style={{ color: '#555', textAlign: 'center', fontSize: '13px', padding: '20px 0' }}>Audio feature data not available</p>
              )}
            </div>

            {/* Most repeated tracks */}
            <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
              <h2 style={{ fontSize: '16px', marginBottom: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={dot('#FFB84D')} /> Most Repeated Recently
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
                {(() => {
                  const trackPlays: Record<string, { track: SpotifyTrack; count: number }> = {};
                  recentlyPlayed.forEach(r => {
                    if (!trackPlays[r.track.id]) trackPlays[r.track.id] = { track: r.track, count: 0 };
                    trackPlays[r.track.id].count++;
                  });
                  const repeated = Object.values(trackPlays).filter(t => t.count > 1).sort((a, b) => b.count - a.count).slice(0, 8);
                  if (repeated.length === 0) return <p style={{ color: '#555', fontSize: '13px', textAlign: 'center', padding: '20px 0', gridColumn: '1 / -1' }}>No repeated tracks — great variety!</p>;
                  return repeated.map(({ track, count }) => (
                    <div key={track.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px' }}>
                      {pickImageUrlFromArray(track.album?.images) && <img src={pickImageUrlFromArray(track.album?.images)!} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px' }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, color: '#fff', fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.name}</p>
                        <p style={{ margin: 0, color: '#666', fontSize: '11px' }}>{track.artists.map(a => a.name).join(', ')}</p>
                      </div>
                      <span style={{ backgroundColor: 'rgba(255,184,77,0.15)', color: '#FFB84D', fontSize: '11px', padding: '3px 10px', borderRadius: '10px', fontWeight: 600 }}>{count}x</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;

