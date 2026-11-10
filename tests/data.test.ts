import { describe, expect, it } from 'vitest';
import {
  CROWN_CURRENT,
  FLINT_CURRENT,
  INCIDENCE_ANGLES,
  MATERIALS,
  MATERIAL_MAP,
  TOPAZ_CURRENT,
  TOTAL_SOURCE_READINGS,
  sampledMinimum,
  validateSourceData,
} from '../src/data/observations';
import { buildSourceCsv, buildMaterialCsv } from '../src/export/csv';
import { REPORTED_RESULTS } from '../src/data/results';

describe('immutable source dataset', () => {
  it('has exactly 19 incidence angles', () => {
    expect(INCIDENCE_ANGLES).toHaveLength(19);
    expect([...INCIDENCE_ANGLES]).toEqual([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90]);
  });

  it('preserves the exact source current arrays', () => {
    expect([...TOPAZ_CURRENT]).toEqual([
      10.9945, 10.981, 10.9416, 10.8391, 10.6032, 10.1246, 9.2719, 7.9472, 6.1741,
      4.1734, 2.3588, 1.2122, 1.0793, 2.002, 3.6962, 5.6962, 7.5532, 8.9955, 9.9569,
    ]);
    expect([...CROWN_CURRENT]).toEqual([
      10.992, 10.9734, 10.9208, 10.7886, 10.4953, 9.1219, 8.939, 7.4343, 5.603, 3.6073,
      1.9358, 1.061, 1.245, 2.4324, 4.2666, 6.2646, 8.0199, 9.3218, 10.1543,
    ]);
    expect([...FLINT_CURRENT]).toEqual([
      10.9936, 10.9782, 10.9336, 10.8195, 10.561, 10.0444, 9.1383, 7.7552, 5.9387,
      3.9356, 2.1766, 1.1385, 1.1374, 2.1735, 3.9315, 5.9346, 7.7518, 9.1316, 10.0429,
    ]);
  });

  it('has 19 readings per material and 57 in total', () => {
    expect(MATERIALS).toHaveLength(3);
    for (const material of MATERIALS) expect(material.observations).toHaveLength(19);
    expect(TOTAL_SOURCE_READINGS).toBe(57);
  });

  it('keeps the official reported angles exact', () => {
    expect(MATERIAL_MAP.topaz.sourceReportedBrewsterAngleDeg).toBe(58.1);
    expect(MATERIAL_MAP.crown.sourceReportedBrewsterAngleDeg).toBe(56.7);
    expect(MATERIAL_MAP.flint.sourceReportedBrewsterAngleDeg).toBe(57.51);
    expect(REPORTED_RESULTS.map((result) => result.display)).toEqual(['58.1°', '56.7°', '57.51°']);
  });

  it('identifies the true sampled minima separately from the reported angles', () => {
    expect(sampledMinimum(MATERIAL_MAP.topaz)).toEqual({ angleDeg: 60, currentA: 1.0793, serial: 13 });
    expect(sampledMinimum(MATERIAL_MAP.crown)).toEqual({ angleDeg: 55, currentA: 1.061, serial: 12 });
    expect(sampledMinimum(MATERIAL_MAP.flint)).toEqual({ angleDeg: 60, currentA: 1.1374, serial: 13 });
  });

  it('all sampled minima differ from the reported angles', () => {
    for (const material of MATERIALS) {
      const minimum = sampledMinimum(material);
      expect(minimum.angleDeg).not.toBe(material.sourceReportedBrewsterAngleDeg);
    }
  });

  it('passes its own structural validation', () => {
    expect(validateSourceData()).toEqual([]);
  });

  it('builds a CSV that preserves every source value', () => {
    const csv = buildSourceCsv();
    const rows = csv.trim().split('\n');
    expect(rows).toHaveLength(20);
    expect(rows[0]).toContain('Angle of Incidence');
    expect(rows[1]).toContain('10.9945');
    expect(rows[19]).toContain('90');
    const filtered = buildMaterialCsv('crown');
    expect(filtered).toContain('1.061');
  });
});
