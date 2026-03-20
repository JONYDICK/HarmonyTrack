/**
 * WaveformVisualizer Component
 * Audio waveform visualization based on mood metrics
 */

import React, { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  mood?: {
    happiness: number;
    energy: number;
    calmness: number;
    danceability: number;
  };
  width?: number;
  height?: number;
  color?: string;
  animate?: boolean;
  className?: string;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  mood = { happiness: 0.7, energy: 0.6, calmness: 0.5, danceability: 0.7 },
  width = 300,
  height = 100,
  color = '#FF6B35',
  animate = true,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const phaseRef = useRef(0);
  const moodRef = useRef(mood);
  const animateRef = useRef(animate);
  const colorRef = useRef(color);

  // Update refs when props change, but don't restart animation
  React.useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  React.useEffect(() => {
    animateRef.current = animate;
  }, [animate]);

  React.useEffect(() => {
    colorRef.current = color;
  }, [color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const drawWaveform = (phase: number) => {
      ctx.clearRect(0, 0, width, height);

      const centerY = height / 2;
      const amplitude = height * 0.3 * moodRef.current.energy;
      const frequency = 0.02 + moodRef.current.danceability * 0.03;
      const smoothness = moodRef.current.calmness;

      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, colorRef.current);
      gradient.addColorStop(0.5, `${colorRef.current}CC`);
      gradient.addColorStop(1, colorRef.current);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2 + moodRef.current.energy * 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round'; // Smoother line connections
      ctx.shadowBlur = 15 + moodRef.current.happiness * 20;
      ctx.shadowColor = colorRef.current;

      // Draw waveform with smooth interpolation
      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        const y = centerY + 
          Math.sin(x * frequency + phase) * amplitude * moodRef.current.happiness +
          Math.sin(x * frequency * 2 + phase * 1.5) * amplitude * 0.3 * (1 - smoothness);
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Draw secondary wave (lower opacity, creates depth)
      ctx.globalAlpha = 0.35;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        const y = centerY + 
          Math.sin(x * frequency + phase + Math.PI) * amplitude * 0.6;
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    };

    const animateWaveform = () => {
      if (!animateRef.current) {
        drawWaveform(0);
        return;
      }

      phaseRef.current += 0.05 * (0.5 + moodRef.current.energy * 0.5);
      drawWaveform(phaseRef.current);
      animationRef.current = requestAnimationFrame(animateWaveform);
    };

    animateWaveform();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: 'block',
      }}
    />
  );
};

export default WaveformVisualizer;
