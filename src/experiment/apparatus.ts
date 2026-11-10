/**
 * The seven apparatus components of the supplied experiment.
 * Rail coordinate: millimetres along the 500 mm optical rail (0 … 500).
 */
export type ComponentId =
  | 'laser-supply'
  | 'kinematic-mount'
  | 'polariser'
  | 'goniometer'
  | 'specimen'
  | 'photodetector'
  | 'optical-rail';

export interface ApparatusComponent {
  readonly id: ComponentId;
  readonly index: number;
  readonly name: string;
  readonly shortName: string;
  /** Exact specification line from the source document. */
  readonly specification: string;
  readonly function: string;
  readonly description: string;
  /** Home position on the rail in mm, or null when it spans the rail itself. */
  readonly railPositionMm: number | null;
  readonly required: boolean;
}

export const RAIL_LENGTH_MM = 500;

export const APPARATUS: readonly ApparatusComponent[] = [
  {
    id: 'laser-supply',
    index: 1,
    name: 'Diode Laser with Power Supply',
    shortName: 'DIODE LASER',
    specification: '3 mW · 650 nm · RED',
    function: 'Provides the monochromatic, collimated probe beam.',
    description:
      'A 650 nm red diode laser driven by a stabilised supply. The narrow band makes the polarisation state easy to interpret and keeps the beam visible along the whole rail.',
    railPositionMm: 40,
    required: true,
  },
  {
    id: 'kinematic-mount',
    index: 2,
    name: 'Kinematic Laser Mount',
    shortName: 'KINEMATIC MOUNT',
    specification: 'Two-axis tip/tilt alignment',
    function: 'Holds the laser and sets the beam height and azimuth.',
    description:
      'A kinematic plate with fine adjustment screws lets the beam be aimed at the specimen interface without touching the rail, which keeps the optical axis repeatable.',
    railPositionMm: 95,
    required: true,
  },
  {
    id: 'polariser',
    index: 3,
    name: 'Polariser',
    shortName: 'POLARISER',
    specification: 'Rotatable 0°–360°',
    function: 'Sets the incident state of polarisation.',
    description:
      'A linear polariser on a graduated rotation stage. Setting it to 0° gives s-polarised light, 90° gives p-polarised light, and the unpolarised source is modelled as two incoherent equal components.',
    railPositionMm: 150,
    required: true,
  },
  {
    id: 'specimen',
    index: 5,
    name: 'Glass Slide Specimen',
    shortName: 'SPECIMEN',
    specification: 'Topaz / Crown / Flint glass',
    function: 'The reflecting dielectric interface under test.',
    description:
      'A polished glass slide mounted so the angle of incidence can be varied about the surface normal. The reflected beam carries the polarisation signal that locates the Brewster angle.',
    railPositionMm: 250,
    required: true,
  },
  {
    id: 'goniometer',
    index: 4,
    name: 'Goniometer-Based Detector Mount',
    shortName: 'GONIOMETER',
    specification: 'Rotating arm, 0°–360° scale',
    function: 'Measures and sweeps the angular position of the detector.',
    description:
      'A graduated circle with a rotating arm. Reading the arm angle against the normal is what converts a bright spot into a measured Brewster angle.',
    railPositionMm: 320,
    required: true,
  },
  {
    id: 'photodetector',
    index: 6,
    name: 'Pinhole Photodetector with Power Supply',
    shortName: 'PHOTODETECTOR',
    specification: 'Pinhole aperture, biased cell',
    function: 'Converts the reflected beam intensity into a current reading.',
    description:
      'A small pinhole restricts the field of view so only the specular beam is collected. The source records the result as "Current (I) in A".',
    railPositionMm: 400,
    required: true,
  },
  {
    id: 'optical-rail',
    index: 7,
    name: 'Optical Rail',
    shortName: 'OPTICAL RAIL',
    specification: '500 mm graduated bench',
    function: 'Defines the optical axis and the absolute scale.',
    description:
      'A 500 mm anodised rail with 10 mm graduations. Every mount is referenced to it, so a component moved by 10 mm really is 10 mm along the optical axis.',
    railPositionMm: null,
    required: true,
  },
] as const;

export const REQUIRED_COMPONENT_IDS: readonly ComponentId[] = APPARATUS.filter(
  (component) => component.required,
).map((component) => component.id);

export const HOME_POSITIONS: Readonly<Record<string, number>> = (() => {
  const positions: Record<string, number> = {};
  for (const component of APPARATUS) {
    if (component.railPositionMm !== null) positions[component.id] = component.railPositionMm;
  }
  return positions;
})();

export function componentById(id: ComponentId): ApparatusComponent {
  const component = APPARATUS.find((item) => item.id === id);
  if (!component) throw new Error(`Unknown apparatus component: ${id}`);
  return component;
}

/** Placement is valid anywhere on the rail, with a 5 mm clearance from the ends. */
export function isValidRailPosition(positionMm: number): boolean {
  return Number.isFinite(positionMm) && positionMm >= 5 && positionMm <= RAIL_LENGTH_MM - 5;
}

/** Minimum spacing so adjacent mounts cannot physically overlap. */
export const MIN_COMPONENT_SPACING_MM = 30;

export function placementConflict(
  id: ComponentId,
  positionMm: number,
  placed: readonly string[],
  positions: Readonly<Record<string, number>>,
): ComponentId | null {
  for (const otherId of placed) {
    if (otherId === id) continue;
    const other = positions[otherId];
    if (typeof other !== 'number') continue;
    if (Math.abs(other - positionMm) < MIN_COMPONENT_SPACING_MM) {
      return otherId as ComponentId;
    }
  }
  return null;
}
