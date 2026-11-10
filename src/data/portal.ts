import { computeOpticalResult } from '../physics';
import type { OpticalResult } from '../physics/types';

/**
 * The portal navigator's destination model.
 *
 * The reference experience travelled between planets. This laboratory travels
 * between its own sections, and every "fact" row is a real subtopic of that
 * section — not decorative filler.
 */

export type PortalSceneKind =
  | 'hero'
  | 'theory'
  | 'apparatus'
  | 'experiment'
  | 'observations'
  | 'analysis'
  | 'results'
  | 'viva';

export interface PortalSubtopic {
  readonly term: string;
  readonly detail: string;
}

export interface PortalDestination {
  readonly key: string;
  readonly route: string;
  /** Section name as published in the giant display title. */
  readonly name: string;
  readonly index: string;
  readonly accent: string;
  readonly accentSoft: string;
  readonly kicker: string;
  readonly scene: PortalSceneKind;
  /** Specimen index used to light this section's optical preview. */
  readonly n2: number;
  readonly incidenceDeg: number;
  readonly subtopics: readonly PortalSubtopic[];
  /** Primary call to action label. */
  readonly action: string;
}

export const PORTAL_DESTINATIONS: readonly PortalDestination[] = [
  {
    key: 'lab',
    route: '/',
    name: "BREWSTER'S LAW",
    index: '[00]',
    accent: '#7fe4fb',
    accentSoft: 'rgba(127,228,251,0.16)',
    kicker: 'VERIFYING BREWSTER\'S LAW',
    scene: 'hero',
    n2: 1.6066,
    incidenceDeg: 58.1,
    action: 'START THE EXPERIMENT',
    subtopics: [
      { term: 'AIM', detail: 'To verify Brewster\'s law and to find the Brewster\'s angle.' },
      { term: 'TOPAZ', detail: 'Reported 58.1° · effective n ≈ 1.6066' },
      { term: 'CROWN', detail: 'Reported 56.7° · effective n ≈ 1.5224' },
      { term: 'FLINT', detail: 'Reported 57.51° · effective n ≈ 1.5703' },
    ],
  },
  {
    key: 'theory',
    route: '/theory',
    name: 'THEORY',
    index: '[01]',
    accent: '#9fb4ff',
    accentSoft: 'rgba(159,180,255,0.16)',
    kicker: 'POLARISATION AT THE INTERFACE',
    scene: 'theory',
    n2: 1.5,
    incidenceDeg: 45,
    action: 'STUDY THE THEORY',
    subtopics: [
      { term: 'NATURAL LIGHT', detail: 'Rapidly varying, randomly polarised wavetrains' },
      { term: 'COMPONENTS', detail: 'Two incoherent orthogonal parts of equal intensity' },
      { term: 'PLANE OF INCIDENCE', detail: 'Contains the incident ray and the surface normal' },
      { term: "BREWSTER'S LAW", detail: 'tan θB = n₂ / n₁, measured from the normal' },
    ],
  },
  {
    key: 'apparatus',
    route: '/apparatus',
    name: 'APPARATUS',
    index: '[02]',
    accent: '#7fe4fb',
    accentSoft: 'rgba(127,228,251,0.16)',
    kicker: 'THE OPTICAL TRAIN',
    scene: 'apparatus',
    n2: 1.5224,
    incidenceDeg: 56.7,
    action: 'INSPECT THE APPARATUS',
    subtopics: [
      { term: 'DIODE LASER', detail: '3 mW · 650 nm · red, stabilised supply' },
      { term: 'POLARISER', detail: 'Rotatable stage, 0°–360° with graduations' },
      { term: 'GONIOMETER', detail: 'Graduated arm reading the reflected beam' },
      { term: 'OPTICAL RAIL', detail: '500 mm bench with 10 mm graduations' },
    ],
  },
  {
    key: 'experiment',
    route: '/experiment',
    name: 'EXPERIMENT',
    index: '[03]',
    accent: '#ff5f5f',
    accentSoft: 'rgba(255,95,95,0.16)',
    kicker: 'LIVE ANGULAR MEASUREMENT',
    scene: 'experiment',
    n2: 1.6066,
    incidenceDeg: 58.1,
    action: 'ENTER THE LIVE BENCH',
    subtopics: [
      { term: 'INCIDENCE', detail: 'Sweep 0°–90°, measured from the normal' },
      { term: 'MEDIUM', detail: 'Editable n₁, default air at 1.000' },
      { term: 'DETECTOR', detail: 'Normalised model signal — never fabricated amperes' },
      { term: 'ASSEMBLY', detail: 'Drag or tap seven mounts onto the rail' },
    ],
  },
  {
    key: 'observations',
    route: '/observations',
    name: 'OBSERVATIONS',
    index: '[04]',
    accent: '#ffd479',
    accentSoft: 'rgba(255,212,121,0.16)',
    kicker: 'SOURCE LAB RECORD',
    scene: 'observations',
    n2: 1.5703,
    incidenceDeg: 30,
    action: 'OPEN THE SOURCE RECORD',
    subtopics: [
      { term: 'ANGLES', detail: '19 incidence values, 0° to 90° in 5° steps' },
      { term: 'READINGS', detail: '57 recorded values, preserved verbatim' },
      { term: 'UNITS', detail: '“Current (I) in A”, exactly as printed' },
      { term: 'EXPORT', detail: 'CSV keeping original decimal precision' },
    ],
  },
  {
    key: 'analysis',
    route: '/analysis',
    name: 'ANALYSIS',
    index: '[05]',
    accent: '#b9a4ff',
    accentSoft: 'rgba(185,164,255,0.16)',
    kicker: 'CURRENT RESPONSE / INCIDENCE ANGLE',
    scene: 'analysis',
    n2: 1.5224,
    incidenceDeg: 65,
    action: 'PLOT THE RESPONSE',
    subtopics: [
      { term: 'RESPONSE', detail: 'Current against angle of incidence, all three specimens' },
      { term: 'MINIMA', detail: 'Topaz 60°, Crown 55°, Flint 60° sampled' },
      { term: 'REPORTED', detail: '58.1° / 56.7° / 57.51°, kept separate' },
      { term: 'FITS', detail: 'Simulator vertex fit, labelled as derived' },
    ],
  },
  {
    key: 'results',
    route: '/results',
    name: 'RESULTS',
    index: '[06]',
    accent: '#4fe0a6',
    accentSoft: 'rgba(79,224,166,0.16)',
    kicker: 'THE POLARISING CONDITION',
    scene: 'results',
    n2: 1.6066,
    incidenceDeg: 58.1,
    action: 'READ THE RESULT',
    subtopics: [
      { term: 'TOPAZ', detail: '58.1° reported Brewster angle' },
      { term: 'CROWN', detail: '56.7° reported Brewster angle' },
      { term: 'FLINT', detail: '57.51° reported Brewster angle' },
      { term: 'REPORT', detail: 'Printable, source-faithful academic conclusion' },
    ],
  },
  {
    key: 'viva',
    route: '/viva',
    name: 'VIVA',
    index: '[07]',
    accent: '#f7b73d',
    accentSoft: 'rgba(247,183,61,0.16)',
    kicker: 'TEST YOUR OPTICS',
    scene: 'viva',
    n2: 1.5703,
    incidenceDeg: 15,
    action: 'TAKE THE VIVA',
    subtopics: [
      { term: 'QUESTIONS', detail: '24 problems written for this experiment' },
      { term: 'MODES', detail: 'Study with instant feedback, or blind test mode' },
      { term: 'SCORING', detail: 'Live progress, retry, and full answer review' },
      { term: 'TOPICS', detail: 'Polarisation, Fresnel, and data integrity' },
    ],
  },
] as const;

export function destinationAt(index: number): PortalDestination {
  const total = PORTAL_DESTINATIONS.length;
  // A non-finite index (stale storage, bad arithmetic) falls back to the first
  // destination instead of throwing or returning undefined.
  if (!Number.isFinite(index)) return PORTAL_DESTINATIONS[0];
  const normalised = ((Math.trunc(index) % total) + total) % total;
  return PORTAL_DESTINATIONS[normalised];
}

export function nextIndex(index: number): number {
  return (index + 1) % PORTAL_DESTINATIONS.length;
}

/** Precomputed optical geometry for a destination's preview — computed once. */
export interface PortalSceneData {
  readonly kind: PortalSceneKind;
  readonly accent: string;
  readonly incidenceDeg: number;
  readonly refractionDeg: number | null;
  readonly brewsterDeg: number;
  readonly reflectedFraction: number;
  readonly n1: number;
  readonly n2: number;
}

export function buildSceneData(destination: PortalDestination): PortalSceneData {
  const result: OpticalResult = computeOpticalResult({
    n1: 1,
    n2: destination.n2,
    incidenceDeg: destination.incidenceDeg,
    polarisation: { mode: 'unpolarised', angleDeg: 0 },
    laserOn: true,
  });
  return {
    kind: destination.scene,
    accent: destination.accent,
    incidenceDeg: result.incidenceDeg,
    refractionDeg: result.refractionDeg,
    brewsterDeg: result.brewster.brewsterAngleDeg,
    reflectedFraction: result.fresnel.RUnpolarised,
    n1: result.n1,
    n2: result.n2,
  };
}
