/** Angle conversion and guarding utilities — the single place degrees meet radians. */

export const DEG_PER_RAD = 180 / Math.PI;
export const RAD_PER_DEG = Math.PI / 180;

export function toRadians(degrees: number): number {
  return degrees * RAD_PER_DEG;
}

export function toDegrees(radians: number): number {
  return radians * DEG_PER_RAD;
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function clampDegrees(value: number): number {
  return clamp(value, 0, 90);
}

/** Wrap an angle into [0, 360). */
export function wrapDegrees360(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return ((value % 360) + 360) % 360;
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isValidRefractiveIndex(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0;
}

export function round(value: number, decimals = 4): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
