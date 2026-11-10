import { MATERIALS } from './observations';

/**
 * Results exactly as reported in the supplied document. These are the
 * authoritative academic results and are never overwritten by any curve fit
 * or simulator-derived analysis.
 */
export interface ReportedResult {
  readonly materialKey: 'topaz' | 'crown' | 'flint';
  readonly label: string;
  readonly angleDeg: number;
  readonly display: string;
}

export const REPORTED_RESULTS: readonly ReportedResult[] = MATERIALS.map(
  (material) => ({
    materialKey: material.key,
    label: material.name,
    angleDeg: material.sourceReportedBrewsterAngleDeg,
    display: `${material.sourceReportedBrewsterAngleDeg}°`,
  }),
);

export const SOURCE_CONCLUSION =
  "The experiment verifies Brewster's law by determining the incidence angle associated with maximum polarisation of the reflected light, identified in the supplied observations through the minimum-current region. The reported Brewster angles are 58.1° for Topaz Glass, 56.7° for Crown Glass, and 57.51° for Flint Glass.";

export const SOURCE_CITATION =
  "Verifying Brewster's Law and finding the Brewster's angle — Physics PBL, B.Tech Odd-I Semester, Jaypee Institute of Information Technology, Noida (Devansh Tripathi, 9923103148).";

export const AIM =
  "To verify Brewster's law and to find the Brewster's angle.";
