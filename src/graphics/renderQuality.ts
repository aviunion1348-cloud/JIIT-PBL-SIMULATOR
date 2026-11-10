export type QualityTier = 'high' | 'balanced' | 'low';

export interface QualitySettings {
  readonly tier: QualityTier;
  readonly pixelRatio: number;
  readonly antialias: boolean;
  readonly shadows: boolean;
  readonly bloom: boolean;
  readonly particles: number;
  readonly segments: number;
}

const PRESETS: Record<QualityTier, QualitySettings> = {
  high: { tier: 'high', pixelRatio: 2, antialias: true, shadows: true, bloom: true, particles: 140, segments: 48 },
  balanced: { tier: 'balanced', pixelRatio: 1.5, antialias: true, shadows: false, bloom: true, particles: 70, segments: 32 },
  low: { tier: 'low', pixelRatio: 1, antialias: false, shadows: false, bloom: false, particles: 0, segments: 20 },
};

export function presetFor(tier: QualityTier): QualitySettings {
  return PRESETS[tier];
}

export function detectInitialTier(): QualityTier {
  if (typeof window === 'undefined') return 'balanced';
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 8;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  if (coarse || cores <= 4 || memory <= 4) return 'low';
  if (cores >= 8) return 'high';
  return 'balanced';
}

/**
 * Watches frame-time trends (not single slow frames) and steps quality down
 * when the renderer cannot hold the budget. Physics precision is untouched.
 */
export class RenderQualityController {
  private samples: number[] = [];
  private tier: QualityTier;
  private cooldown = 0;

  constructor(initial: QualityTier = detectInitialTier()) {
    this.tier = initial;
  }

  get current(): QualityTier {
    return this.tier;
  }

  get settings(): QualitySettings {
    return PRESETS[this.tier];
  }

  /** Feed one frame delta in ms. Returns a new tier when quality changed. */
  sample(frameMs: number): QualityTier | null {
    if (!Number.isFinite(frameMs) || frameMs <= 0) return null;
    this.samples.push(frameMs);
    if (this.samples.length > 90) this.samples.shift();

    if (this.cooldown > 0) {
      this.cooldown -= 1;
      return null;
    }
    if (this.samples.length < 60) return null;

    const sorted = [...this.samples].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    if (median > 21 && this.tier !== 'low') {
      this.tier = this.tier === 'high' ? 'balanced' : 'low';
      this.samples = [];
      this.cooldown = 120;
      return this.tier;
    }
    if (median < 9 && this.tier === 'low' && sorted[sorted.length - 1] < 20) {
      this.tier = 'balanced';
      this.samples = [];
      this.cooldown = 240;
      return this.tier;
    }
    return null;
  }

  reset(): void {
    this.samples = [];
    this.cooldown = 0;
  }
}

export interface PerfSnapshot {
  readonly fps: number;
  readonly frameMs: number;
  readonly tier: QualityTier;
  readonly webgl: boolean;
}

export class FrameMeter {
  private last = 0;
  private frames = 0;
  private elapsed = 0;
  private snapshot: PerfSnapshot = { fps: 0, frameMs: 0, tier: 'balanced', webgl: true };

  tick(now: number, tier: QualityTier): PerfSnapshot | null {
    if (this.last === 0) {
      this.last = now;
      return null;
    }
    const delta = Math.min(now - this.last, 250);
    this.last = now;
    this.frames += 1;
    this.elapsed += delta;
    if (this.elapsed < 500) return null;
    const fps = (this.frames * 1000) / this.elapsed;
    this.snapshot = {
      fps: Math.round(fps),
      frameMs: Number((this.elapsed / this.frames).toFixed(2)),
      tier,
      webgl: this.snapshot.webgl,
    };
    this.frames = 0;
    this.elapsed = 0;
    return this.snapshot;
  }

  get current(): PerfSnapshot {
    return this.snapshot;
  }

  setWebgl(available: boolean): void {
    this.snapshot = { ...this.snapshot, webgl: available };
  }
}

export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') || canvas.getContext('webgl')),
    );
  } catch {
    return false;
  }
}
