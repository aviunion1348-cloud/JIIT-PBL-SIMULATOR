import { clampDegrees, isValidRefractiveIndex } from './angles';
import { solveBrewster } from './brewster';
import { modelDetectorSignal } from './detector';
import { fresnelReflectance } from './fresnel';
import {
  analyserTransmittedIntensity,
  fresnelAmplitudes,
  reflectedPolarisation,
} from './polarisation';
import { angleBetweenDeg, incidentDirection, reflectedDirection } from './snell';
import { refract } from './snell';
import type {
  InterfaceGeometry,
  OpticalInput,
  OpticalResult,
  Vec3,
} from './types';

export const BREWSTER_WINDOW_DEG = 0.75;

/**
 * THE single entry point of the physics engine.
 *
 * Everything visual — 2D ray diagram, 3D bench, readouts, graphs, detector
 * model — consumes this result object. Nothing else recomputes angles.
 */
export function computeOpticalResult(input: OpticalInput): OpticalResult {
  const { n1, n2 } = input;
  if (!isValidRefractiveIndex(n1) || !isValidRefractiveIndex(n2)) {
    throw new RangeError('Refractive indices must be finite and positive.');
  }

  const incidenceDeg = clampDegrees(input.incidenceDeg);
  const warnings: string[] = [];

  const refraction = refract(n1, n2, incidenceDeg);
  const refractionDeg = refraction.kind === 'refracted' ? refraction.thetaTDeg : null;
  const reflectionDeg = incidenceDeg;

  const brewster = solveBrewster(n1, n2);
  const deltaFromBrewsterDeg = incidenceDeg - brewster.brewsterAngleDeg;

  const fresnel = fresnelReflectance(n1, n2, incidenceDeg, refractionDeg);
  const amplitudes = fresnelAmplitudes(n1, n2, incidenceDeg, refractionDeg);

  const polarisation = reflectedPolarisation(
    fresnel,
    amplitudes,
    input.polarisation,
    input.analyser ?? null,
  );

  const laserOn = input.laserOn ?? true;
  const detector = modelDetectorSignal(
    polarisation.analyserTransmittedIntensity,
    laserOn,
    input.detectorCalibration ?? null,
  );

  const inc2 = incidentDirection(incidenceDeg);
  const ref2 = reflectedDirection(incidenceDeg);

  const incidentDirection3: Vec3 = { x: inc2.x, y: inc2.y, z: 0 };
  const reflectedDirection3: Vec3 = { x: ref2.x, y: ref2.y, z: 0 };
  const refractedDirection3: Vec3 | null =
    refraction.kind === 'refracted'
      ? { x: refraction.direction.x, y: refraction.direction.y, z: 0 }
      : null;

  const angleBetween =
    refraction.kind === 'refracted'
      ? angleBetweenDeg(ref2, refraction.direction)
      : null;

  const geometry: InterfaceGeometry = {
    normal: { x: 0, y: 1, z: 0 },
    incidentDirection: incidentDirection3,
    reflectedDirection: reflectedDirection3,
    refractedDirection: refractedDirection3,
    angleBetweenReflectedAndRefractedDeg: angleBetween,
  };

  if (refraction.kind === 'total-internal-reflection') {
    warnings.push(
      `Total internal reflection: no transmitted ray beyond the critical angle of ${refraction.criticalAngleDeg.toFixed(2)}°.`,
    );
  }
  if (incidenceDeg === 0) {
    warnings.push('At normal incidence s and p are geometrically degenerate.');
  }

  return {
    materialKey: input.materialKey ?? null,
    n1,
    n2,
    incidentMedium: '',
    specimenMedium: '',
    incidenceDeg,
    reflectionDeg,
    refractionDeg,
    refraction,
    brewster,
    deltaFromBrewsterDeg,
    atBrewster: Math.abs(deltaFromBrewsterDeg) <= BREWSTER_WINDOW_DEG,
    fresnel,
    geometry,
    polarisation,
    detector,
    warnings,
  };
}

export * from './types';
export * from './angles';
export * from './brewster';
export * from './snell';
export * from './fresnel';
export * from './polarisation';
export * from './detector';
export { analyserTransmittedIntensity };
