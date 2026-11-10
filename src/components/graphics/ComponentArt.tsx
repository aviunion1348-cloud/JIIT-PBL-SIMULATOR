import type { ComponentId } from '../../experiment/apparatus';

/**
 * Custom SVG portraits of the seven apparatus components.
 * Procedural geometry only — no emoji, no external art, no stock images.
 */
export function ComponentArt({ id }: { readonly id: ComponentId }) {
  const common = {
    className: 'component-art',
    viewBox: '0 0 200 150',
    role: 'img' as const,
  };

  switch (id) {
    case 'laser-supply':
      return (
        <svg {...common} aria-label="Diode laser head with power supply unit">
          <rect x="24" y="96" width="152" height="8" rx="2" fill="#1b2436" />
          <rect x="46" y="62" width="86" height="34" rx="4" fill="#222c40" stroke="#3a4a66" />
          <rect x="60" y="70" width="58" height="18" rx="2" fill="#0f1626" />
          <circle cx="146" cy="79" r="13" fill="#141d2f" stroke="#7fe4fb" strokeOpacity="0.4" />
          <circle cx="146" cy="79" r="5.5" fill="#ff5f5f" />
          <circle cx="146" cy="79" r="12" fill="#ff3030" opacity="0.24" />
          <line x1="146" y1="79" x2="192" y2="79" stroke="#ff5f5f" strokeWidth="2.4" strokeLinecap="round" opacity="0.9" />
          <rect x="118" y="112" width="62" height="30" rx="3" fill="#1a2334" stroke="#3a4a66" />
          <circle cx="132" cy="122" r="3" fill="#4fe0a6" />
          <text x="24" y="138" className="component-art__tag">3 mW · 650 nm · RED</text>
        </svg>
      );
    case 'kinematic-mount':
      return (
        <svg {...common} aria-label="Kinematic laser mount with tip and tilt adjusters">
          <rect x="70" y="98" width="60" height="10" rx="2" fill="#1b2436" />
          <path d="M84 98 L84 56 L116 56 L116 98 Z" fill="#243050" stroke="#3a4a66" />
          <circle cx="100" cy="76" r="15" fill="#141d2f" stroke="#7fe4fb" strokeOpacity="0.35" />
          <circle cx="100" cy="76" r="5" fill="#7fe4fb" opacity="0.7" />
          <circle cx="92" cy="64" r="6" fill="#33405e" stroke="#5d7ba6" />
          <circle cx="110" cy="88" r="6" fill="#33405e" stroke="#5d7ba6" />
          <line x1="92" y1="64" x2="86" y2="46" stroke="#5d7ba6" strokeWidth="2" />
          <line x1="110" y1="88" x2="122" y2="80" stroke="#5d7ba6" strokeWidth="2" />
          <text x="42" y="132" className="component-art__tag">Tip / tilt alignment</text>
          <text x="126" y="56" className="component-art__tag">Ø 6 mm</text>
        </svg>
      );
    case 'polariser':
      return (
        <svg {...common} aria-label="Rotatable linear polariser on a graduated stage">
          <rect x="76" y="104" width="48" height="9" rx="2" fill="#1b2436" />
          <circle cx="100" cy="76" r="38" fill="none" stroke="#3a4a66" strokeWidth="2" />
          <circle cx="100" cy="76" r="30" fill="rgba(63,208,240,0.14)" stroke="#7fe4fb" strokeOpacity="0.5" />
          {Array.from({ length: 6 }, (_, i) => (
            <line key={i} x1={100 + (i - 2.5) * 9} y1="52" x2={100 + (i - 2.5) * 9} y2="100" stroke="#ffd479" strokeWidth="1.6" opacity="0.75" />
          ))}
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i * 15 * Math.PI) / 180;
            return (
              <line
                key={i}
                x1={100 + Math.cos(a) * 38}
                y1={76 + Math.sin(a) * 38}
                x2={100 + Math.cos(a) * (i % 6 === 0 ? 45 : 42)}
                y2={76 + Math.sin(a) * (i % 6 === 0 ? 45 : 42)}
                stroke={i % 6 === 0 ? '#f7b73d' : '#4c5a73'}
                strokeWidth="1"
              />
            );
          })}
          <text x="40" y="132" className="component-art__tag">0° – 360° rotation</text>
        </svg>
      );
    case 'goniometer':
      return (
        <svg {...common} aria-label="Goniometer with a rotating detector arm">
          <circle cx="100" cy="84" r="48" fill="none" stroke="#3a4a66" />
          {Array.from({ length: 36 }, (_, i) => {
            const a = (i * 10 * Math.PI) / 180;
            return (
              <line
                key={i}
                x1={100 + Math.cos(a) * 48}
                y1={84 + Math.sin(a) * 48}
                x2={100 + Math.cos(a) * (i % 3 === 0 ? 40 : 44)}
                y2={84 + Math.sin(a) * (i % 3 === 0 ? 40 : 44)}
                stroke={i % 3 === 0 ? '#f7b73d' : '#4c5a73'}
                strokeWidth="1"
              />
            );
          })}
          <circle cx="100" cy="84" r="5" fill="#e8fbff" />
          <g transform="rotate(-38 100 84)">
            <rect x="100" y="82" width="54" height="4" rx="2" fill="#2f3c56" />
            <rect x="150" y="74" width="16" height="20" rx="3" fill="#141d2f" stroke="#7fe4fb" strokeOpacity="0.5" />
            <circle cx="152" cy="84" r="3.4" fill="#3fd0f0" />
          </g>
          <text x="34" y="136" className="component-art__tag">Measured arm angle</text>
        </svg>
      );
    case 'specimen':
      return (
        <svg {...common} aria-label="Glass slide specimen mounted on a rotating stage">
          <rect x="66" y="108" width="68" height="9" rx="2" fill="#1b2436" />
          <g transform="rotate(-32 100 84)">
            <rect x="82" y="42" width="38" height="72" rx="2" fill="rgba(127,228,251,0.2)" stroke="#7fe4fb" strokeOpacity="0.6" />
            <rect x="86" y="46" width="8" height="64" fill="rgba(232,251,255,0.16)" />
            <rect x="105" y="46" width="4" height="64" fill="rgba(232,251,255,0.1)" />
          </g>
          <line x1="100" y1="24" x2="100" y2="112" stroke="#9fb4ff" strokeDasharray="4 5" opacity="0.45" />
          <text x="38" y="134" className="component-art__tag">Polished dielectric interface</text>
        </svg>
      );
    case 'photodetector':
      return (
        <svg {...common} aria-label="Pinhole photodetector with power supply">
          <rect x="58" y="70" width="66" height="32" rx="4" fill="#141d2f" stroke="#3a4a66" />
          <circle cx="58" cy="86" r="12" fill="#0f1626" stroke="#f7b73d" strokeOpacity="0.7" />
          <circle cx="58" cy="86" r="4" fill="#3fd0f0" />
          <circle cx="58" cy="86" r="11" fill="#3fd0f0" opacity="0.16" />
          <line x1="8" y1="86" x2="46" y2="86" stroke="#ff5f5f" strokeWidth="2" opacity="0.8" strokeLinecap="round" />
          <rect x="124" y="76" width="52" height="20" rx="3" fill="#1a2334" stroke="#3a4a66" />
          <text x="130" y="90" className="component-art__small">P.SUPPLY</text>
          <rect x="70" y="102" width="10" height="10" fill="#2a3346" />
          <rect x="100" y="102" width="10" height="10" fill="#2a3346" />
          <text x="44" y="134" className="component-art__tag">Current (I) output</text>
        </svg>
      );
    case 'optical-rail':
    default:
      return (
        <svg {...common} aria-label="500 millimetre graduated optical rail">
          <rect x="12" y="76" width="176" height="14" rx="2" fill="#151d2e" stroke="#3a4a66" />
          <rect x="12" y="72" width="176" height="4" fill="#24324a" />
          {Array.from({ length: 26 }, (_, i) => (
            <line
              key={i}
              x1={16 + i * 6.9}
              y1="58"
              x2={16 + i * 6.9}
              y2={i % 5 === 0 ? 72 : 66}
              stroke={i % 5 === 0 ? '#f7b73d' : '#7fe4fb'}
              strokeOpacity={i % 5 === 0 ? 0.9 : 0.5}
              strokeWidth="1"
            />
          ))}
          <text x="12" y="110" className="component-art__tag">0</text>
          <text x="168" y="110" className="component-art__tag">500 mm</text>
          <line x1="20" y1="100" x2="180" y2="100" stroke="#4c5a73" strokeWidth="0.8" />
          <text x="78" y="98" className="component-art__tag">10 mm graduations</text>
        </svg>
      );
  }
}
