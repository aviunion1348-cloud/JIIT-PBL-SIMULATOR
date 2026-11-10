import type { OpticalResult } from '../physics/types';

/**
 * Exact 2D ray geometry for the side view.
 *
 * Convention: the interface is the horizontal line y = 0, the normal is +y,
 * and the incident beam arrives from the upper-left travelling (+x, −y).
 * Angles are measured from the normal, exactly as the physics engine reports.
 */
export interface RayGeometry2D {
  readonly width: number;
  readonly height: number;
  readonly origin: { x: number; y: number };
  readonly incident: { x1: number; y1: number; x2: number; y2: number };
  readonly reflected: { x1: number; y1: number; x2: number; y2: number };
  readonly refracted: { x1: number; y1: number; x2: number; y2: number } | null;
  readonly normal: { x1: number; y1: number; x2: number; y2: number };
  readonly interfaceLine: { x1: number; y1: number; x2: number; y2: number };
  readonly incidenceArc: Arc;
  readonly reflectionArc: Arc;
  readonly refractionArc: Arc | null;
  readonly brewsterArc: Arc;
  readonly brewsterMarker: { x: number; y: number };
}

export interface Arc {
  readonly d: string;
  readonly midX: number;
  readonly midY: number;
}

export interface RayDiagramOptions {
  readonly width?: number;
  readonly height?: number;
  readonly beamLength?: number;
  readonly showBrewsterReference?: boolean;
}

const DEFAULTS = { width: 760, height: 460, beamLength: 250 };

function polar(origin: { x: number; y: number }, radius: number, angleFromNormalDeg: number, side: 'up' | 'down', flipX: number) {
  // angle measured from the +y normal, rotating toward +x when flipX = +1
  const rad = (angleFromNormalDeg * Math.PI) / 180;
  const dx = Math.sin(rad) * radius * flipX;
  const dy = (side === 'up' ? 1 : -1) * Math.cos(rad) * radius;
  return { x: origin.x + dx, y: origin.y - dy };
}

/** SVG arc between two angles measured from the normal, centred on the origin. */
function arcPath(
  cx: number,
  cy: number,
  radius: number,
  startAngleDeg: number,
  endAngleDeg: number,
  side: 'up' | 'down',
): Arc {
  const point = (angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    const x = cx + Math.sin(rad) * radius;
    const y = side === 'up' ? cy - Math.cos(rad) * radius : cy + Math.cos(rad) * radius;
    return { x, y };
  };
  const start = point(startAngleDeg);
  const end = point(endAngleDeg);
  const mid = point((startAngleDeg + endAngleDeg) / 2);
  const sweep = side === 'up' ? 1 : 0;
  return {
    d: `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 0 ${sweep} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
    midX: mid.x,
    midY: mid.y,
  };
}

export function buildRayGeometry(
  result: OpticalResult,
  options: RayDiagramOptions = {},
): RayGeometry2D {
  const width = options.width ?? DEFAULTS.width;
  const height = options.height ?? DEFAULTS.height;
  const beamLength = options.beamLength ?? DEFAULTS.beamLength;

  // Specimen surface sits a little below centre so the transmitted ray fits.
  const origin = { x: width * 0.5, y: height * 0.58 };
  const incidence = result.incidenceDeg;
  const reflection = result.reflectionDeg;
  const refraction = result.refractionDeg;

  // Incident beam comes from the upper left; the reflected beam leaves upper right.
  const incidentStart = polar(origin, beamLength, incidence, 'up', -1);
  const reflectedEnd = polar(origin, beamLength, reflection, 'up', 1);
  const refractedEnd =
    refraction === null ? null : polar(origin, beamLength, refraction, 'down', 1);

  const arcRadius = 74;
  const brewsterRadius = arcRadius + 34;

  return {
    width,
    height,
    origin,
    incident: { x1: incidentStart.x, y1: incidentStart.y, x2: origin.x, y2: origin.y },
    reflected: { x1: origin.x, y1: origin.y, x2: reflectedEnd.x, y2: reflectedEnd.y },
    refracted: refractedEnd
      ? { x1: origin.x, y1: origin.y, x2: refractedEnd.x, y2: refractedEnd.y }
      : null,
    normal: { x1: origin.x, y1: origin.y - beamLength * 0.82, x2: origin.x, y2: origin.y + beamLength * 0.72 },
    interfaceLine: { x1: origin.x - width * 0.44, y1: origin.y, x2: origin.x + width * 0.44, y2: origin.y },
    incidenceArc: arcPath(origin.x, origin.y, arcRadius, 0, incidence, 'up'),
    reflectionArc: arcPath(origin.x, origin.y, arcRadius, 0, reflection, 'up'),
    refractionArc:
      refraction === null ? null : arcPath(origin.x, origin.y, arcRadius, 0, refraction, 'down'),
    brewsterArc: arcPath(origin.x, origin.y, brewsterRadius, 0, result.brewster.brewsterAngleDeg, 'up'),
    brewsterMarker: polar(origin, brewsterRadius, result.brewster.brewsterAngleDeg, 'up', 1),
  };
}

/** Beam intensity → stroke opacity, kept subtle and physics-driven. */
export function reflectanceOpacity(reflectance: number): number {
  return Math.min(1, 0.18 + Math.sqrt(Math.max(0, reflectance)) * 1.15);
}
