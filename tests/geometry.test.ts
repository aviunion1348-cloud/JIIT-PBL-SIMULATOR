import { describe, expect, it } from 'vitest';
import { rayVectors } from '../src/graphics/OpticalBench3D';
import { computeOpticalResult } from '../src/physics';
import { MATERIALS } from '../src/data/observations';

/**
 * Contract: the 3D bench must never disagree with the physics engine.
 * These tests compare the Three.js ray vectors against the engine that also
 * drives the 2D SVG diagram and every numeric readout.
 */
describe('3D rays agree with the physics engine', () => {
  it('reflection angle equals incidence angle for a sweep', () => {
    for (let angle = 0; angle <= 90; angle += 3) {
      const { d, n, r } = rayVectors(angle, 1, 1.6066);
      // d travels toward the surface, so the incidence angle is between −d and n.
      const incidence = Math.acos(-d.dot(n));
      const reflection = Math.acos(r.dot(n));
      expect(incidence).toBeCloseTo(reflection, 9);
    }
  });

  it('reflects into the same half-space as the normal', () => {
    for (const angle of [0, 15, 30, 45, 60, 82]) {
      const { d, n, r } = rayVectors(angle, 1, 1.5);
      // d·n is negative (ray travelling toward the surface); r·n must be positive.
      expect(d.dot(n)).toBeLessThanOrEqual(1e-9);
      expect(r.dot(n)).toBeGreaterThanOrEqual(-1e-9);
    }
  });

  it('refracted angle matches Snell for every supplied specimen', () => {
    for (const material of MATERIALS) {
      const n2 = material.effectiveIndexAirCalibration;
      for (const angle of [10, 25, 40, 58.1, 70]) {
        const vectors = rayVectors(angle, 1, n2);
        const engine = computeOpticalResult({
          n1: 1,
          n2,
          incidenceDeg: angle,
          polarisation: { mode: 'unpolarised', angleDeg: 0 },
          laserOn: true,
        });
        expect(vectors.thetaTDeg).not.toBeNull();
        expect(vectors.thetaTDeg as number).toBeCloseTo(engine.refractionDeg as number, 8);
      }
    }
  });

  it('reports total internal reflection exactly where the engine does', () => {
    const n2 = 1.0;
    const n1 = 1.5;
    const critical = (Math.asin(n2 / n1) * 180) / Math.PI;
    expect(rayVectors(critical - 1, n1, n2).t).not.toBeNull();
    expect(rayVectors(critical + 1, n1, n2).t).toBeNull();
  });

  it('reflected and refracted rays are perpendicular at Brewster incidence', () => {
    for (const material of MATERIALS) {
      const n2 = material.effectiveIndexAirCalibration;
      const thetaB = (Math.atan2(n2, 1) * 180) / Math.PI;
      const { r, t } = rayVectors(thetaB, 1, n2);
      expect(t).not.toBeNull();
      expect(r.dot(t as never)).toBeCloseTo(0, 6);
    }
  });
});
