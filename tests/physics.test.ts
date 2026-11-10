import { describe, expect, it } from 'vitest';
import {
  analyserTransmittedIntensity,
  brewsterAngleDeg,
  computeOpticalResult,
  fresnelReflectance,
  isRightAngleAtBrewster,
  malusLaw,
  reflect,
  refract,
  solveBrewster,
  toDegrees,
  toRadians,
} from '../src/physics';
import { MATERIAL_MAP, MATERIALS } from '../src/data/observations';

const AIR = 1.0;

describe('angle conversion', () => {
  it('converts degrees to radians', () => {
    expect(toRadians(180)).toBeCloseTo(Math.PI, 12);
    expect(toRadians(45)).toBeCloseTo(Math.PI / 4, 12);
  });
  it('converts radians to degrees', () => {
    expect(toDegrees(Math.PI)).toBeCloseTo(180, 12);
    expect(toDegrees(Math.PI / 2)).toBeCloseTo(90, 12);
  });
});

describe("Brewster's angle", () => {
  it('reproduces the calibration angle for each supplied material in air', () => {
    expect(brewsterAngleDeg(AIR, MATERIAL_MAP.topaz.effectiveIndexAirCalibration)).toBeCloseTo(58.1, 1);
    expect(brewsterAngleDeg(AIR, MATERIAL_MAP.crown.effectiveIndexAirCalibration)).toBeCloseTo(56.7, 1);
    expect(brewsterAngleDeg(AIR, MATERIAL_MAP.flint.effectiveIndexAirCalibration)).toBeCloseTo(57.51, 1);
  });

  it('gives 45° when both media are identical', () => {
    expect(brewsterAngleDeg(1.5, 1.5)).toBeCloseTo(45, 10);
  });

  it('gives 0° for n2 << n1 limit and approaches 90° as n2 grows', () => {
    expect(brewsterAngleDeg(1, 1e-6)).toBeLessThan(1e-3);
    expect(brewsterAngleDeg(1, 1e6)).toBeGreaterThan(89.9999);
  });

  it('throws on invalid refractive indices', () => {
    expect(() => brewsterAngleDeg(0, 1.5)).toThrow(RangeError);
    expect(() => brewsterAngleDeg(1, -2)).toThrow(RangeError);
    expect(() => brewsterAngleDeg(Number.NaN, 1.5)).toThrow(RangeError);
    expect(() => brewsterAngleDeg(1, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe('Brewster geometry condition', () => {
  it('reflected + refracted = 90° at Brewster incidence', () => {
    for (const material of MATERIALS) {
      const solution = solveBrewster(AIR, material.effectiveIndexAirCalibration);
      expect(solution.sumDeg).toBeCloseTo(90, 6);
      expect(isRightAngleAtBrewster(AIR, material.effectiveIndexAirCalibration)).toBe(true);
    }
  });
});

describe("Snell's law", () => {
  it('is identity at normal incidence', () => {
    const state = refract(1.0, 1.5, 0);
    expect(state.kind).toBe('refracted');
    if (state.kind === 'refracted') expect(state.thetaTDeg).toBeCloseTo(0, 12);
  });

  it('bends toward the normal entering a denser medium', () => {
    const state = refract(1.0, 1.5, 30);
    if (state.kind !== 'refracted') throw new Error('expected refraction');
    expect(state.thetaTDeg).toBeCloseTo(toDegrees(Math.asin(Math.sin(toRadians(30)) / 1.5)), 10);
    expect(state.thetaTDeg).toBeLessThan(30);
  });

  it('bends away from the normal entering a rarer medium', () => {
    const state = refract(1.5, 1.0, 20);
    if (state.kind !== 'refracted') throw new Error('expected refraction');
    expect(state.thetaTDeg).toBeGreaterThan(20);
  });

  it('reports total internal reflection past the critical angle', () => {
    const critical = toDegrees(Math.asin(1 / 1.5));
    const inside = refract(1.5, 1.0, critical - 0.01);
    expect(inside.kind).toBe('refracted');
    const beyond = refract(1.5, 1.0, critical + 0.01);
    expect(beyond.kind).toBe('total-internal-reflection');
    if (beyond.kind === 'total-internal-reflection') {
      expect(beyond.thetaTDeg).toBeNull();
      expect(beyond.criticalAngleDeg).toBeCloseTo(41.8103, 3);
    }
  });

  it('never yields NaN for grazing incidence', () => {
    const state = refract(1.0, 1.5, 90);
    expect(state.kind).toBe('refracted');
    if (state.kind === 'refracted') expect(Number.isNaN(state.thetaTDeg)).toBe(false);
  });
});

describe('law of reflection', () => {
  it('theta_r equals theta_i', () => {
    for (const angle of [0, 12.5, 45, 58.1, 89.9]) {
      expect(reflect(angle)).toBe(angle);
    }
  });
});

describe('Fresnel reflectance', () => {
  it('stays within [0,1] for a sweep of angles and index pairs', () => {
    const pairs: Array<[number, number]> = [[1, 1.5], [1.5, 1], [1, 1], [1.33, 1.52], [1, 2.4]];
    for (const [n1, n2] of pairs) {
      for (let angle = 0; angle <= 90; angle += 1) {
        const state = refract(n1, n2, angle);
        const fresnel = fresnelReflectance(n1, n2, angle, state.kind === 'refracted' ? state.thetaTDeg : null);
        for (const value of [fresnel.Rs, fresnel.Rp, fresnel.RUnpolarised, fresnel.Ts, fresnel.Tp]) {
          expect(Number.isFinite(value)).toBe(true);
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('equals the normal-incidence value at 0°', () => {
    const n1 = 1;
    const n2 = 1.5;
    const expected = ((n1 - n2) / (n1 + n2)) ** 2;
    const fresnel = fresnelReflectance(n1, n2, 0, 0);
    expect(fresnel.Rs).toBeCloseTo(expected, 12);
    expect(fresnel.Rp).toBeCloseTo(expected, 12);
  });

  it('drives Rp to zero at Brewster incidence but keeps Rs non-zero', () => {
    for (const material of MATERIALS) {
      const n1 = AIR;
      const n2 = material.effectiveIndexAirCalibration;
      const thetaB = brewsterAngleDeg(n1, n2);
      const state = refract(n1, n2, thetaB);
      const fresnel = fresnelReflectance(n1, n2, thetaB, state.kind === 'refracted' ? state.thetaTDeg : null);
      expect(fresnel.Rp).toBeLessThan(1e-12);
      expect(fresnel.Rs).toBeGreaterThan(0.05);
      expect(fresnel.RUnpolarised).toBeCloseTo(fresnel.Rs / 2, 12);
    }
  });

  it('approaches unity at grazing incidence', () => {
    const fresnel = fresnelReflectance(1, 1.5, 90, refract(1, 1.5, 90).kind === 'refracted' ? 90 : null);
    expect(fresnel.Rs).toBeCloseTo(1, 6);
    expect(fresnel.Rp).toBeCloseTo(1, 6);
  });

  it('reflects everything under total internal reflection', () => {
    const fresnel = fresnelReflectance(1.5, 1, 60, null);
    expect(fresnel.Rs).toBe(1);
    expect(fresnel.Rp).toBe(1);
    expect(fresnel.Ts).toBe(0);
  });
});

describe('polarisation', () => {
  it('unpolarised reflectance is the mean of Rs and Rp', () => {
    const result = computeOpticalResult({
      n1: 1,
      n2: 1.5,
      incidenceDeg: 30,
      polarisation: { mode: 'unpolarised', angleDeg: 0 },
      laserOn: true,
    });
    expect(result.fresnel.RUnpolarised).toBeCloseTo((result.fresnel.Rs + result.fresnel.Rp) / 2, 12);
  });

  it('reflected beam is purely s-polarised at Brewster under unpolarised input', () => {
    const result = computeOpticalResult({
      n1: 1,
      n2: 1.6066,
      incidenceDeg: brewsterAngleDeg(1, 1.6066),
      polarisation: { mode: 'unpolarised', angleDeg: 0 },
      laserOn: true,
    });
    expect(result.polarisation.reflectedSFraction).toBeCloseTo(1, 9);
    expect(result.polarisation.degreeOfPolarisation).toBeCloseTo(1, 9);
    expect(result.atBrewster).toBe(true);
  });

  it("obeys Malus's law for an ideal analyser", () => {
    expect(malusLaw(1, 0)).toBeCloseTo(1, 12);
    expect(malusLaw(1, 45)).toBeCloseTo(0.5, 12);
    expect(malusLaw(1, 90)).toBeCloseTo(0, 12);
    expect(analyserTransmittedIntensity({ es: 1, ep: 0 }, 60)).toBeCloseTo(Math.cos(toRadians(60)) ** 2, 12);
  });

  it('extinguishes the reflected beam with a crossed analyser at Brewster incidence', () => {
    const n2 = 1.5;
    const result = computeOpticalResult({
      n1: 1,
      n2,
      incidenceDeg: brewsterAngleDeg(1, n2),
      polarisation: { mode: 'unpolarised', angleDeg: 0 },
      analyser: { enabled: true, angleDeg: 90 },
      laserOn: true,
    });
    // Only the p component can pass an analyser crossed to s; at Brewster it is zero.
    expect(result.polarisation.analyserTransmittedIntensity).toBeLessThan(1e-12);
    // Off Brewster the same analyser leaks the small p component — this is real physics.
    const offBrewster = computeOpticalResult({
      n1: 1,
      n2,
      incidenceDeg: 56.3,
      polarisation: { mode: 'unpolarised', angleDeg: 0 },
      analyser: { enabled: true, angleDeg: 90 },
      laserOn: true,
    });
    expect(offBrewster.polarisation.analyserTransmittedIntensity).toBeGreaterThan(0);
  });

  it('models s-polarised input with zero reflected p component', () => {
    const result = computeOpticalResult({
      n1: 1,
      n2: 1.5,
      incidenceDeg: 45,
      polarisation: { mode: 's', angleDeg: 0 },
      laserOn: true,
    });
    expect(result.polarisation.reflectedPFraction).toBe(0);
  });
});

describe('detector model', () => {
  it('reports no acquisition when the laser is off', () => {
    const result = computeOpticalResult({
      n1: 1,
      n2: 1.5,
      incidenceDeg: 45,
      polarisation: { mode: 'unpolarised', angleDeg: 0 },
      laserOn: false,
    });
    expect(result.detector.acquisitionActive).toBe(false);
    expect(result.detector.normalisedSignal).toBe(0);
    expect(result.detector.calibratedMicroAmps).toBeNull();
  });

  it('produces a calibrated figure only when a calibration is supplied', () => {
    const base = {
      n1: 1,
      n2: 1.5,
      incidenceDeg: 45,
      polarisation: { mode: 'unpolarised' as const, angleDeg: 0 },
      laserOn: true,
    };
    expect(computeOpticalResult(base).detector.calibratedMicroAmps).toBeNull();
    const calibrated = computeOpticalResult({
      ...base,
      detectorCalibration: { referenceSignal: 0.1, referenceReadingAmps: 10, darkOffsetAmps: 0 },
    });
    expect(calibrated.detector.calibratedMicroAmps).not.toBeNull();
    expect(Number.isFinite(calibrated.detector.calibratedMicroAmps as number)).toBe(true);
  });
});

describe('input guarding', () => {
  it('clamps out-of-range incidence angles instead of producing NaN', () => {
    const result = computeOpticalResult({
      n1: 1,
      n2: 1.5,
      incidenceDeg: 400,
      polarisation: { mode: 'unpolarised', angleDeg: 0 },
      laserOn: true,
    });
    expect(result.incidenceDeg).toBe(90);
    expect(Number.isFinite(result.fresnel.Rs)).toBe(true);
  });

  it('throws for invalid indices', () => {
    expect(() =>
      computeOpticalResult({
        n1: -1,
        n2: 1.5,
        incidenceDeg: 30,
        polarisation: { mode: 'unpolarised', angleDeg: 0 },
        laserOn: true,
      }),
    ).toThrow(RangeError);
  });
});
