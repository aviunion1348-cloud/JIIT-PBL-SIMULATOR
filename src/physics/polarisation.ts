import { toDegrees, toRadians } from './angles';
import { fresnelReflectance } from './fresnel';
import type {
  FresnelResult,
  PolarisationInput,
  PolarisationResult,
} from './types';

/** Fresnel amplitude coefficients (signed), derived from the power values. */
export interface FresnelAmplitudes {
  readonly rs: number;
  readonly rp: number;
  readonly ts: number;
  readonly tp: number;
}

/**
 * Recover the signed amplitude coefficients from the power reflectance.
 *
 * rs changes sign past Brewster (electric field flips), so the sign is taken
 * from the untruncated algebraic expression rather than from sqrt(R).
 */
export function fresnelAmplitudes(
  n1: number,
  n2: number,
  incidenceDeg: number,
  refractionDeg: number | null,
): FresnelAmplitudes {
  if (refractionDeg === null) {
    // TIR: unit reflected amplitude, no transmitted wave.
    return { rs: 1, rp: 1, ts: 0, tp: 0 };
  }
  const thetaI = toRadians(incidenceDeg);
  const thetaT = toRadians(refractionDeg);
  const cosI = Math.cos(thetaI);
  const cosT = Math.cos(thetaT);

  const rs = (n1 * cosI - n2 * cosT) / (n1 * cosI + n2 * cosT);
  const rp = (n2 * cosI - n1 * cosT) / (n2 * cosI + n1 * cosT);

  // Amplitude transmittance (tangential/field form) for reference readouts.
  const ts = (2 * n1 * cosI) / (n1 * cosI + n2 * cosT);
  const tp = (2 * n1 * cosI) / (n2 * cosI + n1 * cosT);

  return { rs, rp, ts, tp };
}

/** Jones vector [E_s, E_p] in the plane perpendicular to propagation. */
export interface JonesVector {
  readonly es: number;
  readonly ep: number;
}

export function jonesFromLinear(anglePsiDeg: number): JonesVector {
  const psi = toRadians(anglePsiDeg);
  return { es: Math.cos(psi), ep: Math.sin(psi) };
}

export function intensityOf(jones: JonesVector): number {
  return jones.es * jones.es + jones.ep * jones.ep;
}

/** Rotate a Jones vector into the analyser frame and project. */
export function analyserTransmittedIntensity(
  jones: JonesVector,
  analyserAngleDeg: number,
): number {
  const a = toRadians(analyserAngleDeg);
  const projected = jones.es * Math.cos(a) + jones.ep * Math.sin(a);
  return projected * projected;
}

/**
 * Polarisation of the reflected beam.
 *
 * Coherent (fully polarised) input is handled with Jones calculus.
 * Unpolarised input is handled incoherently: the two orthogonal components add
 * in intensity, exactly as the physical source does — it is NOT one coherent
 * Jones vector.
 */
export function reflectedPolarisation(
  fresnel: FresnelResult,
  amplitudes: FresnelAmplitudes,
  input: PolarisationInput,
  analyser: { enabled: boolean; angleDeg: number } | null,
): PolarisationResult {
  let reflectedS: number;
  let reflectedP: number;
  let jones: JonesVector | null = null;

  switch (input.mode) {
    case 's':
      reflectedS = fresnel.Rs;
      reflectedP = 0;
      jones = { es: amplitudes.rs, ep: 0 };
      break;
    case 'p':
      reflectedS = 0;
      reflectedP = fresnel.Rp;
      jones = { es: 0, ep: amplitudes.rp };
      break;
    case 'linear': {
      const incidentJones = jonesFromLinear(input.angleDeg);
      const outS = amplitudes.rs * incidentJones.es;
      const outP = amplitudes.rp * incidentJones.ep;
      jones = { es: outS, ep: outP };
      reflectedS = incidentJones.es ** 2 * fresnel.Rs;
      reflectedP = incidentJones.ep ** 2 * fresnel.Rp;
      break;
    }
    case 'unpolarised':
    default:
      // Two incoherent orthogonal components of equal power (½ each).
      reflectedS = fresnel.Rs / 2;
      reflectedP = fresnel.Rp / 2;
      break;
  }

  const total = reflectedS + reflectedP;
  const reflectedSFraction = total > 1e-15 ? reflectedS / total : 0.5;
  const reflectedPFraction = total > 1e-15 ? reflectedP / total : 0.5;
  const degreeOfPolarisation = total > 1e-15 ? Math.abs(reflectedS - reflectedP) / total : 0;

  let analyserTransmitted = total;
  let analyserApplied = false;

  if (analyser?.enabled) {
    analyserApplied = true;
    if (jones) {
      analyserTransmitted = analyserTransmittedIntensity(jones, analyser.angleDeg);
    } else {
      // Incoherent analyser: each component independently passes cos²(Δ).
      const a = toRadians(analyser.angleDeg);
      analyserTransmitted =
        reflectedS * Math.cos(a) ** 2 + reflectedP * Math.sin(a) ** 2;
    }
  }

  return {
    reflectedSFraction,
    reflectedPFraction,
    degreeOfPolarisation,
    reflectedIntensity: total,
    analyserTransmittedIntensity: analyserTransmitted,
    analyserApplied,
  };
}

/**
 * Malus's law for an ideal analyser placed in a plane-polarised beam.
 * Only valid for a single fully polarised component — never applied blindly to
 * an unpolarised beam or at the specimen interface itself.
 */
export function malusLaw(intensity0: number, angleDeg: number): number {
  const a = toRadians(angleDeg);
  return intensity0 * Math.cos(a) ** 2;
}

/** Position angle of the reflected E-field in the s–p plane, degrees. */
export function reflectedAzimuthDeg(amplitudes: FresnelAmplitudes): number {
  return toDegrees(Math.atan2(amplitudes.rp, amplitudes.rs));
}

export { fresnelReflectance };
