import './controls.css';

interface Props {
  readonly value: number;
  readonly max?: number;
  readonly label: string;
  readonly size?: number;
  readonly accent?: 'cyan' | 'red' | 'amber';
  readonly secondary?: { readonly value: number; readonly label: string; readonly accent: 'cyan' | 'amber' };
}

/**
 * A graduated instrument dial. Used for the incidence angle and the
 * polariser rotation so the numbers have a physical reference.
 */
export function AngularDial({
  value,
  max = 90,
  label,
  size = 148,
  accent = 'cyan',
  secondary,
}: Props) {
  const radius = 58;
  const centre = 70;
  const fraction = Math.min(1, Math.max(0, value / max));
  const arcStart = -220;
  const sweep = 260;
  const endAngle = arcStart + sweep * fraction;

  const polar = (angleDeg: number, r = radius) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: centre + Math.cos(rad) * r, y: centre + Math.sin(rad) * r };
  };

  const arcPath = (from: number, to: number) => {
    const start = polar(from);
    const end = polar(to);
    const large = Math.abs(to - from) > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y}`;
  };

  const needle = polar(endAngle, radius - 12);

  return (
    <div className={`dial dial--${accent}`}>
      <svg viewBox="0 0 140 140" width={size} height={size} role="img" aria-label={`${label}: ${value.toFixed(1)} degrees`}>
        <circle cx={centre} cy={centre} r={radius + 9} className="dial__bezel" />
        <path d={arcPath(arcStart, arcStart + sweep)} className="dial__track" />
        <path d={arcPath(arcStart, endAngle)} className="dial__fill" />

        {Array.from({ length: 19 }, (_, i) => i * 5).map((tick) => {
          const angle = arcStart + (sweep * tick) / max;
          const major = tick % 15 === 0;
          const inner = polar(angle, radius - (major ? 12 : 7));
          const outer = polar(angle, radius - 1);
          return (
            <line
              key={tick}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              className={major ? 'dial__tick dial__tick--major' : 'dial__tick'}
            />
          );
        })}

        {secondary && (
          <g>
            {(() => {
              const angle = arcStart + (sweep * Math.min(90, secondary.value)) / 90;
              const mark = polar(angle, radius - 20);
              return (
                <>
                  <circle cx={mark.x} cy={mark.y} r="3" className={`dial__marker dial__marker--${secondary.accent}`} />
                  <text x={mark.x} y={mark.y - 9} className={`dial__marker-label dial__marker-label--${secondary.accent}`} textAnchor="middle">
                    {secondary.label}
                  </text>
                </>
              );
            })()}
          </g>
        )}

        <line x1={centre} y1={centre} x2={needle.x} y2={needle.y} className="dial__needle" />
        <circle cx={centre} cy={centre} r="4" className="dial__hub" />
        <text x={centre} y={centre + 34} className="dial__value" textAnchor="middle">
          {value.toFixed(1)}°
        </text>
        <text x={centre} y={centre + 48} className="dial__caption" textAnchor="middle">
          {label}
        </text>
      </svg>
    </div>
  );
}
