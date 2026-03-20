/**
 * ParticleField Component
 * Canvas-based background particle animation with performance optimization
 */

import React, { useEffect, useRef } from 'react';
import { ParticleSystem } from '../animations/particles';
import { PARTICLES } from '../animations/config';
import { detectDeviceCapability, getPerformanceMonitor } from '../utils/performance';

interface ParticleFieldProps {
  density?: number;
  colors?: string[];
  className?: string;
  style?: React.CSSProperties;
  autoOptimize?: boolean; // Automatically adjust density based on performance
}

export const ParticleField: React.FC<ParticleFieldProps> = ({
  density,
  colors = [...PARTICLES.COLORS],
  className = '',
  style = {},
  autoOptimize = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const systemRef = useRef<ParticleSystem | null>(null);
  const currentDensityRef = useRef<number>(density || PARTICLES.DENSITY.MEDIUM);

  // Initialize particle system only once
  useEffect(() => {
    // Detect device capability on mount
    let initialDensity = density || PARTICLES.DENSITY.MEDIUM;
    if (!density && autoOptimize) {
      const capability = detectDeviceCapability();
      initialDensity = capability.particleDensity;
    }
    currentDensityRef.current = initialDensity;

    if (!canvasRef.current) return;

    // Initialize particle system
    systemRef.current = new ParticleSystem(canvasRef.current, initialDensity, colors);
    systemRef.current.start();

    // Cleanup on unmount
    return () => {
      systemRef.current?.destroy();
    };
  }, []); // Empty dependency array - only run once on mount

  // Separate effect for performance monitoring - doesn't recreate particle system
  useEffect(() => {
    if (!autoOptimize || !systemRef.current) return;

    const monitor = getPerformanceMonitor();
    
    // Check performance every 5 seconds
    const monitorHandle = window.setInterval(() => {
      const metrics = monitor.getMetrics();
      
      // If FPS is consistently low, reduce particles gradually
      if (metrics.fps < 30 && currentDensityRef.current > 10) {
        const newDensity = Math.max(10, Math.floor(currentDensityRef.current * 0.8));
        if (newDensity !== currentDensityRef.current) {
          console.log(`⚠️ Low FPS detected (${metrics.fps.toFixed(1)}), reducing particles: ${currentDensityRef.current} → ${newDensity}`);
          currentDensityRef.current = newDensity;
          systemRef.current?.setDensity(newDensity);
        }
      }
      // If FPS is consistently high and we reduced before, increase slightly
      else if (metrics.fps > 55 && currentDensityRef.current < (density || PARTICLES.DENSITY.HIGH)) {
        const newDensity = Math.min(density || PARTICLES.DENSITY.HIGH, Math.floor(currentDensityRef.current * 1.15));
        if (newDensity !== currentDensityRef.current) {
          console.log(`✅ Good FPS (${metrics.fps.toFixed(1)}), increasing particles: ${currentDensityRef.current} → ${newDensity}`);
          currentDensityRef.current = newDensity;
          systemRef.current?.setDensity(newDensity);
        }
      }
    }, 5000);

    // Cleanup monitoring
    return () => {
      clearInterval(monitorHandle);
    };
  }, [autoOptimize, density]);

  // Handle click for burst effect
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!systemRef.current) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    systemRef.current.burst(x, y, 30);
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        zIndex: 0,
        ...style,
      }}
    />
  );
};

export default ParticleField;
