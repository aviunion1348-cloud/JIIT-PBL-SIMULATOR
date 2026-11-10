import { Link } from 'react-router-dom';
import { ROUTES } from '../../app/routes';
import { SOURCE_CITATION } from '../../data/results';
import './footer.css';

export function LaboratoryFooter() {
  return (
    <footer className="lab-footer">
      <div className="shell lab-footer__inner">
        <div className="lab-footer__brand">
          <p className="eyebrow">JIIT PHYSICS PBL</p>
          <p className="lab-footer__title display">BREWSTER'S LAW LAB</p>
          <p className="note">{SOURCE_CITATION}</p>
        </div>

        <nav className="lab-footer__nav" aria-label="Footer sections">
          {ROUTES.map((route) => (
            <Link key={route.path} to={route.path}>
              <span className="section-index">{route.index}</span>
              {route.label}
            </Link>
          ))}
        </nav>

        <div className="lab-footer__spec">
          <p className="label">SOURCE SPECIFICATION</p>
          <ul>
            <li><span className="mono">650 nm</span> diode laser wavelength</li>
            <li><span className="mono">3 mW</span> optical power</li>
            <li><span className="mono">500 mm</span> optical rail</li>
            <li><span className="mono">57</span> source readings preserved</li>
          </ul>
        </div>
      </div>
      <div className="shell lab-footer__base">
        <span className="mono">Static SPA · Vite + React + Three.js · no backend, no runtime CDN</span>
        <span className="mono">All source values preserved verbatim · simulator output labelled separately</span>
      </div>
    </footer>
  );
}
