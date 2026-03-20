/**
 * Particle System
 * Generates and animates floating particles for visual effects
 */

import { PARTICLES, PERFORMANCE } from './config';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private density: number;
  private colors: string[];

  constructor(
    canvas: HTMLCanvasElement,
    density: number = PARTICLES.DENSITY.MEDIUM,
    colors: string[] = [...PARTICLES.COLORS]
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.density = density;
    this.colors = colors;
    
    this.resizeCanvas();
    this.initParticles();
    
    window.addEventListener('resize', this.resizeCanvas.bind(this));
  }

  private resizeCanvas() {
    const dpr = PERFORMANCE.CANVAS_RESOLUTION_SCALE;
    const rect = this.canvas.getBoundingClientRect();
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
  }

  private initParticles() {
    this.particles = [];
    const count = Math.min(this.density, PERFORMANCE.MAX_PARTICLES);
    
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle());
    }
  }

  private createParticle(x?: number, y?: number): Particle {
    const size = PARTICLES.SIZE.MIN + Math.random() * (PARTICLES.SIZE.MAX - PARTICLES.SIZE.MIN);
    // Smoother speed progression
    const speed = PARTICLES.SPEED.MIN + Math.random() * (PARTICLES.SPEED.MAX - PARTICLES.SPEED.MIN);
    const angle = Math.random() * Math.PI * 2;
    
    return {
      x: x ?? Math.random() * this.canvas.width,
      y: y ?? Math.random() * this.canvas.height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.1, // Gentler upward drift for smoother feel
      size,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      opacity: 0.4 + Math.random() * 0.4, // More consistent opacity
      life: 1.0,
      maxLife: 1.0,
    };
  }

  private updateParticle(particle: Particle, deltaTime: number) {
    // Clamp delta time to prevent large jumps
    const safeDeltaTime = Math.min(deltaTime, 0.05); // Max 50ms per frame
    
    // Update position with smooth motion
    particle.x += particle.vx * safeDeltaTime * 60;
    particle.y += particle.vy * safeDeltaTime * 60;
    
    // Smoother fade out using easing curve (cubic)
    particle.life -= safeDeltaTime * 0.25; // Slower fade for smoother effect
    const lifeFade = particle.life > 0 ? Math.pow(particle.life, 1.5) : 0; // Cubic fade curve
    particle.opacity = Math.max(0, lifeFade * 0.9);
    
    // Wrap around screen edges with smooth transitions
    const padding = particle.size;
    if (particle.x < -padding) particle.x = this.canvas.width + padding;
    if (particle.x > this.canvas.width + padding) particle.x = -padding;
    if (particle.y < -padding) particle.y = this.canvas.height + padding;
    if (particle.y > this.canvas.height + padding) particle.y = -padding;
    
    // Reset particle if it dies (recycle it)
    if (particle.life <= 0) {
      const newParticle = this.createParticle();
      Object.assign(particle, newParticle);
    }
  }

  private drawParticle(particle: Particle) {
    // Create smooth glow effect
    const gradient = this.ctx.createRadialGradient(
      particle.x, particle.y, 0,
      particle.x, particle.y, particle.size * 2.5
    );
    gradient.addColorStop(0, particle.color);
    gradient.addColorStop(0.5, particle.color + '80'); // Semi-transparent middle
    gradient.addColorStop(1, particle.color + '00'); // Fully transparent edge
    
    this.ctx.save();
    this.ctx.globalAlpha = particle.opacity;
    this.ctx.fillStyle = gradient;
    
    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, particle.size * 2.5, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Bright core
    this.ctx.globalAlpha = particle.opacity * 1.3;
    this.ctx.fillStyle = particle.color;
    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
  }

  private animate(currentTime: number = 0) {
    // Calculate delta time with safeguards
    let deltaTime = 0;
    if (this.lastTime > 0) {
      deltaTime = (currentTime - this.lastTime) / 1000;
      // Clamp delta time to prevent large jumps (e.g., from tab switching)
      deltaTime = Math.min(deltaTime, 0.016); // Assume 60fps max
    }
    this.lastTime = currentTime;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Update and draw particles
    this.particles.forEach(particle => {
      this.updateParticle(particle, deltaTime);
      this.drawParticle(particle);
    });
    
    // Continue animation loop
    this.animationId = requestAnimationFrame(this.animate.bind(this));
  }

  start() {
    if (!this.animationId) {
      this.lastTime = 0;
      this.animate();
    }
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  burst(x: number, y: number, count: number = 20) {
    for (let i = 0; i < count; i++) {
      const particle = this.createParticle(x, y);
      // Random burst direction
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.life = 0.5 + Math.random() * 0.5;
      this.particles.push(particle);
    }
    
    // Remove excess particles
    if (this.particles.length > PERFORMANCE.MAX_PARTICLES) {
      this.particles = this.particles.slice(-PERFORMANCE.MAX_PARTICLES);
    }
  }

  setDensity(density: number) {
    const newDensity = Math.min(density, PERFORMANCE.MAX_PARTICLES);
    const currentCount = this.particles.length;
    const targetCount = newDensity;
    
    // If we need more particles, add them gradually
    if (targetCount > currentCount) {
      const particlesToAdd = targetCount - currentCount;
      for (let i = 0; i < particlesToAdd; i++) {
        this.particles.push(this.createParticle());
      }
    }
    // If we have too many particles, remove excess
    else if (targetCount < currentCount) {
      this.particles = this.particles.slice(0, targetCount);
    }
    
    this.density = newDensity;
  }

  setColors(colors: string[]) {
    this.colors = colors;
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.resizeCanvas.bind(this));
    this.particles = [];
  }
}

// Particle Pool for Performance
export class ParticlePool {
  private pool: Particle[] = [];
  private readonly maxSize: number;

  constructor(maxSize: number = 200) {
    this.maxSize = maxSize;
  }

  acquire(x: number, y: number, vx: number, vy: number, size: number, color: string): Particle {
    let particle = this.pool.pop();
    
    if (!particle) {
      particle = {
        x, y, vx, vy, size, color,
        opacity: 1,
        life: 1,
        maxLife: 1,
      };
    } else {
      particle.x = x;
      particle.y = y;
      particle.vx = vx;
      particle.vy = vy;
      particle.size = size;
      particle.color = color;
      particle.opacity = 1;
      particle.life = 1;
    }
    
    return particle;
  }

  release(particle: Particle) {
    if (this.pool.length < this.maxSize) {
      this.pool.push(particle);
    }
  }

  clear() {
    this.pool = [];
  }
}
