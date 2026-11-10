import { MATERIAL_MAP, MATERIALS } from './observations';
import type { MaterialKey } from '../physics/types';

export interface MediumPreset {
  readonly id: string;
  readonly name: string;
  readonly refractiveIndex: number;
  /** Honest provenance note shown in the UI. */
  readonly provenance: string;
}

/**
 * Surrounding-medium presets. Only well-known, textbook-grade indices are
 * offered; each carries its provenance so it is never mistaken for an
 * independent measurement of the supplied specimens.
 */
export const MEDIUM_PRESETS: readonly MediumPreset[] = [
  {
    id: 'air',
    name: 'Air',
    refractiveIndex: 1.0,
    provenance: 'Standard value used for the source calibration (n₁ = 1.000).',
  },
  {
    id: 'vacuum',
    name: 'Vacuum',
    refractiveIndex: 1.0,
    provenance: 'Exact by definition (n = 1).',
  },
  {
    id: 'water',
    name: 'Water',
    refractiveIndex: 1.333,
    provenance: 'Typical textbook value at 589 nm, 20 °C (not part of the source experiment).',
  },
  {
    id: 'ethanol',
    name: 'Ethanol',
    refractiveIndex: 1.361,
    provenance: 'Typical textbook value at 589 nm, 20 °C (not part of the source experiment).',
  },
  {
    id: 'glycerine',
    name: 'Glycerine',
    refractiveIndex: 1.473,
    provenance: 'Typical textbook value at 589 nm, 20 °C (not part of the source experiment).',
  },
  {
    id: 'immersion-oil',
    name: 'Immersion oil',
    refractiveIndex: 1.515,
    provenance: 'Typical microscopy value (not part of the source experiment).',
  },
];

export const DEFAULT_MEDIUM = MEDIUM_PRESETS[0];

export function materialPreset(key: MaterialKey) {
  return MATERIAL_MAP[key];
}

export function materialName(key: MaterialKey): string {
  return MATERIAL_MAP[key].name;
}

export const MATERIAL_KEYS = MATERIALS.map((material) => material.key);

/**
 * n₂ = n₁ · tan(θ_B) — the derived effective index for a given source-reported
 * angle. Labelled "inferred" everywhere it is shown.
 */
export function deriveIndexFromReportedAngle(
  reportedAngleDeg: number,
  n1 = 1.0,
): number {
  return n1 * Math.tan((reportedAngleDeg * Math.PI) / 180);
}

/** Round-trip: the Brewster angle a given index would produce. */
export function angleFromIndex(n1: number, n2: number): number {
  return (Math.atan2(n2, n1) * 180) / Math.PI;
}
