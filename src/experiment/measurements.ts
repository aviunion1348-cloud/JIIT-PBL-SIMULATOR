import type { MaterialKey } from '../physics/types';

export interface MeasurementRecord {
  readonly id: string;
  readonly timestamp: number;
  readonly materialKey: MaterialKey;
  readonly incidenceDeg: number;
  readonly brewsterDeg: number;
  /** Normalised theoretical detector signal 0–1. Never a source reading. */
  readonly modelSignal: number;
  readonly Rs: number;
  readonly Rp: number;
  readonly note: string;
}

export const MAX_HISTORY = 40;

export function createMeasurement(
  materialKey: MaterialKey,
  incidenceDeg: number,
  brewsterDeg: number,
  modelSignal: number,
  Rs: number,
  Rp: number,
): MeasurementRecord {
  return {
    id: `${Date.now().toString(36)}-${Math.round(incidenceDeg * 100)}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    materialKey,
    incidenceDeg,
    brewsterDeg,
    modelSignal,
    Rs,
    Rp,
    note: 'Simulator-derived theoretical capture',
  };
}

export function pushMeasurement(
  history: readonly MeasurementRecord[],
  record: MeasurementRecord,
): MeasurementRecord[] {
  return [record, ...history].slice(0, MAX_HISTORY);
}

/** Linear interpolation of the Brewster angle from the sampled minimum region. */
export function interpolateMinimum(
  points: readonly { angleDeg: number; currentA: number }[],
): { angleDeg: number; currentA: number; method: string } | null {
  if (points.length < 3) return null;
  let minIndex = 0;
  for (let i = 1; i < points.length; i += 1) {
    if (points[i].currentA < points[minIndex].currentA) minIndex = i;
  }
  const left = points[minIndex - 1];
  const centre = points[minIndex];
  const right = points[minIndex + 1];
  if (!left || !right) return null;

  // Parabola through three equally spaced samples: x* = x0 + h/2 · (yL − yR)/(yL − 2y0 + yR)
  const denominator = left.currentA - 2 * centre.currentA + right.currentA;
  if (Math.abs(denominator) < 1e-15) return null;
  const h = centre.angleDeg - left.angleDeg;
  const offset = (h / 2) * ((left.currentA - right.currentA) / denominator);
  const angleDeg = centre.angleDeg + offset;
  const a = denominator / (2 * h * h);
  const b = (right.currentA - left.currentA) / (2 * h);
  const currentA = a * offset * offset + b * offset + centre.currentA;

  return {
    angleDeg,
    currentA,
    method: 'Simulator-derived parabolic vertex fit through the three samples around the minimum — not the source-reported angle.',
  };
}
