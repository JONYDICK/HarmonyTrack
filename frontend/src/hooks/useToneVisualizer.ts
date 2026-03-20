/**
 * useToneVisualizer Hook
 * Maps mood metrics to tone.js audio synthesis
 */

import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

interface MoodMetrics {
  happiness: number;
  energy: number;
  calmness: number;
  danceability?: number;
}

interface UseToneVisualizerOptions {
  autoStart?: boolean;
  volume?: number;
}

export const useToneVisualizer = (
  mood: MoodMetrics,
  options: UseToneVisualizerOptions = {}
) => {
  const { autoStart = false, volume = -20 } = options;
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);

  // Initialize synth
  useEffect(() => {
    synthRef.current = new Tone.PolySynth(Tone.Synth, {
      volume,
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.3,
        release: 1,
      },
    }).toDestination();

    setIsAudioReady(true);

    return () => {
      synthRef.current?.dispose();
    };
  }, [volume]);

  // Start audio context on user interaction
  const startAudioContext = async () => {
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }
  };

  // Map mood to musical notes
  const getMoodNotes = (mood: MoodMetrics): string[] => {
    const baseOctave = Math.floor(3 + mood.energy * 2); // Energy affects octave (3-5)
    
    if (mood.happiness > 0.7) {
      // Happy: Major chord
      return [`C${baseOctave}`, `E${baseOctave}`, `G${baseOctave}`];
    } else if (mood.happiness < 0.3) {
      // Sad: Minor chord
      return [`A${baseOctave}`, `C${baseOctave}`, `E${baseOctave}`];
    } else if (mood.energy > 0.7) {
      // Energetic: Power chord
      return [`E${baseOctave}`, `B${baseOctave}`, `E${baseOctave + 1}`];
    } else if (mood.calmness > 0.7) {
      // Calm: Ambient notes
      return [`F${baseOctave}`, `A${baseOctave}`, `C${baseOctave + 1}`];
    }
    
    // Default: Neutral
    return [`D${baseOctave}`, `F${baseOctave}`, `A${baseOctave}`];
  };

  // Play mood-based tones
  const playMoodTone = async () => {
    if (!synthRef.current || !isAudioReady) return;
    
    await startAudioContext();
    
    const notes = getMoodNotes(mood);
    const duration = `${0.5 + mood.calmness * 1.5}n`; // Calmness affects duration
    
    synthRef.current.triggerAttackRelease(notes, duration);
    setIsPlaying(true);
    
    setTimeout(() => setIsPlaying(false), 1000);
  };

  // Play subtle hover sound
  const playHoverSound = async () => {
    if (!synthRef.current || !isAudioReady) return;
    
    await startAudioContext();
    
    const note = getMoodNotes(mood)[0]; // Single note
    synthRef.current.triggerAttackRelease(note, '8n');
  };

  // Play click sound
  const playClickSound = async () => {
    if (!synthRef.current || !isAudioReady) return;
    
    await startAudioContext();
    
    const notes = getMoodNotes(mood);
    synthRef.current.triggerAttackRelease(notes, '16n');
  };

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && isAudioReady) {
      playMoodTone();
    }
  }, [autoStart, isAudioReady]);

  return {
    isPlaying,
    isAudioReady,
    playMoodTone,
    playHoverSound,
    playClickSound,
    startAudioContext,
  };
};

export default useToneVisualizer;
