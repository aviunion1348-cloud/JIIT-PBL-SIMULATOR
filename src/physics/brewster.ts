import { isValidRefractiveIndex, toDegrees, toRadians } from './angles';
import { refract } from './snell';
import type { BrewsterSolution } from './types';

/**
 * Brewster's law:
 *
 *   tan(theta_B) = n2 / n1      →      theta_B = atan2(n2, n1)
 *
 * theta_B is measured from the surface normal.
 */
export function brewsterAngleDeg(n1: number, n2: number): number {
  if (!isValidRefractiveIndex(n1) || !isValidRefractiveIndex(n2)) {
    throw new RangeError('Refractive indices must be finite and positive.');
  }
  return toDegrees(Math.atan2(n2, n1));
}

/** Full Brewster solution including the 90° reflected/refracted relation. */
export function solveBrewster(n1: number, n2: number): BrewsterSolution {
  const thetaB = brewsterAngleDeg(n1, n2);
  const state = refract(n1, n2, thetaB);
  const thetaT = state.kind === 'refracted' ? state.thetaTDeg : 90;
  return {
    brewsterAngleDeg: thetaB,
    n1,
    n2,
    // At Brewster incidence the reflection angle equals the incidence angle.
    thetaRDeg: thetaB,
    thetaTDeg: thetaT,
    sumDeg: thetaB + thetaT,
  };
}

/**
 * The geometric tangency condition: at Brewster incidence the reflected and
 * refracted rays are perpendicular. Useful as a live self-check in the UI.
 */
export function isRightAngleAtBrewster(
  n1: number,
  n2: number,
  toleranceDeg = 1e-6,
): boolean {
  const solution = solveBrewster(n1, n2);
  return Math.abs(solution.sumDeg - 90) <= toleranceDeg;
}

/** Signed offset of an incidence angle from the Brewster angle, degrees. */
export function brewsterOffsetDeg(
  incidenceDeg: number,
  brewsterDeg: number,
): number {
  return incidenceDeg - brewsterDeg;
}

export function toTanForm(n1: number, n2: number): number {
  return Math.tan(toRadians(brewsterAngleDeg(n1, n2)));
}
