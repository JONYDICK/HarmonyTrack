import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { animate, stagger } from 'animejs';
import { ParticleField } from '../visualizers/ParticleField';
import { WaveformVisualizer } from '../visualizers/WaveformVisualizer';
import { VolumeControl } from '../components/VolumeControl';
import { useAudioFeedback } from '../hooks/useAudioFeedback';
import { MoodCategory } from '../audio/SoundEffects';
import { AUDIO_VIS, DURATION } from '../animations/config';

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  uri: string;
}

interface Recommendation {
  id: string;
  name: string;
  description: string;
  mood_category: string;
  confidence: number;
  mood_score: {
    happiness: number;
    energy: number;
    calmness: number;
    danceability: number;
  };
  genres: string[];
  tracks: Track[];
}

const RecommendationsPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

  const cardsRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  const { playSound, playMoodSignature, isEnabled } = useAudioFeedback();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  useEffect(() => {
    // Animate cards entrance
    if (cardsRef.current && recommendations.length > 0) {
      animate(cardsRef.current.children, {
        opacity: [0, 1],
        translateY: [80, 0],
        scale: [0.8, 1],
        rotateX: [-15, 0],
        duration: DURATION.DRAMATIC,
        delay: stagger(150),
        ease: 'outElastic(1, 0.7)',
      });
    }
  }, [recommendations]);

  useEffect(() => {
    // Animate details panel
    if (detailsRef.current && selectedRec) {
      animate(detailsRef.current, {
        opacity: [0, 1],
        translateY: [30, 0],
        duration: DURATION.SLOW,
        ease: 'outQuad',
      });
    }
  }, [selectedRec]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('harmonytrack_token');
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8081').trim();
      const response = await axios.get(`${apiUrl}/api/recommendations`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setRecommendations(response.data.recommendations || []);
      if (response.data.recommendations && response.data.recommendations.length > 0) {
        setSelectedRec(response.data.recommendations[0]);
      }
    } catch (err: any) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('harmonytrack_token');
    window.location.href = '/';
  };

  const handleCardClick = (rec: Recommendation) => {
    setSelectedRec(rec);
    if (isEnabled) {
      playSound('select');
      // Play mood-specific signature
      setTimeout(() => {
        playMoodSignature(rec.mood_category as MoodCategory, 0.5);
      }, 100);
    }
  };

  const handleCardFlip = (recId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEnabled) {
      playSound('flip');
    }
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recId)) {
        newSet.delete(recId);
      } else {
        newSet.add(recId);
      }
      return newSet;
    });
  };

  const getMoodColor = (category: string): string => {
    const colors = AUDIO_VIS.WAVE_COLORS;
    return colors[category.toUpperCase() as keyof typeof colors] || colors.ENERGETIC;
  };

  const moodCategoryLabel = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ');
  };

  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        background: '#1a1a1c',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <ParticleField density={15} />
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}>
          {['#FF6B6B', '#FFB84D', '#4ECDC4', '#9B8FFF', '#6BCB77'].map((c, i) => (
            <div key={i} style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: c,
              animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
        <div style={{
          color: '#999',
          fontSize: '16px',
          fontWeight: '500',
        }}>
          Generating your personalized playlists...
        </div>
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
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: '#1a1a1c',
      color: '#fff',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      paddingBottom: '60px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Particle background — subtle */}
      <ParticleField 
        density={18}
        colors={['#FF6B6B', '#4ECDC4', '#FFB84D', '#9B8FFF']}
        style={{ zIndex: 0 }}
      />

      {/* Header */}
      <div style={{
        backgroundColor: 'rgba(26, 26, 28, 0.95)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        padding: '20px 0',
        marginBottom: '40px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px',
        }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              color: '#fff',
              margin: '0 0 6px 0',
              fontWeight: '700',
              letterSpacing: '-0.8px',
            }}>
              AI Recommendations
            </h1>
            {/* Colored dots */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {['#FF6B6B', '#FFB84D', '#4ECDC4', '#9B8FFF', '#6BCB77', '#FF8FA3'].map((c, i) => (
                <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: c, opacity: 0.7 }} />
              ))}
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
          }}>
            {/* Volume Control */}
            <VolumeControl showLabel={false} orientation="horizontal" />

            {/* Refresh Button */}
            <button
              onClick={() => {
                if (isEnabled) playSound('refresh');
                fetchRecommendations();
              }}
              style={{
                background: '#FF6B6B',
                color: '#fff',
                padding: '8px 20px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FF8585';
                if (isEnabled) playSound('hover');
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FF6B6B';
              }}
            >
              Refresh
            </button>

            {/* Dashboard Button */}
            <button
              onClick={() => {
                if (isEnabled) playSound('navigation');
                window.location.href = '/';
              }}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#999',
                padding: '8px 18px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                if (isEnabled) playSound('hover');
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#999';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              ← Dashboard
            </button>

            {/* Logout Button */}
            <button
              onClick={() => {
                if (isEnabled) playSound('click');
                handleLogout();
              }}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#999',
                padding: '8px 18px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#FF6B6B';
                e.currentTarget.style.borderColor = 'rgba(255, 107, 107, 0.3)';
                if (isEnabled) playSound('hover');
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#999';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 30px',
        position: 'relative',
        zIndex: 1,
      }}>
        {error && (
          <div style={{
            background: '#2a2a2e',
            color: '#FF6B6B',
            padding: '16px 24px',
            borderRadius: '10px',
            marginBottom: '24px',
            fontSize: '14px',
            fontWeight: '500',
            border: '1px solid rgba(255, 107, 107, 0.2)',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {/* Playlist Cards Grid */}
        <div 
          ref={cardsRef}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '30px',
            marginBottom: '50px',
          }}
        >
          {recommendations.map((rec) => {
            const isFlipped = flippedCards.has(rec.id);
            const isSelected = selectedRec?.id === rec.id;
            const moodColor = getMoodColor(rec.mood_category);

            return (
              <div
                key={rec.id}
                onClick={() => handleCardClick(rec)}
                style={{
                  perspective: '1000px',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '400px',
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
                  }}
                >
                  {/* Card Front */}
                  <div
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      backfaceVisibility: 'hidden',
                      backgroundColor: isSelected ? '#2a2a2e' : '#222224',
                      borderRadius: '14px',
                      padding: '28px',
                      border: isSelected 
                        ? `1px solid ${moodColor}44` 
                        : '1px solid rgba(255, 255, 255, 0.06)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (isEnabled) playSound('hover');
                      e.currentTarget.style.borderColor = `${moodColor}33`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isSelected
                        ? `${moodColor}44`
                        : 'rgba(255, 255, 255, 0.06)';
                    }}
                  >
                    {/* Flip button */}
                    <button
                      onClick={(e) => handleCardFlip(rec.id, e)}
                      style={{
                        position: 'absolute',
                        top: '14px',
                        right: '14px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#999',
                        width: '30px',
                        height: '30px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        zIndex: 2,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                        e.currentTarget.style.color = '#999';
                      }}
                    >
                      ↻
                    </button>

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      gap: '20px',
                    }}>
                      {/* Waveform Visualizer */}
                      <div style={{
                        height: '90px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: '10px',
                        overflow: 'hidden',
                      }}>
                        <WaveformVisualizer
                          width={260}
                          height={80}
                          color={moodColor}
                          mood={rec.mood_score}
                        />
                      </div>

                      {/* Title */}
                      <div>
                        <h3 style={{
                          margin: '0 0 6px 0',
                          fontSize: '18px',
                          color: '#fff',
                          fontWeight: '600',
                          lineHeight: '1.3',
                        }}>
                          {rec.name}
                        </h3>
                        <p style={{
                          margin: '0',
                          fontSize: '12px',
                          color: '#999',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: moodColor, display: 'inline-block' }} />
                          {moodCategoryLabel(rec.mood_category)} · {rec.tracks.length} tracks
                        </p>
                      </div>

                      {/* Genres */}
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}>
                        {rec.genres.slice(0, 3).map((genre, i) => (
                          <span
                            key={i}
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.06)',
                              color: '#999',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '500',
                              textTransform: 'capitalize',
                            }}
                          >
                            {genre}
                          </span>
                        ))}
                      </div>

                      {/* Description */}
                      <p style={{
                        fontSize: '13px',
                        color: '#666',
                        margin: '0',
                        flex: 1,
                        lineHeight: '1.5',
                      }}>
                        {rec.description}
                      </p>

                      {/* Confidence Bar */}
                      <div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '8px',
                        }}>
                          <span style={{
                            fontSize: '11px',
                            color: '#666',
                            fontWeight: '500',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}>
                            AI Match
                          </span>
                          <span style={{
                            fontSize: '13px',
                            color: '#fff',
                            fontWeight: '600',
                          }}>
                            {Math.round(rec.confidence * 100)}%
                          </span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '4px',
                          backgroundColor: 'rgba(255, 255, 255, 0.06)',
                          borderRadius: '2px',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${rec.confidence * 100}%`,
                            height: '100%',
                            backgroundColor: moodColor,
                            borderRadius: '2px',
                            opacity: 0.7,
                          }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Back (Track List) */}
                  <div
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      backfaceVisibility: 'hidden',
                      backgroundColor: '#222224',
                      borderRadius: '14px',
                      padding: '28px',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      transform: 'rotateY(180deg)',
                      overflow: 'auto',
                    }}
                  >
                    <h4 style={{
                      margin: '0 0 18px 0',
                      fontSize: '15px',
                      color: '#fff',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: moodColor, display: 'inline-block' }} />
                      Track List
                    </h4>
                    
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}>
                      {rec.tracks.map((track, i) => (
                        <div
                          key={track.id}
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.04)',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                          }}>
                            <span style={{
                              width: '22px',
                              height: '22px',
                              backgroundColor: `${moodColor}22`,
                              color: moodColor,
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: '600',
                              flexShrink: 0,
                            }}>
                              {i + 1}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{
                                margin: '0 0 4px 0',
                                color: '#fff',
                                fontSize: '13px',
                                fontWeight: '600',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}>
                                {track.name}
                              </p>
                              <p style={{
                                margin: '0',
                                color: '#666',
                                fontSize: '11px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}>
                                {track.artist}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Flip back button */}
                    <button
                      onClick={(e) => handleCardFlip(rec.id, e)}
                      style={{
                        marginTop: '16px',
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#999',
                        padding: '10px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                        e.currentTarget.style.color = '#999';
                      }}
                    >
                      ← Back
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Recommendation Details */}
        {selectedRec && (
          <div 
            ref={detailsRef}
            style={{
              backgroundColor: '#222224',
              borderRadius: '14px',
              padding: '36px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <h2 style={{
              fontSize: '18px',
              color: '#fff',
              marginBottom: '28px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getMoodColor(selectedRec.mood_category), display: 'inline-block' }} />
              Mood Breakdown
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '25px',
            }}>
              {Object.entries(selectedRec.mood_score).map(([key, value]) => (
                <div
                  key={key}
                  style={{
                    backgroundColor: '#2a2a2e',
                    padding: '22px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.04)';
                  }}
                >
                  <p style={{
                    margin: '0 0 10px 0',
                    color: '#999',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    {key.replace('_', ' ')}
                  </p>
                  
                  <div style={{
                    width: '100%',
                    height: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    marginBottom: '10px',
                  }}>
                    <div style={{
                      width: `${value * 100}%`,
                      height: '100%',
                      backgroundColor: getMoodColor(selectedRec.mood_category),
                      borderRadius: '2px',
                      opacity: 0.7,
                      transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    }} />
                  </div>
                  
                  <p style={{
                    margin: '0',
                    color: '#fff',
                    fontSize: '22px',
                    fontWeight: '700',
                  }}>
                    {(value * 100).toFixed(0)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationsPage;
