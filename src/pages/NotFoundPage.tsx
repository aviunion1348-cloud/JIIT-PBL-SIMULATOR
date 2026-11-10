import { Link } from 'react-router-dom';
import { RayDiagram } from '../components/graphics/RayDiagram';
import { computeOpticalResult } from '../physics';

const result = computeOpticalResult({
  n1: 1,
  n2: 1.6066,
  incidenceDeg: 58.1,
  polarisation: { mode: 'unpolarised', angleDeg: 0 },
  laserOn: true,
});

export default function NotFoundPage() {
  return (
    <div className="shell page">
      <header className="page__head">
        <p className="eyebrow">ALIGNMENT LOST</p>
        <h1 className="display page__title">THIS BEAM LEADS NOWHERE</h1>
        <p className="lede">
          The route you requested is not part of the laboratory. Nothing is broken — use one of the
          calibrated entry points below.
        </p>
      </header>
      <div className="grid-2">
        <div className="panel panel-body">
          <p className="label">AVAILABLE SECTIONS</p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'var(--sp-3)' }}>
            {[
              { to: '/', label: 'LAB HOME' },
              { to: '/theory', label: 'THEORY' },
              { to: '/apparatus', label: 'APPARATUS' },
              { to: '/experiment', label: 'LIVE EXPERIMENT' },
              { to: '/observations', label: 'OBSERVATIONS' },
              { to: '/analysis', label: 'ANALYSIS' },
              { to: '/results', label: 'RESULTS' },
              { to: '/viva', label: 'VIVA' },
            ].map((route) => (
              <li key={route.to}>
                <Link to={route.to} className="mono" style={{ fontSize: '0.76rem', letterSpacing: '0.14em' }}>
                  → {route.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel panel-body">
          <RayDiagram result={result} laserOn height={300} compact />
          <p className="note" style={{ marginTop: 'var(--sp-3)' }}>
            Meanwhile, at the polarising angle, R<sub>p</sub> = {result.fresnel.Rp.toExponential(2)}.
          </p>
        </div>
      </div>
    </div>
  );
}
