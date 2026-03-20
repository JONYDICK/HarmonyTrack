/**
 * Animation Configuration
 * Centralized timing, easing, and animation presets for HarmonyTrack
 */

// Timing Constants
export const DURATION = {
  INSTANT: 150,
  FAST: 200,
  NORMAL: 350,
  SLOW: 600,
  DRAMATIC: 1200,
  EPIC: 2000,
} as const;

// Easing Curves (animejs v4: prefix 'ease' dropped, property renamed to 'ease')
export const EASING = {
  // Standard easings
  SMOOTH: 'cubicBezier(0.4, 0, 0.2, 1)',
  LINEAR: 'linear',
  EASE_IN: 'inQuad',
  EASE_OUT: 'outQuad',
  EASE_IN_OUT: 'inOutQuad',
  
  // Dramatic easings
  BOUNCE: 'cubicBezier(0.68, -0.55, 0.265, 1.55)',
  ELASTIC: 'outElastic(1, 0.5)',
  BACK: 'outBack',
  
  // Custom easings
  SMOOTH_OUT: 'cubicBezier(0, 0, 0.2, 1)',
  SMOOTH_IN: 'cubicBezier(0.4, 0, 1, 1)',
  OVERSHOOT: 'cubicBezier(0.34, 1.56, 0.64, 1)',
} as const;

// Stagger Delays (for sequential animations)
export const STAGGER = {
  MINIMAL: 30,
  FAST: 50,
  NORMAL: 100,
  SLOW: 150,
  DRAMATIC: 250,
} as const;

// Animation Presets
export const PRESETS = {
  // Fade animations
  FADE_IN: {
    opacity: [0, 1],
    duration: DURATION.NORMAL,
    ease: EASING.SMOOTH,
  },
  
  FADE_OUT: {
    opacity: [1, 0],
    duration: DURATION.NORMAL,
    ease: EASING.SMOOTH,
  },
  
  // Scale animations
  SCALE_IN: {
    scale: [0, 1],
    opacity: [0, 1],
    duration: DURATION.DRAMATIC,
    ease: EASING.ELASTIC,
  },
  
  SCALE_OUT: {
    scale: [1, 0],
    opacity: [1, 0],
    duration: DURATION.NORMAL,
    ease: EASING.SMOOTH_IN,
  },
  
  SCALE_PULSE: {
    scale: [1, 1.05, 1],
    duration: DURATION.SLOW,
    ease: EASING.EASE_IN_OUT,
    loop: true,
  },
  
  // Slide animations
  SLIDE_UP: {
    translateY: [50, 0],
    opacity: [0, 1],
    duration: DURATION.SLOW,
    ease: EASING.SMOOTH_OUT,
  },
  
  SLIDE_DOWN: {
    translateY: [-50, 0],
    opacity: [0, 1],
    duration: DURATION.SLOW,
    ease: EASING.SMOOTH_OUT,
  },
  
  SLIDE_LEFT: {
    translateX: [-50, 0],
    opacity: [0, 1],
    duration: DURATION.SLOW,
    ease: EASING.SMOOTH_OUT,
  },
  
  SLIDE_RIGHT: {
    translateX: [50, 0],
    opacity: [0, 1],
    duration: DURATION.SLOW,
    ease: EASING.SMOOTH_OUT,
  },
  
  // Rotation animations
  ROTATE_IN: {
    rotate: [-180, 0],
    scale: [0, 1],
    opacity: [0, 1],
    duration: DURATION.DRAMATIC,
    ease: EASING.ELASTIC,
  },
  
  SPIN: {
    rotate: 360,
    duration: DURATION.DRAMATIC,
    ease: EASING.LINEAR,
    loop: true,
  },
  
  // Glow animations
  GLOW_PULSE: {
    filter: [
      'drop-shadow(0 0 0px rgba(255, 107, 107, 0))',
      'drop-shadow(0 0 12px rgba(255, 107, 107, 0.3))',
      'drop-shadow(0 0 0px rgba(255, 107, 107, 0))',
    ],
    duration: DURATION.EPIC,
    ease: EASING.EASE_IN_OUT,
    loop: true,
  },
  
  // Card flip animation
  FLIP_IN: {
    rotateY: [90, 0],
    opacity: [0, 1],
    duration: DURATION.SLOW,
    ease: EASING.SMOOTH_OUT,
  },
  
  FLIP_OUT: {
    rotateY: [0, -90],
    opacity: [1, 0],
    duration: DURATION.NORMAL,
    ease: EASING.SMOOTH_IN,
  },
  
  // Morph animations
  MORPH_CIRCLE_TO_SQUARE: {
    borderRadius: ['50%', '0%'],
    duration: DURATION.DRAMATIC,
    ease: EASING.ELASTIC,
  },
  
  // Entrance animations
  ENTRANCE_BOUNCE: {
    translateY: [-100, 0],
    scale: [0.8, 1],
    opacity: [0, 1],
    duration: DURATION.DRAMATIC,
    ease: EASING.BOUNCE,
  },
  
  ENTRANCE_ELASTIC: {
    scale: [0, 1],
    opacity: [0, 1],
    duration: DURATION.DRAMATIC,
    ease: EASING.ELASTIC,
  },
  
  // Particle animations
  PARTICLE_FLOAT: {
    translateY: [0, -20],
    opacity: [0.8, 0],
    scale: [1, 0.5],
    duration: DURATION.EPIC,
    ease: EASING.EASE_OUT,
  },
  
  PARTICLE_BURST: {
    scale: [0, 1.5],
    opacity: [1, 0],
    duration: DURATION.SLOW,
    ease: EASING.EASE_OUT,
  },
} as const;

// Color Animation Presets
export const COLOR_TRANSITIONS = {
  PRIMARY_TO_SECONDARY: {
    from: '#FF6B6B',
    to: '#4ECDC4',
  },
  SECONDARY_TO_ACCENT: {
    from: '#4ECDC4',
    to: '#9B8FFF',
  },
  GRADIENT_SHIFT: {
    from: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
    to: 'linear-gradient(135deg, #4ECDC4 0%, #9B8FFF 100%)',
  },
} as const;

// Particle System Config
export const PARTICLES = {
  DENSITY: {
    LOW: 20,
    MEDIUM: 50,
    HIGH: 100,
    EXTREME: 200,
  },
  SIZE: {
    MIN: 1.5,
    MAX: 6,
  },
  SPEED: {
    MIN: 0.08,
    MAX: 0.35, // Slightly reduced max speed for smoother motion
  },
  COLORS: ['#FF6B6B', '#4ECDC4', '#FFB84D', '#9B8FFF', '#6BCB77'],
} as const;

// Audio Visualization Config
export const AUDIO_VIS = {
  FREQUENCIES: {
    LOW: { min: 20, max: 250 },      // Bass
    MID: { min: 250, max: 2000 },    // Mids
    HIGH: { min: 2000, max: 20000 }, // Treble
  },
  WAVE_COLORS: {
    HAPPY: '#FFB84D',
    ENERGETIC: '#FF6B6B',
    CALM: '#4ECDC4',
    MELANCHOLIC: '#9B8FFF',
    FOCUSED: '#6BCB77',
    PARTY: '#FF8FA3',
    ROMANTIC: '#FFB3C6',
    INTROSPECTIVE: '#8B8FFF',
  },
  AMPLITUDE: {
    MIN: 0.1,
    MAX: 1.0,
  },
} as const;

// Performance Settings
export const PERFORMANCE = {
  TARGET_FPS: 60,
  THROTTLE_MS: 16, // ~60fps
  MAX_PARTICLES: 200,
  CANVAS_RESOLUTION_SCALE: window.devicePixelRatio || 1,
} as const;

// Responsive Breakpoints
export const BREAKPOINTS = {
  MOBILE: 640,
  TABLET: 768,
  DESKTOP: 1024,
  WIDE: 1280,
} as const;

// Animation Timing Functions Helper
export const getStaggerDelay = (index: number, speed: keyof typeof STAGGER = 'NORMAL') => {
  return index * STAGGER[speed];
};

export const getResponsiveDuration = (baseDuration: number) => {
  if (window.matchMedia(`(max-width: ${BREAKPOINTS.MOBILE}px)`).matches) {
    return baseDuration * 0.7; // Faster on mobile
  }
  return baseDuration;
};

// Reduced Motion Support
export const shouldReduceMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const getAnimationConfig = (preset: keyof typeof PRESETS) => {
  if (shouldReduceMotion()) {
    // Simplified animations for reduced motion preference
    return {
      ...PRESETS[preset],
      duration: DURATION.FAST,
      ease: EASING.LINEAR,
    };
  }
  return PRESETS[preset];
};
