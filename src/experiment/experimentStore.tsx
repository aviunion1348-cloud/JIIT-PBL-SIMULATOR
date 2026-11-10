import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type Dispatch,
  type ReactNode,
} from 'react';
import { DEFAULT_MEDIUM, deriveIndexFromReportedAngle } from '../data/materials';
import { MATERIAL_MAP } from '../data/observations';
import { computeOpticalResult } from '../physics';
import type { OpticalResult } from '../physics/types';
import {
  autoAssemble,
  checkReadiness,
  createDefaultAssembly,
  placeComponent,
  removeComponent,
  resetAssembly,
  type AssemblyState,
} from './assembly';
import { createMeasurement, pushMeasurement } from './measurements';
import { loadSession, saveSession } from './persistence';
import type { ExperimentAction, ExperimentState } from './types';

const DEFAULT_MATERIAL = 'topaz';

export function createInitialState(): ExperimentState {
  const assembly = createDefaultAssembly();
  const material = MATERIAL_MAP[DEFAULT_MATERIAL];
  return {
    selectedMaterial: DEFAULT_MATERIAL,
    medium: { name: DEFAULT_MEDIUM.name, refractiveIndex: DEFAULT_MEDIUM.refractiveIndex },
    specimenRefractiveIndex: material.effectiveIndexAirCalibration,
    laser: { enabled: false, wavelengthNm: 650, powerMw: 3 },
    polarisation: {
      inputMode: 'unpolarised',
      inputAngleDeg: 0,
      analyserEnabled: false,
      analyserAngleDeg: 0,
    },
    geometry: { incidenceAngleDeg: 45, view: 'side' },
    apparatus: { ...assembly, isReady: checkReadiness(assembly).ready },
    detector: { calibration: null, acquisitionArmed: false },
    status: 'idle',
    measurementHistory: [],
    introSeen: false,
  };
}

/** The live physics result, derived from state — never stored twice. */
export function deriveOpticalResult(state: ExperimentState): OpticalResult {
  const result = computeOpticalResult({
    materialKey: state.selectedMaterial,
    n1: state.medium.refractiveIndex,
    n2: state.specimenRefractiveIndex,
    incidenceDeg: state.geometry.incidenceAngleDeg,
    polarisation: {
      mode: state.polarisation.inputMode,
      angleDeg: state.polarisation.inputAngleDeg,
    },
    analyser: {
      enabled: state.polarisation.analyserEnabled,
      angleDeg: state.polarisation.analyserAngleDeg,
    },
    laserOn: state.laser.enabled,
    detectorCalibration: state.detector.calibration,
  });
  return {
    ...result,
    incidentMedium: state.medium.name,
    specimenMedium: MATERIAL_MAP[state.selectedMaterial].name,
  };
}

function withAssembly(state: ExperimentState, assembly: AssemblyState): ExperimentState {
  return { ...state, apparatus: { ...assembly, isReady: checkReadiness(assembly).ready } };
}

export function experimentReducer(
  state: ExperimentState,
  action: ExperimentAction,
): ExperimentState {
  switch (action.type) {
    case 'set-material': {
      const material = MATERIAL_MAP[action.material];
      return {
        ...state,
        selectedMaterial: action.material,
        // A new specimen rewrites the specimen index; the source table is untouched.
        specimenRefractiveIndex: Number(
          deriveIndexFromReportedAngle(
            material.sourceReportedBrewsterAngleDeg,
            state.medium.refractiveIndex,
          ).toFixed(4),
        ),
      };
    }
    case 'set-medium': {
      const material = MATERIAL_MAP[state.selectedMaterial];
      // The effective index scales with the surrounding medium: n2 = n_eff(air) · n1.
      const baseIndex = material.effectiveIndexAirCalibration * action.refractiveIndex;
      return {
        ...state,
        medium: { name: action.name, refractiveIndex: action.refractiveIndex },
        specimenRefractiveIndex: Number(
          baseIndex.toFixed(4),
        ),
      };
    }
    case 'set-specimen-index':
      return { ...state, specimenRefractiveIndex: action.refractiveIndex };
    case 'set-laser':
      return {
        ...state,
        laser: { ...state.laser, enabled: action.enabled },
        status: !action.enabled && state.status === 'running' ? 'paused' : state.status,
      };
    case 'set-incidence':
      return { ...state, geometry: { ...state.geometry, incidenceAngleDeg: action.angleDeg } };
    case 'set-view':
      return { ...state, geometry: { ...state.geometry, view: action.view } };
    case 'set-polariser-angle':
      return { ...state, polarisation: { ...state.polarisation, inputAngleDeg: action.angleDeg } };
    case 'set-input-mode':
      return { ...state, polarisation: { ...state.polarisation, inputMode: action.mode } };
    case 'set-input-angle':
      return { ...state, polarisation: { ...state.polarisation, inputAngleDeg: action.angleDeg } };
    case 'set-analyser':
      return {
        ...state,
        polarisation: {
          ...state.polarisation,
          analyserEnabled: action.enabled,
          analyserAngleDeg:
            typeof action.angleDeg === 'number'
              ? action.angleDeg
              : state.polarisation.analyserAngleDeg,
        },
      };
    case 'set-calibration':
      return { ...state, detector: { ...state.detector, calibration: action.calibration } };
    case 'set-status':
      return { ...state, status: action.status };
    case 'place-component':
      return withAssembly(
        state,
        placeComponent(state.apparatus, action.id as never, action.positionMm).assembly,
      );
    case 'remove-component':
      return withAssembly(state, removeComponent(state.apparatus, action.id as never));
    case 'auto-assemble':
      return withAssembly(state, autoAssemble());
    case 'reset-assembly':
      return withAssembly(state, resetAssembly());
    case 'capture-measurement': {
      const result = deriveOpticalResult(state);
      if (!result.detector.acquisitionActive) return state;
      const record = createMeasurement(
        state.selectedMaterial,
        result.incidenceDeg,
        result.brewster.brewsterAngleDeg,
        result.detector.normalisedSignal,
        result.fresnel.Rs,
        result.fresnel.Rp,
      );
      return { ...state, measurementHistory: pushMeasurement(state.measurementHistory, record) };
    }
    case 'clear-history':
      return { ...state, measurementHistory: [] };
    case 'mark-intro-seen':
      return { ...state, introSeen: true };
    case 'reset':
      return { ...createInitialState(), introSeen: state.introSeen };
    case 'hydrate': {
      const merged: ExperimentState = { ...state, ...action.state } as ExperimentState;
      return withAssembly(merged, merged.apparatus ?? state.apparatus);
    }
    default:
      return state;
  }
}

interface StoreValue {
  readonly state: ExperimentState;
  readonly dispatch: Dispatch<ExperimentAction>;
  readonly result: OpticalResult;
  readonly captureMeasurement: () => void;
  readonly toast: string | null;
  readonly clearToast: () => void;
  readonly notify: (message: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const TOAST_MESSAGES: Partial<Record<ExperimentAction['type'], string>> = {
  'auto-assemble': 'Optical train auto-assembled on the 500 mm rail.',
  'reset-assembly': 'Rail cleared — drag the mounts back into place.',
  'place-component': 'Mount seated on the rail.',
  'remove-component': 'Mount removed from the rail.',
  reset: 'Experiment reset to its default state.',
  'clear-history': 'Measurement history cleared.',
};

export function ExperimentProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(experimentReducer, undefined, () => {
    const base = createInitialState();
    return loadSession(base) ?? base;
  });
  const [toast, setToastState] = useReducer(
    (_current: string | null, next: string | null) => next,
    null,
  );
  const toastTimer = useRef<number | null>(null);

  const notify = useCallback((message: string) => {
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    setToastState(message);
    toastTimer.current = window.setTimeout(() => setToastState(null), 3200);
  }, []);

  const clearToast = useCallback(() => setToastState(null), []);

  const dispatch = useCallback<Dispatch<ExperimentAction>>(
    (action) => {
      rawDispatch(action);
      const message = TOAST_MESSAGES[action.type];
      if (message) notify(message);
    },
    [notify],
  );

  const result = useMemo(() => deriveOpticalResult(state), [state]);

  useEffect(() => {
    const handle = window.setTimeout(() => saveSession(state), 400);
    return () => window.clearTimeout(handle);
  }, [state]);

  const captureMeasurement = useCallback(() => {
    if (!state.laser.enabled) {
      notify('Switch the laser on before capturing a reading.');
      return;
    }
    rawDispatch({ type: 'capture-measurement' });
    notify('Theoretical capture stored in the measurement history.');
  }, [notify, state.laser.enabled]);

  const value = useMemo<StoreValue>(
    () => ({ state, dispatch, result, captureMeasurement, toast, clearToast, notify }),
    [state, dispatch, result, captureMeasurement, toast, clearToast, notify],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useExperiment(): StoreValue {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useExperiment must be used inside <ExperimentProvider>.');
  return context;
}
