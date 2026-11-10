import type { ExperimentState } from './types';
import { MATERIAL_MAP } from '../data/observations';
import { MATERIAL_KEYS } from '../data/materials';
import { APPARATUS } from './apparatus';

export const SESSION_KEY = 'brewsters-law-lab.session.v1';
const SCHEMA_VERSION = 1;

interface StoredSession {
  readonly version: number;
  readonly savedAt: number;
  readonly state: Partial<ExperimentState>;
}

/**
 * Only user preferences and simulator state are stored. The immutable source
 * dataset is never written to storage and can never be overwritten by it.
 */
const PERSISTED_KEYS: (keyof ExperimentState)[] = [
  'selectedMaterial',
  'medium',
  'specimenRefractiveIndex',
  'laser',
  'polarisation',
  'geometry',
  'status',
  'introSeen',
];

export function saveSession(state: ExperimentState): void {
  try {
    const payload: StoredSession = {
      version: SCHEMA_VERSION,
      savedAt: Date.now(),
      state: {
        selectedMaterial: state.selectedMaterial,
        medium: state.medium,
        specimenRefractiveIndex: state.specimenRefractiveIndex,
        laser: state.laser,
        polarisation: state.polarisation,
        geometry: state.geometry,
        status: state.status === 'running' ? 'paused' : state.status,
        introSeen: state.introSeen,
      },
    };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch {
    // Storage unavailable or full — the simulator works without persistence.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function finiteOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** Validate an untrusted snapshot; anything doubtful falls back to defaults. */
export function parseSession(raw: unknown): Partial<ExperimentState> | null {
  if (!isRecord(raw)) return null;
  if (raw.version !== SCHEMA_VERSION) return null;
  const state = raw.state;
  if (!isRecord(state)) return null;

  const partial: Record<string, unknown> = {};

  if (typeof state.selectedMaterial === 'string' && MATERIAL_KEYS.includes(state.selectedMaterial as never)) {
    partial.selectedMaterial = state.selectedMaterial;
  }
  if (isRecord(state.medium)) {
    const index = finiteOr(state.medium.refractiveIndex, 1);
    if (index > 0) {
      partial.medium = {
        name: typeof state.medium.name === 'string' ? state.medium.name : 'Air',
        refractiveIndex: index,
      };
    }
  }
  if (typeof state.specimenRefractiveIndex === 'number' && state.specimenRefractiveIndex > 0) {
    partial.specimenRefractiveIndex = state.specimenRefractiveIndex;
  }
  if (isRecord(state.laser)) {
    partial.laser = {
      enabled: Boolean(state.laser.enabled),
      wavelengthNm: finiteOr(state.laser.wavelengthNm, 650),
      powerMw: finiteOr(state.laser.powerMw, 3),
    };
  }
  if (isRecord(state.polarisation)) {
    const mode = state.polarisation.inputMode;
    const validModes = ['unpolarised', 's', 'p', 'linear'];
    partial.polarisation = {
      inputMode: typeof mode === 'string' && validModes.includes(mode) ? mode : 'unpolarised',
      inputAngleDeg: Math.min(180, Math.max(0, finiteOr(state.polarisation.inputAngleDeg, 0))),
      analyserEnabled: Boolean(state.polarisation.analyserEnabled),
      analyserAngleDeg: Math.min(180, Math.max(0, finiteOr(state.polarisation.analyserAngleDeg, 0))),
    };
  }
  if (isRecord(state.geometry)) {
    partial.geometry = {
      incidenceAngleDeg: Math.min(90, Math.max(0, finiteOr(state.geometry.incidenceAngleDeg, 45))),
      view: state.geometry.view === 'top' ? 'top' : 'side',
    };
  }
  if (state.status === 'idle' || state.status === 'paused') partial.status = state.status;
  if (typeof state.introSeen === 'boolean') partial.introSeen = state.introSeen;

  return partial as Partial<ExperimentState>;
}

export function loadSession(base: ExperimentState): ExperimentState | null {
  try {
    const stored = window.localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    const partial = parseSession(JSON.parse(stored));
    if (!partial) return null;
    // Rebuild the full shape so a partial/older snapshot can never break the app.
    const materialKey = MATERIAL_MAP[partial.selectedMaterial as never]
      ? (partial.selectedMaterial as ExperimentState['selectedMaterial'])
      : base.selectedMaterial;
    // The source dataset, apparatus and history are never restored from storage.
    return {
      ...base,
      ...partial,
      selectedMaterial: materialKey,
      apparatus: base.apparatus,
      measurementHistory: [],
    } as ExperimentState;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/** Full-fidelity session file export (downloadable JSON notebook). */
export function serializeSessionFile(state: ExperimentState): string {
  return JSON.stringify(
    {
      version: SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      apparatusCount: APPARATUS.length,
      state: Object.fromEntries(PERSISTED_KEYS.map((key) => [key, state[key]])),
      measurementHistory: state.measurementHistory,
    },
    null,
    2,
  );
}
