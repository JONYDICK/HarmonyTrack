/**
 * useAnimeTimeline Hook
 * Custom React hook for anime.js v4 timeline animations
 */

import { useEffect, useRef, useCallback } from 'react';
import { animate, createTimeline, type Timeline, type JSAnimation, type AnimationParams, type TargetsParam } from 'animejs';
import { shouldReduceMotion } from '../animations/config';

interface UseAnimeTimelineOptions {
  autoplay?: boolean;
  loop?: boolean;
  onComplete?: () => void;
}

export const useAnimeTimeline = (options: UseAnimeTimelineOptions = {}) => {
  const timelineRef = useRef<Timeline | null>(null);
  const { autoplay = false, loop = false, onComplete } = options;

  useEffect(() => {
    if (shouldReduceMotion()) {
      return; // Skip animations if user prefers reduced motion
    }

    timelineRef.current = createTimeline({
      autoplay,
      loop,
      onComplete,
    });

    return () => {
      timelineRef.current?.pause();
      timelineRef.current = null;
    };
  }, [autoplay, loop, onComplete]);

  const play = useCallback(() => {
    timelineRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    timelineRef.current?.pause();
  }, []);

  const restart = useCallback(() => {
    timelineRef.current?.restart();
  }, []);

  const add = useCallback((targets: TargetsParam, params: AnimationParams, offset?: number | string) => {
    if (timelineRef.current) {
      timelineRef.current.add(targets, params, offset);
    }
  }, []);

  return {
    timeline: timelineRef.current,
    play,
    pause,
    restart,
    add,
  };
};

// Simpler hook for single element animations
export const useAnimeAnimation = (
  targetRef: React.RefObject<HTMLElement>,
  animationConfig: AnimationParams,
  trigger: boolean = true
) => {
  const animationRef = useRef<JSAnimation | null>(null);

  useEffect(() => {
    if (!targetRef.current || !trigger || shouldReduceMotion()) return;

    animationRef.current = animate(
      targetRef.current,
      animationConfig,
    );

    return () => {
      animationRef.current?.pause();
    };
  }, [targetRef, animationConfig, trigger]);

  return animationRef.current;
};

export default useAnimeTimeline;
