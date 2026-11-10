import type { AssemblyState } from './assembly';
import type { MeasurementRecord } from './measurements';
import type {
  DetectorCalibration,
  InputPolarisationMode,
  MaterialKey,
} from '../physics/types';

export type ViewMode = 'side' | 'top';

export type ExperimentStatus = 'idle' | 'running' | 'paused';

export interface ExperimentState {
  readonly selectedMaterial: MaterialKey;
  readonly medium: { readonly name: string; readonly refractiveIndex: number };
  readonly specimenRefractiveIndex: number;
  readonly laser: {
    readonly enabled: boolean;
    readonly wavelengthNm: number;
    readonly powerMw: number;
  };
  readonly polarisation: {
    readonly inputMode: InputPolarisationMode;
    readonly inputAngleDeg: number;
    readonly analyserEnabled: boolean;
    readonly analyserAngleDeg: number;
  };
  readonly geometry: {
    readonly incidenceAngleDeg: number;
    readonly view: ViewMode;
  };
  readonly apparatus: AssemblyState & { readonly isReady: boolean };
  readonly detector: {
    readonly calibration: DetectorCalibration | null;
    readonly acquisitionArmed: boolean;
  };
  readonly status: ExperimentStatus;
  readonly measurementHistory: readonly MeasurementRecord[];
  readonly introSeen: boolean;
}

export type ExperimentAction =
  | { type: 'set-material'; material: MaterialKey }
  | { type: 'set-medium'; name: string; refractiveIndex: number }
  | { type: 'set-specimen-index'; refractiveIndex: number }
  | { type: 'set-laser'; enabled: boolean }
  | { type: 'set-incidence'; angleDeg: number }
  | { type: 'set-view'; view: ViewMode }
  | { type: 'set-polariser-angle'; angleDeg: number }
  | { type: 'set-input-mode'; mode: InputPolarisationMode }
  | { type: 'set-input-angle'; angleDeg: number }
  | { type: 'set-analyser'; enabled: boolean; angleDeg?: number }
  | { type: 'set-calibration'; calibration: DetectorCalibration | null }
  | { type: 'set-status'; status: ExperimentStatus }
  | { type: 'place-component'; id: string; positionMm: number }
  | { type: 'remove-component'; id: string }
  | { type: 'auto-assemble' }
  | { type: 'reset-assembly' }
  | { type: 'capture-measurement' }
  | { type: 'clear-history' }
  | { type: 'reset' }
  | { type: 'mark-intro-seen' }
  | { type: 'hydrate'; state: Partial<ExperimentState> };
