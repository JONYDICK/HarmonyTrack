/**
 * MoodOrb Component
 * Animated orb that pulses based on mood intensity
 */

import React, { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import { AUDIO_VIS } from '../animations/config';

interface MoodOrbProps {
  mood: {
    happiness: number;
    energy: number;
    calmness: number;
    danceability?: number;
  };
  moodCategory?: string;
  size?: number;
  className?: string;
}

export const MoodOrb: React.FC<MoodOrbProps> = ({
  mood,
  moodCategory = 'energetic',
  size = 200,
  className = '',
}) => {
  const orbRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!orbRef.current || !glowRef.current) return;

    // Get color based on mood category
    const color = AUDIO_VIS.WAVE_COLORS[moodCategory.toUpperCase() as keyof typeof AUDIO_VIS.WAVE_COLORS] 
      || AUDIO_VIS.WAVE_COLORS.ENERGETIC;

    // Calculate pulse intensity based on mood
    const pulseIntensity = (mood.energy + mood.happiness) / 2;
    const pulseSpeed = 1000 + (1 - pulseIntensity) * 2000;

    // Animate orb pulse — subtle
    const orbAnimation = animate(orbRef.current, {
      scale: [1, 1 + pulseIntensity * 0.08, 1],
      duration: pulseSpeed,
      ease: 'inOutQuad',
      loop: true,
    });

    // Animate glow — subtle
    const glowAnimation = animate(glowRef.current, {
      opacity: [0.15, 0.35, 0.15],
      scale: [1, 1.1, 1],
      duration: pulseSpeed * 0.8,
      ease: 'inOutSine',
      loop: true,
    });

    // Update colors
    if (orbRef.current) {
      orbRef.current.style.background = `
        radial-gradient(circle at 30% 30%, ${color}dd, ${color}44)
      `;
    }
    if (glowRef.current) {
      glowRef.current.style.boxShadow = `
        0 0 ${20 + pulseIntensity * 30}px ${color}44,
        0 0 ${40 + pulseIntensity * 60}px ${color}22
      `;
    }

    return () => {
      orbAnimation.pause();
      glowAnimation.pause();
    };
  }, [mood, moodCategory]);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        margin: '0 auto',
      }}
    >
      {/* Glow layer */}
      <div
        ref={glowRef}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      
      {/* Main orb */}
      <div
        ref={orbRef}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          height: '80%',
          borderRadius: '50%',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
      />

      {/* Inner particles */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '60%',
          height: '60%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #ffffff22, transparent)',
          pointerEvents: 'none',
          animation: 'spin 10s linear infinite',
        }}
      />
    </div>
  );
};

export default MoodOrb;
