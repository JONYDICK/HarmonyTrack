/**
 * Performance monitoring and optimization utilities for HarmonyTrack
 */

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage?: number;
  warnings: string[];
}

export interface DeviceCapability {
  tier: 'low' | 'medium' | 'high';
  particleDensity: number;
  enableBlur: boolean;
  enableShadows: boolean;
  maxAnimations: number;
}

class PerformanceMonitor {
  private frameCount: number = 0;
  private lastTime: number = performance.now();
  private fps: number = 60;
  private frameTime: number = 16.67;
  private fpsHistory: number[] = [];
  private maxHistoryLength: number = 60; // 1 second of history at 60fps
  private isMonitoring: boolean = false;
  private monitoringInterval: number | null = null;
  private performanceCallbacks: Array<(metrics: PerformanceMetrics) => void> = [];

  /**
   * Start monitoring performance
   */
  startMonitoring(callback?: (metrics: PerformanceMetrics) => void): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.lastTime = performance.now();

    if (callback) {
      this.performanceCallbacks.push(callback);
    }

    // Monitor FPS
    const measureFrame = () => {
      if (!this.isMonitoring) return;

      const currentTime = performance.now();
      const deltaTime = currentTime - this.lastTime;
      this.lastTime = currentTime;

      this.frameCount++;
      this.frameTime = deltaTime;

      // Calculate FPS
      if (this.frameCount % 10 === 0) {
        this.fps = 1000 / deltaTime;
        this.fpsHistory.push(this.fps);

        if (this.fpsHistory.length > this.maxHistoryLength) {
          this.fpsHistory.shift();
        }

        // Notify callbacks
        const metrics = this.getMetrics();
        this.performanceCallbacks.forEach(cb => cb(metrics));
      }

      requestAnimationFrame(measureFrame);
    };

    requestAnimationFrame(measureFrame);
  }

  /**
   * Stop monitoring performance
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const avgFps = this.getAverageFPS();
    const warnings: string[] = [];

    // Generate warnings
    if (avgFps < 30) {
      warnings.push('Low FPS detected: Consider reducing particle density');
    } else if (avgFps < 45) {
      warnings.push('Below target FPS: Performance could be improved');
    }

    if (this.frameTime > 33) {
      warnings.push('High frame time: Animations may appear choppy');
    }

    // Get memory usage if available
    let memoryUsage: number | undefined;
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      
      if (memoryUsage > 0.9) {
        warnings.push('High memory usage: Consider reducing visual effects');
      }
    }

    return {
      fps: avgFps,
      frameTime: this.frameTime,
      memoryUsage,
      warnings,
    };
  }

  /**
   * Get average FPS from history
   */
  private getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return this.fps;
    
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    return sum / this.fpsHistory.length;
  }

  /**
   * Check if performance is good
   */
  isPerformanceGood(): boolean {
    return this.getAverageFPS() >= 55;
  }

  /**
   * Check if performance is acceptable
   */
  isPerformanceAcceptable(): boolean {
    return this.getAverageFPS() >= 30;
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.frameCount = 0;
    this.fpsHistory = [];
  }
}

// Singleton instance
let monitorInstance: PerformanceMonitor | null = null;

export const getPerformanceMonitor = (): PerformanceMonitor => {
  if (!monitorInstance) {
    monitorInstance = new PerformanceMonitor();
  }
  return monitorInstance;
};

/**
 * Detect device capability and recommend settings
 */
export const detectDeviceCapability = (): DeviceCapability => {
  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 2;
  
  // Check device memory if available
  const memory = (navigator as any).deviceMemory || 4; // GB

  // Check if reduced motion is preferred
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Detect GPU tier (rough estimation based on canvas performance)
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  const hasWebGL = !!gl;

  // Score device
  let score = 0;
  score += cores >= 8 ? 3 : cores >= 4 ? 2 : 1;
  score += memory >= 8 ? 3 : memory >= 4 ? 2 : 1;
  score += hasWebGL ? 2 : 0;

  if (prefersReducedMotion) {
    score = Math.max(1, score - 2);
  }

  // Determine tier
  let tier: 'low' | 'medium' | 'high';
  let particleDensity: number;
  let enableBlur: boolean;
  let enableShadows: boolean;
  let maxAnimations: number;

  if (score >= 7) {
    tier = 'high';
    particleDensity = 60;
    enableBlur = true;
    enableShadows = true;
    maxAnimations = 20;
  } else if (score >= 4) {
    tier = 'medium';
    particleDensity = 30;
    enableBlur = true;
    enableShadows = false;
    maxAnimations = 10;
  } else {
    tier = 'low';
    particleDensity = 15;
    enableBlur = false;
    enableShadows = false;
    maxAnimations = 5;
  }

  console.log(`🖥️ Device capability detected: ${tier.toUpperCase()} (score: ${score})`);
  console.log(`CPU cores: ${cores}, Memory: ${memory}GB, WebGL: ${hasWebGL}`);

  return {
    tier,
    particleDensity,
    enableBlur,
    enableShadows,
    maxAnimations,
  };
};

/**
 * Throttle function execution
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  let lastRan: number = 0;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastRan >= wait) {
      func.apply(this, args);
      lastRan = now;
    } else {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        func.apply(this, args);
        lastRan = Date.now();
      }, wait - (now - lastRan));
    }
  };
};

/**
 * Debounce function execution
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
};

/**
 * Request idle callback with fallback
 */
export const requestIdleCallbackPolyfill = (
  callback: () => void,
  options?: { timeout?: number }
): number => {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }

  // Fallback to setTimeout
  return setTimeout(callback, 1) as any;
};

/**
 * Cancel idle callback with fallback
 */
export const cancelIdleCallbackPolyfill = (handle: number): void => {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(handle);
  } else {
    clearTimeout(handle);
  }
};

export default PerformanceMonitor;
