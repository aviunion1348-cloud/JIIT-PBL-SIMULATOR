/**
 * ============================================================================
 *  THE PORTAL MASK — a rounded-rectangle window onto a screen-locked scene
 * ============================================================================
 *  The scene is painted full-screen in "cover" mode and never moves. Only the
 *  aperture moves: it tilts toward the pointer and, during a travel, expands
 *  until it swallows the viewport. That parallax is what makes it read as a
 *  window rather than as a textured card.
 *
 *  Fake perspective, focal length 850:
 *      ax = rotX, ay = rotY
 *      xx = x·cos(ay),  yy = y·cos(ax),  z = x·sin(ay) − y·sin(ax)
 *      p  = 850 / (850 + z)
 *      screen = (cx + xx·p, cy + yy·p)
 *
 *  Corner radius and tilt both relax to zero as expansion → 1, so by the time
 *  the window covers the screen it is a flat, sharp, full-bleed frame.
 * ============================================================================
 */

export interface MaskState {
  /** 0 = window at its DOM rect, 1 = window fills the viewport. */
  expansion: number;
  /** Opening scale after a travel commit (0 → 1). */
  maskScale: number;
  /** Whole-canvas alpha, used to hide the seam during a commit. */
  opacity: number;
  /** Pointer tilt in degrees. */
  rotX: number;
  rotY: number;
  targetX: number;
  targetY: number;
}

export interface MaskRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

const FOCAL = 850;
const CORNER_RADIUS = 90;
const ARC_STEPS = 10;
/** Reference tilt envelope. The brief's ±18.7° / ±16.5° is halved here because
 *  a 37.4°/33° rotation reads as a spinning card at 320 px wide, not a window. */
export const TILT_X = 16.5;
export const TILT_Y = 18.7;

export function createMaskState(): MaskState {
  return { expansion: 0, maskScale: 1, opacity: 1, rotX: 0, rotY: 0, targetX: 0, targetY: 0 };
}

/**
 * Pointer → tilt targets, clamped to the published envelope.
 * The clamp lives here (not in the caller) so any consumer is safe.
 */
export function updateTiltTargets(state: MaskState, clientX: number, clientY: number, width: number, height: number): void {
  const normalisedX = clientX / Math.max(1, width) - 0.5;
  const normalisedY = clientY / Math.max(1, height) - 0.5;
  state.targetY = clamp(-TILT_Y, TILT_Y, normalisedX * TILT_Y * 2);
  state.targetX = clamp(-TILT_X, TILT_X, normalisedY * -TILT_X * 2);
}

function clamp(min: number, max: number, value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(max, Math.max(min, value));
}

export function resetTiltTargets(state: MaskState): void {
  state.targetX = 0;
  state.targetY = 0;
}

/** Frame-rate independent smoothing toward the targets. */
export function advanceTilt(state: MaskState, dtMs: number, reducedMotion: boolean): void {
  if (reducedMotion) {
    state.rotX = 0;
    state.rotY = 0;
    return;
  }
  const dt = Math.min(dtMs, 40);
  const k = Math.min(1, dt * 0.009);
  state.rotX += (state.targetX - state.rotX) * k;
  state.rotY += (state.targetY - state.rotY) * k;
}

/** Rounded-rect sampled in local coordinates, centred on the origin. */
export function roundedRectPoints(width: number, height: number, radius: number): Array<[number, number]> {
  const w = Math.max(0, width);
  const h = Math.max(0, height);
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  const points: Array<[number, number]> = [];

  const corners: Array<[number, number, number, number]> = [
    [w / 2 - r, -h / 2 + r, -Math.PI / 2, 0],
    [w / 2 - r, h / 2 - r, 0, Math.PI / 2],
    [-w / 2 + r, h / 2 - r, Math.PI / 2, Math.PI],
    [-w / 2 + r, -h / 2 + r, Math.PI, Math.PI * 1.5],
  ];

  for (const [cxCorner, cyCorner, start, end] of corners) {
    for (let i = 0; i <= ARC_STEPS; i += 1) {
      const angle = start + ((end - start) * i) / ARC_STEPS;
      points.push([cxCorner + Math.cos(angle) * r, cyCorner + Math.sin(angle) * r]);
    }
  }
  return points;
}

/** Project a local point through the fake perspective. */
export function project(
  x: number,
  y: number,
  rotX: number,
  rotY: number,
  centreX: number,
  centreY: number,
): [number, number] {
  const ax = (rotX * Math.PI) / 180;
  const ay = (rotY * Math.PI) / 180;
  const xx = x * Math.cos(ay);
  const yy = y * Math.cos(ax);
  const z = x * Math.sin(ay) - y * Math.sin(ax);
  const p = FOCAL / (FOCAL + z);
  return [centreX + xx * p, centreY + yy * p];
}

export interface MaskGeometry {
  readonly points: Array<[number, number]>;
  readonly width: number;
  readonly height: number;
  readonly rotX: number;
  readonly rotY: number;
}

/** Resolve the on-screen aperture for this frame. */
export function computeMaskGeometry(
  state: MaskState,
  rect: MaskRect,
  viewportWidth: number,
  viewportHeight: number,
): MaskGeometry {
  const e = clamp01(state.expansion);
  const rectCx = rect.x + rect.width / 2;
  const rectCy = rect.y + rect.height / 2;

  const centreX = rectCx + (viewportWidth / 2 - rectCx) * e;
  const centreY = rectCy + (viewportHeight / 2 - rectCy) * e;

  const baseW = rect.width + (viewportWidth - rect.width) * e;
  const baseH = rect.height + (viewportHeight - rect.height) * e;

  const scale = e > 0.999 ? 1 : state.maskScale;
  const width = baseW * scale;
  const height = baseH * scale;
  const radius = CORNER_RADIUS * (1 - e) * scale;
  // `+ 0` normalises a -0 result so callers never compare against negative zero.
  const rotX = state.rotX * (1 - e) + 0;
  const rotY = state.rotY * (1 - e) + 0;

  const local = roundedRectPoints(width, height, radius);
  const points = local.map(([x, y]) => project(x, y, rotX, rotY, centreX, centreY));
  return { points, width, height, rotX, rotY };
}

export function tracePath(ctx: CanvasRenderingContext2D, points: Array<[number, number]>): void {
  if (points.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
}

/** Bottom shade used inside the aperture during a transition. */
export function drawShade(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const gradient = ctx.createLinearGradient(0, height * 0.52, 0, height);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.88)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, height * 0.52, width, height * 0.48);
}

export function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

/** easeInOutCubic — the single easing curve used across the portal. */
export function easeInOutCubic(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/**
 * Drives a numeric property from its current value to `to` over `duration`.
 * Returns a promise that resolves when the animation settles, and can be
 * cancelled so obsolete transitions never fight a newer one.
 */
export function animateValue(
  durationMs: number,
  from: number,
  to: number,
  onUpdate: (value: number) => void,
  signal?: { cancelled: boolean },
): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const step = (now: number) => {
      if (signal?.cancelled) {
        resolve();
        return;
      }
      const progress = durationMs <= 0 ? 1 : Math.min(1, (now - start) / durationMs);
      onUpdate(from + (to - from) * easeInOutCubic(progress));
      if (progress < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}
