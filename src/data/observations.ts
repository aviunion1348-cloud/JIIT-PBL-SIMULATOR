import type { MaterialKey } from '../physics/types';

/**
 * IMMUTABLE SOURCE DATA.
 *
 * Transcribed exactly from the supplied project document
 * ("Verifying Brewster's Law and finding the Brewster's angle",
 *  Physics PBL, JIIT Noida). Never retype these values elsewhere.
 * Every table, graph, export and report reads from this module.
 */

export const INCIDENCE_ANGLES = [
  0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90,
] as const;

/** Source column: "Current (I) in A" — preserved verbatim, unit included. */
export const TOPAZ_CURRENT = [
  10.9945, 10.981, 10.9416, 10.8391, 10.6032, 10.1246, 9.2719, 7.9472, 6.1741,
  4.1734, 2.3588, 1.2122, 1.0793, 2.002, 3.6962, 5.6962, 7.5532, 8.9955, 9.9569,
] as const;

export const CROWN_CURRENT = [
  10.992, 10.9734, 10.9208, 10.7886, 10.4953, 9.1219, 8.939, 7.4343, 5.603,
  3.6073, 1.9358, 1.061, 1.245, 2.4324, 4.2666, 6.2646, 8.0199, 9.3218, 10.1543,
] as const;

export const FLINT_CURRENT = [
  10.9936, 10.9782, 10.9336, 10.8195, 10.561, 10.0444, 9.1383, 7.7552, 5.9387,
  3.9356, 2.1766, 1.1385, 1.1374, 2.1735, 3.9315, 5.9346, 7.7518, 9.1316, 10.0429,
] as const;

export const CURRENT_UNIT = 'Current (I) in A' as const;

export interface Observation {
  readonly serial: number;
  readonly angleDeg: number;
  /** Exactly as printed in the source column, "Current (I) in A". */
  readonly currentA: number;
}

export interface MaterialRecord {
  readonly key: MaterialKey;
  readonly name: string;
  readonly shortName: string;
  /** The angle REPORTED by the source document (not derived by us). */
  readonly sourceReportedBrewsterAngleDeg: number;
  /** n2 = n1·tan(theta_B) with n1 = 1.000 — inferred calibration, not measured. */
  readonly effectiveIndexAirCalibration: number;
  readonly observations: readonly Observation[];
  readonly source: 'supplied-project-document';
  readonly note: string;
}

function build(series: readonly number[]): readonly Observation[] {
  if (series.length !== INCIDENCE_ANGLES.length) {
    throw new Error('Source series length must match the 19 incidence angles.');
  }
  return INCIDENCE_ANGLES.map((angleDeg, index) => ({
    serial: index + 1,
    angleDeg,
    currentA: series[index],
  }));
}

export const MATERIALS: readonly MaterialRecord[] = [
  {
    key: 'topaz',
    name: 'Topaz Glass',
    shortName: 'TOPAZ',
    sourceReportedBrewsterAngleDeg: 58.1,
    effectiveIndexAirCalibration: 1.6066,
    observations: build(TOPAZ_CURRENT),
    source: 'supplied-project-document',
    note: 'Reported angle as stated in the source document.',
  },
  {
    key: 'crown',
    name: 'Crown Glass',
    shortName: 'CROWN',
    sourceReportedBrewsterAngleDeg: 56.7,
    effectiveIndexAirCalibration: 1.5224,
    observations: build(CROWN_CURRENT),
    source: 'supplied-project-document',
    note: 'Reported angle as stated in the source document.',
  },
  {
    key: 'flint',
    name: 'Flint Glass',
    shortName: 'FLINT',
    sourceReportedBrewsterAngleDeg: 57.51,
    effectiveIndexAirCalibration: 1.5703,
    observations: build(FLINT_CURRENT),
    source: 'supplied-project-document',
    note: 'Reported angle as stated in the source document.',
  },
] as const;

export const MATERIAL_MAP: Record<MaterialKey, MaterialRecord> = {
  topaz: MATERIALS[0],
  crown: MATERIALS[1],
  flint: MATERIALS[2],
};

export interface SampledMinimum {
  readonly angleDeg: number;
  readonly currentA: number;
  readonly serial: number;
}

/** The genuine minimum of the tabulated 5° samples — distinct from the report. */
export function sampledMinimum(material: MaterialRecord): SampledMinimum {
  let best = material.observations[0];
  for (const observation of material.observations) {
    if (observation.currentA < best.currentA) best = observation;
  }
  return { angleDeg: best.angleDeg, currentA: best.currentA, serial: best.serial };
}

export const TOTAL_SOURCE_READINGS = MATERIALS.reduce(
  (sum, material) => sum + material.observations.length,
  0,
);

/** Structural validation, run by tests and by the app's data guard. */
export interface ValidationIssue {
  readonly code: string;
  readonly message: string;
}

export function validateSourceData(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const expectedResults: Record<MaterialKey, number> = {
    topaz: 58.1,
    crown: 56.7,
    flint: 57.51,
  };

  if (MATERIALS.length !== 3) {
    issues.push({ code: 'material-count', message: 'Expected exactly 3 materials.' });
  }
  if (INCIDENCE_ANGLES.length !== 19) {
    issues.push({ code: 'angle-count', message: 'Expected exactly 19 incidence angles.' });
  }

  for (let i = 1; i < INCIDENCE_ANGLES.length; i += 1) {
    if (INCIDENCE_ANGLES[i] <= INCIDENCE_ANGLES[i - 1]) {
      issues.push({ code: 'angle-order', message: 'Incidence angles must increase monotonically.' });
      break;
    }
  }

  for (const material of MATERIALS) {
    if (material.observations.length !== 19) {
      issues.push({
        code: `${material.key}-length`,
        message: `${material.name} must have exactly 19 readings.`,
      });
    }
    if (material.sourceReportedBrewsterAngleDeg !== expectedResults[material.key]) {
      issues.push({
        code: `${material.key}-result`,
        message: `${material.name} reported angle must be ${expectedResults[material.key]}°.`,
      });
    }
    for (const observation of material.observations) {
      if (!Number.isFinite(observation.currentA)) {
        issues.push({
          code: `${material.key}-finite`,
          message: `Non-finite reading at ${observation.angleDeg}°.`,
        });
      }
    }
  }

  if (TOTAL_SOURCE_READINGS !== 57) {
    issues.push({ code: 'reading-count', message: 'Expected exactly 57 source readings.' });
  }

  return issues;
}
