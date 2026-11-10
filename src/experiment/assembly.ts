import {
  APPARATUS,
  HOME_POSITIONS,
  REQUIRED_COMPONENT_IDS,
  placementConflict,
  type ComponentId,
} from './apparatus';

export interface AssemblyState {
  readonly placedComponentIds: readonly ComponentId[];
  readonly positions: Readonly<Record<string, number>>;
}

export interface PlacementResult {
  readonly ok: boolean;
  readonly assembly: AssemblyState;
  readonly message: string;
}

export const FULLY_ASSEMBLED: AssemblyState = {
  placedComponentIds: APPARATUS.map((component) => component.id),
  positions: HOME_POSITIONS,
};

/** Start pre-assembled so the simulator is immediately usable. */
export function createDefaultAssembly(): AssemblyState {
  return { placedComponentIds: [...FULLY_ASSEMBLED.placedComponentIds], positions: { ...FULLY_ASSEMBLED.positions } };
}

export function placeComponent(
  assembly: AssemblyState,
  id: ComponentId,
  positionMm: number,
): PlacementResult {
  if (placementConflict(id, positionMm, assembly.placedComponentIds, assembly.positions)) {
    return {
      ok: false,
      assembly,
      message: 'That slot is occupied — keep at least 30 mm between mounts.',
    };
  }
  const placed = assembly.placedComponentIds.includes(id)
    ? assembly.placedComponentIds
    : [...assembly.placedComponentIds, id];
  return {
    ok: true,
    assembly: { placedComponentIds: placed, positions: { ...assembly.positions, [id]: positionMm } },
    message: 'Component seated on the rail.',
  };
}

export function removeComponent(assembly: AssemblyState, id: ComponentId): AssemblyState {
  const positions = { ...assembly.positions };
  delete positions[id];
  return {
    placedComponentIds: assembly.placedComponentIds.filter((item) => item !== id),
    positions,
  };
}

export function resetAssembly(): AssemblyState {
  return { placedComponentIds: [], positions: {} };
}

export function autoAssemble(): AssemblyState {
  return createDefaultAssembly();
}

export interface ReadinessReport {
  readonly ready: boolean;
  readonly missing: readonly ComponentId[];
  readonly message: string;
}

export function checkReadiness(assembly: AssemblyState): ReadinessReport {
  const missing = REQUIRED_COMPONENT_IDS.filter(
    (id) => !assembly.placedComponentIds.includes(id),
  );
  return {
    ready: missing.length === 0,
    missing,
    message:
      missing.length === 0
        ? 'OPTICAL TRAIN READY'
        : `${missing.length} mount${missing.length > 1 ? 's' : ''} still required on the rail.`,
  };
}
