import { useId, useMemo, useState } from 'react';
import type { MaterialRecord } from '../../data/observations';
import { sampledMinimum } from '../../data/observations';
import { interpolateMinimum } from '../../experiment/measurements';
import './chart.css';

interface Props {
  readonly materials: readonly MaterialRecord[];
  readonly highlightKey: string;
  readonly showBrewsterMarkers?: boolean;
  readonly showFit?: boolean;
  readonly height?: number;
}

const PADDING = { top: 26, right: 22, bottom: 42, left: 54 };
const VIEW_WIDTH = 780;

const SERIES_COLORS: Record<string, string> = {
  topaz: '#7fe4fb',
  crown: '#ffd479',
  flint: '#b9a4ff',
};

/**
 * Genuine data-driven chart. Every point comes from the central immutable
 * dataset; nothing is hardcoded here. Hover/focus reveals exact values.
 */
export function ObservationChart({
  materials,
  highlightKey,
  showBrewsterMarkers = true,
  showFit = false,
  height = 380,
}: Props) {
  const uid = useId().replace(/:/g, '');
  const [active, setActive] = useState<{ material: string; index: number } | null>(null);

  const innerWidth = VIEW_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = height - PADDING.top - PADDING.bottom;

  const currentMax = useMemo(() => {
    let max = 0;
    for (const material of materials) {
      for (const observation of material.observations) {
        if (observation.currentA > max) max = observation.currentA;
      }
    }
    return Math.ceil(max) + 0.5;
  }, [materials]);

  const x = (angle: number) => PADDING.left + (angle / 90) * innerWidth;
  const y = (current: number) => PADDING.top + innerHeight - (current / currentMax) * innerHeight;

  const yTicks = useMemo(() => {
    const step = currentMax > 12 ? 2 : 1;
    const ticks: number[] = [];
    for (let value = 0; value <= currentMax; value += step) ticks.push(value);
    return ticks;
  }, [currentMax]);

  const activePoint =
    active === null
      ? null
      : materials.find((material) => material.key === active.material)?.observations[active.index] ?? null;
  const activeMaterial =
    active === null ? null : materials.find((material) => material.key === active.material) ?? null;

  return (
    <div className="chart">
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
        className="chart__svg"
        role="img"
        aria-label={`Current against angle of incidence for ${materials.map((m) => m.name).join(', ')}. ${materials.length * 19} source points plotted.`}
      >
        <defs>
          {materials.map((material) => (
            <linearGradient key={material.key} id={`fill-${uid}-${material.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES_COLORS[material.key]} stopOpacity="0.16" />
              <stop offset="100%" stopColor={SERIES_COLORS[material.key]} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {/* grid */}
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={PADDING.left}
              y1={y(tick)}
              x2={VIEW_WIDTH - PADDING.right}
              y2={y(tick)}
              stroke="rgba(143,170,210,0.13)"
              strokeWidth="1"
            />
            <text x={PADDING.left - 10} y={y(tick) + 4} className="chart__axis-label" textAnchor="end">
              {tick}
            </text>
          </g>
        ))}
        {Array.from({ length: 10 }, (_, i) => i * 10).map((angle) => (
          <g key={angle}>
            <line
              x1={x(angle)}
              y1={PADDING.top}
              x2={x(angle)}
              y2={PADDING.top + innerHeight}
              stroke="rgba(143,170,210,0.07)"
              strokeWidth="1"
            />
            <text x={x(angle)} y={PADDING.top + innerHeight + 20} className="chart__axis-label" textAnchor="middle">
              {angle}°
            </text>
          </g>
        ))}

        {/* axes */}
        <line
          x1={PADDING.left}
          y1={PADDING.top + innerHeight}
          x2={VIEW_WIDTH - PADDING.right}
          y2={PADDING.top + innerHeight}
          stroke="rgba(143,170,210,0.4)"
        />
        <line x1={PADDING.left} y1={PADDING.top} x2={PADDING.left} y2={PADDING.top + innerHeight} stroke="rgba(143,170,210,0.4)" />

        <text x={PADDING.left + innerWidth / 2} y={height - 6} className="chart__axis-title" textAnchor="middle">
          ANGLE OF INCIDENCE (°) — MEASURED FROM THE NORMAL
        </text>
        <text
          x={12}
          y={PADDING.top + innerHeight / 2}
          className="chart__axis-title"
          textAnchor="middle"
          transform={`rotate(-90 12 ${PADDING.top + innerHeight / 2})`}
        >
          CURRENT (I) IN A
        </text>

        {/* source-reported Brewster markers */}
        {showBrewsterMarkers &&
          materials.map((material) => {
            const angle = material.sourceReportedBrewsterAngleDeg;
            const isHighlighted = material.key === highlightKey;
            return (
              <g key={`brewster-${material.key}`} opacity={isHighlighted ? 1 : 0.55}>
                <line
                  x1={x(angle)}
                  y1={PADDING.top}
                  x2={x(angle)}
                  y2={PADDING.top + innerHeight}
                  stroke="#f7b73d"
                  strokeWidth="1.2"
                  strokeDasharray="4 5"
                />
                <circle cx={x(angle)} cy={PADDING.top + 8} r="3" fill="#f7b73d" />
                {isHighlighted && (
                  <text x={x(angle) + 6} y={PADDING.top + 12} className="chart__brewster-label">
                    REPORTED {angle}°
                  </text>
                )}
              </g>
            );
          })}

        {/* series */}
        {materials.map((material) => {
          const colour = SERIES_COLORS[material.key];
          const isHighlighted = material.key === highlightKey;
          const minimum = sampledMinimum(material);
          const fit = interpolateMinimum(material.observations);
          const points = material.observations.map((observation) => `${x(observation.angleDeg)},${y(observation.currentA)}`);
          const area = `M ${x(0)},${PADDING.top + innerHeight} L ${points.join(' L ')} L ${x(90)},${PADDING.top + innerHeight} Z`;

          return (
            <g key={material.key} opacity={isHighlighted ? 1 : 0.34}>
              <path d={area} fill={`url(#fill-${uid}-${material.key})`} />
              <polyline
                points={points.join(' ')}
                fill="none"
                stroke={colour}
                strokeWidth={isHighlighted ? 2 : 1.4}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {material.observations.map((observation, index) => {
                const isMinimum = observation.angleDeg === minimum.angleDeg;
                const isActive = active?.material === material.key && active.index === index;
                return (
                  <g key={observation.angleDeg}>
                    <circle
                      cx={x(observation.angleDeg)}
                      cy={y(observation.currentA)}
                      r={isActive ? 6 : isMinimum ? 5 : 3.2}
                      fill={isMinimum ? '#f7b73d' : colour}
                      stroke={isActive ? '#f4f8ff' : 'rgba(5,7,15,0.9)'}
                      strokeWidth={isActive ? 2 : 1}
                    />
                    {isMinimum && <circle cx={x(observation.angleDeg)} cy={y(observation.currentA)} r="9" fill="none" stroke="#f7b73d" strokeOpacity="0.5" />}
                    {/* generous invisible hit area for pointer + focus */}
                    <circle
                      cx={x(observation.angleDeg)}
                      cy={y(observation.currentA)}
                      r="11"
                      fill="transparent"
                      className="chart__hit"
                      tabIndex={0}
                      role="button"
                      aria-label={`${material.name} at ${observation.angleDeg} degrees: current ${observation.currentA.toFixed(4)} amperes${isMinimum ? ', minimum sampled reading' : ''}`}
                      onMouseEnter={() => setActive({ material: material.key, index })}
                      onFocus={() => setActive({ material: material.key, index })}
                      onClick={() => setActive({ material: material.key, index })}
                    />
                  </g>
                );
              })}

              {showFit && fit && (
                <g>
                  <circle cx={x(fit.angleDeg)} cy={y(fit.currentA)} r="6" fill="none" stroke={colour} strokeDasharray="3 3" />
                  <text x={x(fit.angleDeg) + 8} y={y(fit.currentA) + 16} className="chart__fit-label">
                    fit {fit.angleDeg.toFixed(2)}°
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      <div className="chart__legend">
        {materials.map((material) => {
          const minimum = sampledMinimum(material);
          return (
            <span key={material.key} className="chart__legend-item">
              <span className="chart__swatch" style={{ background: SERIES_COLORS[material.key] }} />
              <span>{material.name}</span>
              <span className="chart__legend-sub mono">
                min {minimum.angleDeg}° · {minimum.currentA.toFixed(4)} A
              </span>
            </span>
          );
        })}
        <span className="chart__legend-item chart__legend-item--meta">
          <span className="chart__swatch chart__swatch--amber" />
          <span>Reported Brewster angle</span>
        </span>
      </div>

      <div className="chart__readout" role="status" aria-live="polite">
        {activePoint && activeMaterial ? (
          <>
            <span className="label">{activeMaterial.name.toUpperCase()}</span>
            <span className="mono">
              θ = {activePoint.angleDeg}° · I = {activePoint.currentA.toFixed(4)} A
            </span>
          </>
        ) : (
          <span className="note">Hover, focus or tap any marker to read its exact source value.</span>
        )}
      </div>
    </div>
  );
}
