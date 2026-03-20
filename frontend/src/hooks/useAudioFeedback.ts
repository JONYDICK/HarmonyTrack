import { useEffect, useState, useCallback } from 'react';
import { getSoundEffects, SoundType, MoodCategory, AudioConfig } from '../audio/SoundEffects';

/**
 * React hook for using the comprehensive audio feedback system
 */
export const useAudioFeedback = () => {
  const soundEffects = getSoundEffects();
  const [config, setConfig] = useState<AudioConfig>(soundEffects.getConfig());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize audio on mount
    const initAudio = async () => {
      try {
        await soundEffects.init();
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize audio:', error);
      }
    };

    // Only initialize if enabled
    if (config.enabled) {
      initAudio();
    }

    // Update config when it changes
    const updateConfig = () => {
      setConfig(soundEffects.getConfig());
    };

    // Poll config every second (simple approach)
    const interval = setInterval(updateConfig, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [config.enabled]);

  const playSound = useCallback((type: SoundType) => {
    if (config.enabled && isReady) {
      soundEffects.playSound(type);
    }
  }, [config.enabled, isReady, soundEffects]);

  const playMoodSignature = useCallback((mood: MoodCategory, duration?: number) => {
    if (config.enabled && isReady) {
      soundEffects.playMoodSignature(mood, duration);
    }
  }, [config.enabled, isReady, soundEffects]);

  const playChord = useCallback((notes: string[], duration?: string) => {
    if (config.enabled && isReady) {
      soundEffects.playChord(notes, duration);
    }
  }, [config.enabled, isReady, soundEffects]);

  const playSequence = useCallback((notes: string[], duration?: string, interval?: number) => {
    if (config.enabled && isReady) {
      soundEffects.playSequence(notes, duration, interval);
    }
  }, [config.enabled, isReady, soundEffects]);

  const setVolume = useCallback((volume: number) => {
    soundEffects.setVolume(volume);
    setConfig(soundEffects.getConfig());
  }, [soundEffects]);

  const setEnabled = useCallback(async (enabled: boolean) => {
    soundEffects.setEnabled(enabled);
    setConfig(soundEffects.getConfig());
    
    if (enabled && !isReady) {
      try {
        await soundEffects.init();
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize audio:', error);
      }
    }
  }, [soundEffects, isReady]);

  const getMoodAudioData = useCallback((mood: {
    happiness: number;
    energy: number;
    calmness: number;
    danceability: number;
  }) => {
    return soundEffects.getMoodAudioData(mood);
  }, [soundEffects]);

  return {
    playSound,
    playMoodSignature,
    playChord,
    playSequence,
    getMoodAudioData,
    setVolume,
    setEnabled,
    config,
    isReady,
    isEnabled: config.enabled,
  };
};

export default useAudioFeedback;
