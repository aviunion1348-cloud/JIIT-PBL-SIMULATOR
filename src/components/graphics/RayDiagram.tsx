import { useId, useMemo } from 'react';
import { buildRayGeometry, reflectanceOpacity } from '../../graphics/RayDiagram2D';
import type { OpticalResult } from '../../physics/types';
import './ray-diagram.css';

interface Props {
  readonly result: OpticalResult;
  readonly laserOn: boolean;
  readonly height?: number;
  readonly compact?: boolean;
  readonly showBrewsterReference?: boolean;
}

/**
 * The reliability baseline: an exact, physics-driven SVG ray diagram.
 * Also used as the fallback whenever WebGL is unavailable.
 */
export function RayDiagram({
  result,
  laserOn,
  height = 460,
  compact = false,
  showBrewsterReference = true,
}: Props) {
  const uid = useId().replace(/:/g, '');
  const geometry = useMemo(
    () => buildRayGeometry(result, { width: 900, height, beamLength: height * 0.52 }),
    [result, height],
  );

  const reflectedOpacity = laserOn ? reflectanceOpacity(result.fresnel.RUnpolarised) : 0;
  const transmittedOpacity = laserOn ? 0.55 : 0;
  const incidentOpacity = laserOn ? 0.95 : 0.12;
  const shallowRefraction = result.refractionDeg !== null && result.refractionDeg > 65;

  return (
    <svg
      className={`ray-diagram${compact ? ' ray-diagram--compact' : ''}`}
      viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      role="img"
      aria-label={`Ray diagram: incidence ${result.incidenceDeg.toFixed(1)} degrees, reflection ${result.reflectionDeg.toFixed(1)} degrees, refraction ${result.refractionDeg === null ? 'total internal reflection' : `${result.refractionDeg.toFixed(1)} degrees`}. Brewster angle ${result.brewster.brewsterAngleDeg.toFixed(2)} degrees.`}
    >
      <defs>
        <linearGradient id={`glass-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7fe4fb" stopOpacity="0.30" />
          <stop offset="55%" stopColor="#3fd0f0" stopOpacity="0.13" />
          <stop offset="100%" stopColor="#1b3a63" stopOpacity="0.42" />
        </linearGradient>
        <linearGradient id={`beam-inc-${uid}`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff2b2b" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ff8a8a" stopOpacity="1" />
        </linearGradient>
        <filter id={`glow-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`soft-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <pattern id={`grid-${uid}`} width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(143,170,210,0.09)" strokeWidth="1" />
        </pattern>
      </defs>

      <rect width={geometry.width} height={geometry.height} fill={`url(#grid-${uid})`} opacity="0.55" />

      <g opacity="0.36">
        {Array.from({ length: 19 }, (_, i) => i * 5).map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const r1 = 218;
          const r2 = angle % 15 === 0 ? 232 : 226;
          const x1 = geometry.origin.x - Math.sin(rad) * r1;
          const y1 = geometry.origin.y - Math.cos(rad) * r1;
          const x2 = geometry.origin.x - Math.sin(rad) * r2;
          const y2 = geometry.origin.y - Math.cos(rad) * r2;
          return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#4c5a73" strokeWidth="1" />;
        })}
      </g>

      <g>
        <line
          x1={geometry.interfaceLine.x1}
          y1={geometry.interfaceLine.y1}
          x2={geometry.interfaceLine.x2}
          y2={geometry.interfaceLine.y2}
          stroke="#7fe4fb"
          strokeOpacity="0.55"
          strokeWidth="2"
        />
        <rect
          x={geometry.origin.x - geometry.width * 0.24}
          y={geometry.origin.y}
          width={geometry.width * 0.48}
          height={geometry.height - geometry.origin.y - 8}
          fill={`url(#glass-${uid})`}
          stroke="rgba(127,228,251,0.22)"
          strokeWidth="1"
          rx="2"
        />
        <text
          x={geometry.origin.x + geometry.width * 0.25}
          y={geometry.origin.y + 24}
          className="ray-diagram__specimen-label"
          textAnchor="end"
        >
          {result.specimenMedium.toUpperCase()} · n₂ = {result.n2.toFixed(4)}
        </text>
        <text
          x={geometry.origin.x + geometry.width * 0.25}
          y={geometry.origin.y - 10}
          className="ray-diagram__specimen-label"
          textAnchor="end"
        >
          {result.incidentMedium.toUpperCase()} · n₁ = {result.n1.toFixed(3)}
        </text>
      </g>

      <line
        x1={geometry.normal.x1}
        y1={geometry.normal.y1}
        x2={geometry.normal.x2}
        y2={geometry.normal.y2}
        stroke="#9fb4ff"
        strokeOpacity="0.5"
        strokeWidth="1.2"
        strokeDasharray="5 7"
      />
      <text x={geometry.normal.x1 + 8} y={geometry.normal.y1 + 14} className="ray-diagram__tag">
        NORMAL
      </text>

      {showBrewsterReference && (
        <g opacity={laserOn ? 0.9 : 0.4}>
          <line
            x1={geometry.origin.x}
            y1={geometry.origin.y}
            x2={geometry.brewsterMarker.x}
            y2={geometry.brewsterMarker.y}
            stroke="#f7b73d"
            strokeOpacity="0.5"
            strokeWidth="1.2"
            strokeDasharray="3 6"
          />
          <path d={geometry.brewsterArc.d} fill="none" stroke="#f7b73d" strokeOpacity="0.55" strokeWidth="1.4" />
          <circle cx={geometry.brewsterMarker.x} cy={geometry.brewsterMarker.y} r="3.4" fill="#f7b73d" />
          <text
            x={geometry.brewsterMarker.x + 10}
            y={geometry.brewsterMarker.y + 4}
            className="ray-diagram__tag ray-diagram__tag--amber"
          >
            θB {result.brewster.brewsterAngleDeg.toFixed(2)}°
          </text>
        </g>
      )}

      <g filter={`url(#glow-${uid})`} opacity={incidentOpacity}>
        <line
          x1={geometry.incident.x1}
          y1={geometry.incident.y1}
          x2={geometry.incident.x2}
          y2={geometry.incident.y2}
          stroke={`url(#beam-inc-${uid})`}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1={geometry.incident.x1}
          y1={geometry.incident.y1}
          x2={geometry.incident.x2}
          y2={geometry.incident.y2}
          stroke="#ffdede"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.8"
        />
      </g>

      <g filter={`url(#soft-${uid})`} opacity={reflectedOpacity}>
        <line
          x1={geometry.reflected.x1}
          y1={geometry.reflected.y1}
          x2={geometry.reflected.x2}
          y2={geometry.reflected.y2}
          stroke="#ff5f5f"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </g>

      {geometry.refracted && (
        <g filter={`url(#soft-${uid})`} opacity={transmittedOpacity}>
          <line
            x1={geometry.refracted.x1}
            y1={geometry.refracted.y1}
            x2={geometry.refracted.x2}
            y2={geometry.refracted.y2}
            stroke="#3fd0f0"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray={shallowRefraction ? '9 4' : undefined}
          />
        </g>
      )}

      <g className="ray-diagram__arcs">
        <path d={geometry.incidenceArc.d} fill="none" stroke="#ff8a8a" strokeWidth="2" opacity={laserOn ? 0.9 : 0.3} />
        <text x={geometry.incidenceArc.midX - 34} y={geometry.incidenceArc.midY} className="ray-diagram__angle">
          θi {result.incidenceDeg.toFixed(1)}°
        </text>

        <path d={geometry.reflectionArc.d} fill="none" stroke="#ff8a8a" strokeWidth="2" opacity={reflectedOpacity} />
        <text x={geometry.reflectionArc.midX + 8} y={geometry.reflectionArc.midY} className="ray-diagram__angle">
          θr {result.reflectionDeg.toFixed(1)}°
        </text>

        {geometry.refractionArc && result.refractionDeg !== null && (
          <>
            <path
              d={geometry.refractionArc.d}
              fill="none"
              stroke="#3fd0f0"
              strokeWidth="2"
              opacity={transmittedOpacity + 0.2}
            />
            <text
              x={geometry.refractionArc.midX + 8}
              y={geometry.refractionArc.midY + 12}
              className="ray-diagram__angle ray-diagram__angle--cyan"
            >
              θt {result.refractionDeg.toFixed(1)}°
            </text>
          </>
        )}
      </g>

      {result.atBrewster && result.refractionDeg !== null && (
        <g opacity="0.9">
          <rect
            x={geometry.origin.x + 18}
            y={geometry.origin.y + 18}
            width="13"
            height="13"
            fill="none"
            stroke="#f7b73d"
            strokeWidth="1.4"
            transform={`rotate(${-result.incidenceDeg} ${geometry.origin.x + 18} ${geometry.origin.y + 18})`}
          />
          <text x={geometry.origin.x + 44} y={geometry.origin.y + 46} className="ray-diagram__tag ray-diagram__tag--amber">
            θr + θt = 90°
          </text>
        </g>
      )}

      <circle cx={geometry.origin.x} cy={geometry.origin.y} r="4" fill="#e8fbff" />
      <circle cx={geometry.origin.x} cy={geometry.origin.y} r="10" fill="none" stroke="#7fe4fb" strokeOpacity="0.4" />

      {!laserOn && (
        <g>
          <rect width={geometry.width} height={geometry.height} fill="#05070f" opacity="0.42" />
          <text x={geometry.width / 2} y={geometry.height / 2 - 8} textAnchor="middle" className="ray-diagram__offline">
            LASER OFFLINE
          </text>
          <text x={geometry.width / 2} y={geometry.height / 2 + 18} textAnchor="middle" className="ray-diagram__offline-sub">
            Geometry is calculated · no beam is being emitted
          </text>
        </g>
      )}
    </svg>
  );
}
