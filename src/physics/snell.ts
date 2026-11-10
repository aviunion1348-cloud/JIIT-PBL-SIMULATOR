import { isValidRefractiveIndex, toDegrees, toRadians } from './angles';
import type { RefractionState, Vec2 } from './types';

/**
 * Snell's law at a planar interface, with the surface normal along +y and the
 * plane of incidence spanned by (x, y).
 *
 *   n1 sin(theta_i) = n2 sin(theta_t)
 *
 * Returns an explicit discriminated state so no caller ever receives NaN.
 */
export function refract(
  n1: number,
  n2: number,
  incidenceDeg: number,
): RefractionState {
  if (!isValidRefractiveIndex(n1) || !isValidRefractiveIndex(n2)) {
    throw new RangeError('Refractive indices must be finite and positive.');
  }
  const thetaI = toRadians(Math.min(90, Math.max(0, incidenceDeg)));
  const sinThetaT = (n1 / n2) * Math.sin(thetaI);

  if (sinThetaT > 1) {
    // Total internal reflection: only possible when n1 > n2.
    const criticalAngleDeg =
      n1 > n2 ? toDegrees(Math.asin(Math.min(1, n2 / n1))) : 90;
    return {
      kind: 'total-internal-reflection',
      thetaTDeg: null,
      criticalAngleDeg,
      direction: null,
    };
  }

  const thetaT = Math.asin(Math.min(1, Math.max(-1, sinThetaT)));
  const thetaTDeg = toDegrees(thetaT);
  // Incident ray travels down-and-right (+x, −y) in our convention; the
  // transmitted ray keeps travelling down, bending toward/away from the normal,
  // and therefore keeps the same x sign.
  const direction: Vec2 = {
    x: Math.sin(thetaT),
    y: -Math.cos(thetaT),
  };

  return { kind: 'refracted', thetaTDeg, direction };
}

/** Law of reflection: theta_r = theta_i, both measured from the normal. */
export function reflect(incidenceDeg: number): number {
  return Math.min(90, Math.max(0, incidenceDeg));
}

/** The incident ray direction for an incidence angle, in (x, y). */
export function incidentDirection(incidenceDeg: number): Vec2 {
  const t = toRadians(Math.min(90, Math.max(0, incidenceDeg)));
  return { x: Math.sin(t), y: -Math.cos(t) };
}

/** The reflected ray direction for an incidence angle, in (x, y). */
export function reflectedDirection(incidenceDeg: number): Vec2 {
  const t = toRadians(Math.min(90, Math.max(0, incidenceDeg)));
  return { x: Math.sin(t), y: Math.cos(t) };
}

export function angleBetweenDeg(a: Vec2, b: Vec2): number {
  const dot = a.x * b.x + a.y * b.y;
  const magA = Math.hypot(a.x, a.y) || 1;
  const magB = Math.hypot(b.x, b.y) || 1;
  const cos = Math.min(1, Math.max(-1, dot / (magA * magB)));
  return toDegrees(Math.acos(cos));
}
