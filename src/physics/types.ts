/**
 * Brewster's Law Lab — physics type contract.
 *
 * Coordinate convention (shared by the 2D diagram and the 3D bench):
 *
 *   +x  →  runs along the specimen surface, pointing away from the laser.
 *   +y  →  the surface normal, pointing into the "air" half-space.
 *   +z  →  out of the plane of incidence (side view) / along the rail (top view).
 *
 * Every angle is measured FROM THE NORMAL, inside the plane of incidence,
 * and is expressed in DEGREES at the public API boundary. All internal
 * trigonometry is done in radians.
 */

export interface Medium {
  readonly name: string;
  readonly refractiveIndex: number;
}

export type MaterialKey = 'topaz' | 'crown' | 'flint';

/** Discriminated outcome of Snell's law at the interface. */
export type RefractionState =
  | {
      readonly kind: 'refracted';
      readonly thetaTDeg: number;
      /** Unit direction of the transmitted ray, in the plane of incidence. */
      readonly direction: Vec2;
    }
  | {
      readonly kind: 'total-internal-reflection';
      readonly thetaTDeg: null;
      readonly criticalAngleDeg: number;
      readonly direction: null;
    };

export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** Polarisation of the incident beam. */
export type InputPolarisationMode = 'unpolarised' | 's' | 'p' | 'linear';

export interface PolarisationInput {
  readonly mode: InputPolarisationMode;
  /** For `linear`: angle psi of the incident E-field relative to the s axis, 0–180°. */
  readonly angleDeg: number;
}

export interface FresnelResult {
  /** s-polarised power reflectance, 0–1. */
  readonly Rs: number;
  /** p-polarised power reflectance, 0–1. */
  readonly Rp: number;
  /** Unpolarised reflectance (Rs + Rp) / 2, 0–1. */
  readonly RUnpolarised: number;
  /** s-polarised power transmittance. */
  readonly Ts: number;
  /** p-polarised power transmittance. */
  readonly Tp: number;
}

export interface InterfaceGeometry {
  readonly normal: Vec3;
  readonly incidentDirection: Vec3;
  readonly reflectedDirection: Vec3;
  /** `null` under total internal reflection. */
  readonly refractedDirection: Vec3 | null;
  /** Angle between reflected and refracted rays, degrees; `null` under TIR. */
  readonly angleBetweenReflectedAndRefractedDeg: number | null;
}

export interface PolarisationResult {
  /** Fraction of the reflected beam's power carried by the s component, 0–1. */
  readonly reflectedSFraction: number;
  readonly reflectedPFraction: number;
  /** Degree of polarisation of the reflected beam, 0–1. */
  readonly degreeOfPolarisation: number;
  /** Unpolarised-equivalent reflected intensity in relative units (incident = 1). */
  readonly reflectedIntensity: number;
  /** Intensity through the analyser, relative to the same incident reference. */
  readonly analyserTransmittedIntensity: number;
  /** Whether the analyser was applied to the reflected beam at all. */
  readonly analyserApplied: boolean;
}

export interface DetectorModelResult {
  /**
   * Normalised theoretical detector signal, 0–1.
   * This is a model, not a calibrated measurement — see `calibrated` below.
   */
  readonly normalisedSignal: number;
  /** Normalised signal mapped through the user-supplied calibration, else null. */
  readonly calibratedMicroAmps: number | null;
  readonly calibratedMilliVolts: number | null;
  readonly acquisitionActive: boolean;
}

export interface BrewsterSolution {
  readonly brewsterAngleDeg: number;
  readonly n1: number;
  readonly n2: number;
  /** Reflection angle at Brewster incidence, degrees (equals the Brewster angle). */
  readonly thetaRDeg: number;
  /** Refraction angle at Brewster incidence, degrees. */
  readonly thetaTDeg: number;
  /** thetaR + thetaT — 90° for an ordinary dielectric interface. */
  readonly sumDeg: number;
}

/** The one authoritative result object consumed by every graphic and readout. */
export interface OpticalResult {
  readonly materialKey: MaterialKey | null;
  readonly n1: number;
  readonly n2: number;
  readonly incidentMedium: string;
  readonly specimenMedium: string;
  readonly incidenceDeg: number;
  readonly reflectionDeg: number;
  readonly refractionDeg: number | null;
  readonly refraction: RefractionState;
  readonly brewster: BrewsterSolution;
  /** Signed angular distance of the current incidence from Brewster, degrees. */
  readonly deltaFromBrewsterDeg: number;
  /** True inside the near-Brewster detection window. */
  readonly atBrewster: boolean;
  readonly fresnel: FresnelResult;
  readonly geometry: InterfaceGeometry;
  readonly polarisation: PolarisationResult;
  readonly detector: DetectorModelResult;
  readonly warnings: readonly string[];
}

export interface OpticalInput {
  readonly materialKey?: MaterialKey | null;
  readonly n1: number;
  readonly n2: number;
  readonly incidenceDeg: number;
  readonly polarisation: PolarisationInput;
  readonly analyser?: { readonly enabled: boolean; readonly angleDeg: number } | null;
  readonly laserOn?: boolean;
  readonly detectorCalibration?: DetectorCalibration | null;
}

export interface DetectorCalibration {
  /** Model signal (0–1) at which the reference reading is taken. */
  readonly referenceSignal: number;
  /** Reading, in the source units `Current (I) in A`, at the reference signal. */
  readonly referenceReadingAmps: number;
  /** Dark offset in the same units, subtracted before scaling. */
  readonly darkOffsetAmps: number;
}
