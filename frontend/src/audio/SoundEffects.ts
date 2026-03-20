import * as Tone from 'tone';

/**
 * Comprehensive audio feedback system for HarmonyTrack
 * Maps mood categories to musical signatures and provides UI sound effects
 */

export interface AudioConfig {
  volume: number; // 0-1 range
  enabled: boolean;
  muteOnError: boolean;
}

export type SoundType = 
  | 'hover'
  | 'click'
  | 'success'
  | 'error'
  | 'navigation'
  | 'select'
  | 'deselect'
  | 'flip'
  | 'refresh';

export type MoodCategory = 
  | 'energetic'
  | 'calm'
  | 'happy'
  | 'melancholic'
  | 'focused'
  | 'party'
  | 'romantic'
  | 'introspective';

const STORAGE_KEY = 'harmonytrack_audio_config';

/**
 * Sound effect library using tone.js synthesis
 */
export class SoundEffects {
  private synth: Tone.PolySynth;
  private noiseSynth: Tone.NoiseSynth;
  private membranesynth: Tone.MembraneSynth;
  private config: AudioConfig;
  private initialized: boolean = false;

  constructor(config?: Partial<AudioConfig>) {
    // Load config from localStorage or use defaults
    const savedConfig = this.loadConfig();
    this.config = {
      volume: config?.volume ?? savedConfig.volume,
      enabled: config?.enabled ?? savedConfig.enabled,
      muteOnError: config?.muteOnError ?? savedConfig.muteOnError,
    };

    // Initialize synthesizers
    this.synth = new Tone.PolySynth(Tone.Synth, {
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.2,
        release: 0.3,
      },
      volume: this.getDecibelVolume(),
    }).toDestination();

    this.noiseSynth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.005,
        decay: 0.05,
        sustain: 0,
        release: 0.05,
      },
      volume: this.getDecibelVolume() - 10,
    }).toDestination();

    this.membranesynth = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 8,
      volume: this.getDecibelVolume() - 5,
    }).toDestination();
  }

  /**
   * Initialize audio context (must be called after user interaction)
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      await Tone.start();
      this.initialized = true;
      console.log('🔊 Audio system initialized');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      if (this.config.muteOnError) {
        this.config.enabled = false;
      }
    }
  }

  /**
   * Play mood-specific musical signature
   */
  playMoodSignature(mood: MoodCategory, duration: number = 0.5): void {
    if (!this.canPlay()) return;

    const signatures = this.getMoodSignatures();
    const { notes, octave } = signatures[mood] || signatures.energetic;

    const adjustedNotes = notes.map(note => `${note}${octave}`);
    
    this.synth.triggerAttackRelease(adjustedNotes, duration);
  }

  /**
   * Play UI sound effect
   */
  playSound(type: SoundType): void {
    if (!this.canPlay()) return;

    switch (type) {
      case 'hover':
        this.synth.triggerAttackRelease('C5', '32n');
        break;

      case 'click':
        this.synth.triggerAttackRelease(['E5', 'G5'], '64n');
        break;

      case 'success':
        this.synth.triggerAttackRelease(['C5', 'E5', 'G5', 'C6'], '16n');
        break;

      case 'error':
        this.synth.triggerAttackRelease(['F3', 'Db3'], '8n');
        this.noiseSynth.triggerAttackRelease('16n');
        break;

      case 'navigation':
        this.synth.triggerAttackRelease(['A4', 'D5'], '32n');
        break;

      case 'select':
        this.synth.triggerAttackRelease(['C5', 'E5', 'G5'], '16n');
        break;

      case 'deselect':
        this.synth.triggerAttackRelease(['G4', 'E4', 'C4'], '16n');
        break;

      case 'flip':
        const flipSequence = new Tone.Sequence(
          (time, note) => {
            this.synth.triggerAttackRelease(note, '64n', time);
          },
          ['C5', 'E5', 'G5', 'B5'],
          '64n'
        );
        flipSequence.start(0);
        flipSequence.stop('+0.2');
        Tone.Transport.start();
        setTimeout(() => Tone.Transport.stop(), 200);
        break;

      case 'refresh':
        this.membranesynth.triggerAttackRelease('C2', '16n');
        setTimeout(() => {
          this.synth.triggerAttackRelease(['C5', 'G5', 'C6'], '32n');
        }, 100);
        break;
    }
  }

  /**
   * Play custom note sequence
   */
  playSequence(notes: string[], duration: string = '16n', interval: number = 100): void {
    if (!this.canPlay()) return;

    notes.forEach((note, index) => {
      setTimeout(() => {
        this.synth.triggerAttackRelease(note, duration);
      }, index * interval);
    });
  }

  /**
   * Play chord progression
   */
  playChord(notes: string[], duration: string = '4n'): void {
    if (!this.canPlay()) return;
    this.synth.triggerAttackRelease(notes, duration);
  }

  /**
   * Generate audio visualization data based on mood metrics
   */
  getMoodAudioData(mood: {
    happiness: number;
    energy: number;
    calmness: number;
    danceability: number;
  }): {
    frequency: number;
    amplitude: number;
    waveform: OscillatorType;
    tempo: number;
  } {
    const frequency = 200 + mood.happiness * 600; // 200-800 Hz
    const amplitude = 0.3 + mood.energy * 0.5; // 0.3-0.8
    
    let waveform: OscillatorType = 'sine';
    if (mood.energy > 0.7) waveform = 'sawtooth';
    else if (mood.danceability > 0.7) waveform = 'square';
    else if (mood.calmness > 0.7) waveform = 'triangle';

    const tempo = 60 + mood.danceability * 100; // 60-160 BPM

    return { frequency, amplitude, waveform, tempo };
  }

  /**
   * Set volume (0-1 range)
   */
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
    const dbVolume = this.getDecibelVolume();
    
    this.synth.volume.value = dbVolume;
    this.noiseSynth.volume.value = dbVolume - 10;
    this.membranesynth.volume.value = dbVolume - 5;
    
    this.saveConfig();
  }

  /**
   * Enable/disable audio
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.saveConfig();
  }

  /**
   * Get current configuration
   */
  getConfig(): AudioConfig {
    return { ...this.config };
  }

  /**
   * Check if audio can be played
   */
  private canPlay(): boolean {
    return this.initialized && this.config.enabled;
  }

  /**
   * Convert 0-1 volume to decibels
   */
  private getDecibelVolume(): number {
    if (this.config.volume === 0) return -Infinity;
    // Map 0-1 to -40dB to 0dB
    return (this.config.volume - 1) * 40;
  }

  /**
   * Get mood-specific musical signatures
   */
  private getMoodSignatures(): Record<MoodCategory, { notes: string[], octave: number }> {
    return {
      energetic: { notes: ['E', 'G#', 'B', 'E'], octave: 5 }, // E Major power chord
      calm: { notes: ['F', 'A', 'C', 'F'], octave: 4 }, // F Major (peaceful)
      happy: { notes: ['C', 'E', 'G', 'C'], octave: 5 }, // C Major (bright)
      melancholic: { notes: ['A', 'C', 'E', 'A'], octave: 3 }, // A Minor (sad)
      focused: { notes: ['D', 'F#', 'A', 'D'], octave: 4 }, // D Major (clear)
      party: { notes: ['G', 'B', 'D', 'G'], octave: 5 }, // G Major (celebratory)
      romantic: { notes: ['Ab', 'C', 'Eb', 'Ab'], octave: 4 }, // Ab Major (warm)
      introspective: { notes: ['E', 'G', 'B', 'D'], octave: 3 }, // Em7 (contemplative)
    };
  }

  /**
   * Load configuration from localStorage
   */
  private loadConfig(): AudioConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load audio config:', error);
    }
    
    return {
      volume: 0.5,
      enabled: false, // Disabled by default
      muteOnError: true,
    };
  }

  /**
   * Save configuration to localStorage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save audio config:', error);
    }
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.synth.dispose();
    this.noiseSynth.dispose();
    this.membranesynth.dispose();
    this.initialized = false;
  }
}

// Singleton instance
let soundEffectsInstance: SoundEffects | null = null;

/**
 * Get or create the global SoundEffects instance
 */
export const getSoundEffects = (): SoundEffects => {
  if (!soundEffectsInstance) {
    soundEffectsInstance = new SoundEffects();
  }
  return soundEffectsInstance;
};

/**
 * Initialize audio system (call after user interaction)
 */
export const initAudio = async (): Promise<void> => {
  const effects = getSoundEffects();
  await effects.init();
};

export default SoundEffects;
