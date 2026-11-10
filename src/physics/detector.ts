import { clamp } from './angles';
import type { DetectorCalibration, DetectorModelResult } from './types';

/**
 * Detector model.
 *
 * The supplied document gives no responsivity, gain, collection efficiency,
 * offset, or calibration curve. We therefore expose a NORMALISED theoretical
 * signal (0–1) and never pretend it is a calibrated ammeter reading.
 *
 * Calibrated figures are only produced when the user explicitly supplies a
 * calibration (reference signal ↔ reference reading ↔ dark offset), and those
 * assumptions are always displayed next to the number.
 */
export function modelDetectorSignal(
  reflectedFraction: number,
  laserOn: boolean,
  calibration: DetectorCalibration | null,
): DetectorModelResult {
  const acquisitionActive = laserOn;
  if (!laserOn) {
    return {
      normalisedSignal: 0,
      calibratedMicroAmps: null,
      calibratedMilliVolts: null,
      acquisitionActive: false,
    };
  }

  const normalisedSignal = clamp(reflectedFraction, 0, 1);

  if (!calibration || calibration.referenceSignal <= 0) {
    return {
      normalisedSignal,
      calibratedMicroAmps: null,
      calibratedMilliVolts: null,
      acquisitionActive,
    };
  }

  const ratio = normalisedSignal / calibration.referenceSignal;
  const amps =
    (calibration.referenceReadingAmps - calibration.darkOffsetAmps) * ratio +
    calibration.darkOffsetAmps;

  return {
    normalisedSignal,
    // Source units are labelled "Current (I) in A"; here we expose the
    // explicitly-calibrated equivalent in µA and mV of a 1 kΩ load.
    calibratedMicroAmps: amps * 1e6,
    calibratedMilliVolts: amps * 1e3,
    acquisitionActive,
  };
}

export function signalToPercent(signal: number): number {
  return clamp(signal, 0, 1) * 100;
}
