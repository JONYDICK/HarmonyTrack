import React, { useState, useEffect, useRef } from 'react';
import { animate } from 'animejs';
import { getSoundEffects } from '../audio/SoundEffects';
import { DURATION } from '../animations/config';

interface VolumeControlProps {
  className?: string;
  showLabel?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

export const VolumeControl: React.FC<VolumeControlProps> = ({
  className = '',
  showLabel = true,
  orientation = 'horizontal',
}) => {
  const soundEffects = getSoundEffects();
  const [volume, setVolume] = useState(soundEffects.getConfig().volume);
  const [enabled, setEnabled] = useState(soundEffects.getConfig().enabled);
  const [isDragging, setIsDragging] = useState(false);
  
  const sliderRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate fill bar when volume changes
    if (fillRef.current) {
      animate(fillRef.current, {
        width: orientation === 'horizontal' ? `${volume * 100}%` : '100%',
        height: orientation === 'vertical' ? `${volume * 100}%` : '100%',
        duration: DURATION.FAST,
        ease: 'outQuad',
      });
    }
  }, [volume, orientation]);

  const handleToggle = async () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    soundEffects.setEnabled(newEnabled);

    if (newEnabled) {
      await soundEffects.init();
      soundEffects.playSound('success');
    } else {
      soundEffects.playSound('click');
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    soundEffects.setVolume(newVolume);
    
    // Play feedback sound at intervals
    if (enabled && Math.abs(newVolume - volume) > 0.1) {
      soundEffects.playSound('hover');
    }
  };

  const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    let newVolume: number;

    if (orientation === 'horizontal') {
      newVolume = (e.clientX - rect.left) / rect.width;
    } else {
      newVolume = 1 - (e.clientY - rect.top) / rect.height;
    }

    handleVolumeChange(Math.max(0, Math.min(1, newVolume)));
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    let newVolume: number;

    if (orientation === 'horizontal') {
      newVolume = (e.clientX - rect.left) / rect.width;
    } else {
      newVolume = 1 - (e.clientY - rect.top) / rect.height;
    }

    handleVolumeChange(Math.max(0, Math.min(1, newVolume)));
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const VolumeIcon = () => {
    const c = getVolumeColor();
    if (!enabled || volume === 0) {
      // Muted icon — speaker with X
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      );
    }
    if (volume < 0.33) {
      // Low volume
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      );
    }
    if (volume < 0.66) {
      // Medium volume
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      );
    }
    // High volume
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
    );
  };

  const getVolumeColor = () => {
    if (!enabled) return '#666';
    if (volume < 0.33) return '#4ECDC4';
    if (volume < 0.66) return '#FFB84D';
    return '#FF6B6B';
  };

  const isHorizontal = orientation === 'horizontal';

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexDirection: isHorizontal ? 'row' : 'column',
      }}
    >
      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        style={{
          backgroundColor: enabled ? 'rgba(255, 107, 107, 0.1)' : 'rgba(255, 255, 255, 0.04)',
          border: `1px solid ${enabled ? 'rgba(255, 107, 107, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
          color: enabled ? '#FF6B6B' : '#666',
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = enabled ? 'rgba(255, 107, 107, 0.5)' : 'rgba(255, 255, 255, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = enabled ? 'rgba(255, 107, 107, 0.3)' : 'rgba(255, 255, 255, 0.08)';
        }}
        title={enabled ? 'Mute audio' : 'Enable audio'}
      >
        <VolumeIcon />
      </button>

      {/* Volume Slider */}
      {enabled && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexDirection: isHorizontal ? 'row' : 'column',
          }}
        >
          {showLabel && (
            <span
              style={{
                fontSize: '11px',
                color: '#999',
                fontWeight: '500',
                minWidth: '50px',
                textAlign: isHorizontal ? 'left' : 'center',
              }}
            >
              {Math.round(volume * 100)}%
            </span>
          )}

          <div
            ref={sliderRef}
            onClick={handleSliderClick}
            onMouseDown={handleMouseDown}
            style={{
              position: 'relative',
              width: isHorizontal ? '100px' : '36px',
              height: isHorizontal ? '6px' : '100px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              borderRadius: '3px',
              cursor: 'pointer',
              overflow: 'hidden',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = isHorizontal ? 'scaleY(1.3)' : 'scaleX(1.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {/* Fill Bar */}
            <div
              ref={fillRef}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: isHorizontal ? `${volume * 100}%` : '100%',
                height: isHorizontal ? '100%' : `${volume * 100}%`,
                backgroundColor: getVolumeColor(),
                borderRadius: '3px',
                opacity: 0.7,
                transition: 'box-shadow 0.2s ease',
              }}
            />

            {/* Thumb */}
            <div
              style={{
                position: 'absolute',
                [isHorizontal ? 'left' : 'bottom']: `calc(${volume * 100}% - 8px)`,
                [isHorizontal ? 'top' : 'left']: '50%',
                transform: isHorizontal ? 'translateY(-50%)' : 'translateX(-50%)',
                width: '12px',
                height: '12px',
                backgroundColor: getVolumeColor(),
                borderRadius: '50%',
                border: '2px solid #1a1a1c',
                cursor: 'grab',
                transition: 'all 0.2s ease',
                pointerEvents: isDragging ? 'none' : 'auto',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = isHorizontal 
                  ? 'translateY(-50%) scale(1.3)' 
                  : 'translateX(-50%) scale(1.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = isHorizontal 
                  ? 'translateY(-50%) scale(1)' 
                  : 'translateX(-50%) scale(1)';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VolumeControl;
