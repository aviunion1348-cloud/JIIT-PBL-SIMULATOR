import { isValidRefractiveIndex, toRadians } from './angles';
import type { FresnelResult } from './types';

/**
 * Fresnel power reflectance / transmittance for non-absorbing dielectrics.
 *
 *   r_s = (n1 cos θi − n2 cos θt) / (n1 cos θi + n2 cos θt)
 *   r_p = (n2 cos θi − n1 cos θt) / (n2 cos θi + n1 cos θt)
 *   R   = |r|²,  T = 1 − R  (lossless interface)
 *
 * Under total internal reflection the transmitted power is zero and R = 1.
 */
export function fresnelReflectance(
  n1: number,
  n2: number,
  incidenceDeg: number,
  refractionDeg: number | null,
): FresnelResult {
  if (!isValidRefractiveIndex(n1) || !isValidRefractiveIndex(n2)) {
    throw new RangeError('Refractive indices must be finite and positive.');
  }

  const thetaI = toRadians(Math.min(90, Math.max(0, incidenceDeg)));

  if (refractionDeg === null) {
    // Total internal reflection — all incident power is reflected.
    return { Rs: 1, Rp: 1, RUnpolarised: 1, Ts: 0, Tp: 0 };
  }

  const thetaT = toRadians(Math.min(90, Math.max(0, refractionDeg)));
  const cosI = Math.cos(thetaI);
  const cosT = Math.cos(thetaT);

  const denomS = n1 * cosI + n2 * cosT;
  const denomP = n2 * cosI + n1 * cosT;

  let Rs: number;
  let Rp: number;

  if (Math.abs(denomS) < 1e-12) {
    Rs = 1;
  } else {
    const rs = (n1 * cosI - n2 * cosT) / denomS;
    Rs = rs * rs;
  }

  if (Math.abs(denomP) < 1e-12) {
    Rp = 1;
  } else {
    const rp = (n2 * cosI - n1 * cosT) / denomP;
    Rp = rp * rp;
  }

  // Clamp only sub-1e-12 roundoff excursions; real errors stay visible.
  Rs = clampUnit(Rs);
  Rp = clampUnit(Rp);

  return {
    Rs,
    Rp,
    RUnpolarised: (Rs + Rp) / 2,
    Ts: clampUnit(1 - Rs),
    Tp: clampUnit(1 - Rp),
  };
}

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return value > -1e-12 ? 0 : 0;
  if (value > 1) return value < 1 + 1e-12 ? 1 : 1;
  return value;
}
