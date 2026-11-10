import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ROUTES } from '../../app/routes';
import { useExperiment } from '../../experiment/experimentStore';
import './nav.css';

export function NavBar() {
  const location = useLocation();
  const { state, result } = useExperiment();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const active = ROUTES.find((route) => route.path === location.pathname) ?? ROUTES[0];

  return (
    <header className="nav">
      <div className="shell nav__inner">
        <Link to="/" className="nav__brand" aria-label="Brewster's Law Lab — home">
          <span className="nav__mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="30" height="30">
              <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(127,228,251,0.28)" strokeWidth="1" />
              <line x1="4" y1="26" x2="16" y2="14" stroke="#ff5f5f" strokeWidth="2" strokeLinecap="round" />
              <line x1="16" y1="14" x2="27" y2="6" stroke="#ff8a8a" strokeWidth="2" strokeLinecap="round" />
              <line x1="16" y1="14" x2="25" y2="26" stroke="#3fd0f0" strokeWidth="2" strokeLinecap="round" />
              <circle cx="16" cy="14" r="2.2" fill="#e8fbff" />
            </svg>
          </span>
          <span className="nav__brand-text">
            <strong>BREWSTER'S LAW</strong>
            <span>OPTICAL LABORATORY</span>
          </span>
        </Link>

        <nav className="nav__links" aria-label="Laboratory sections">
          {ROUTES.map((route) => (
            <NavLink
              key={route.path}
              to={route.path}
              end={route.path === '/'}
              className={({ isActive }) => `nav__link${isActive ? ' is-active' : ''}`}
            >
              <span className="nav__link-index">{route.index}</span>
              {route.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav__status" aria-live="polite">
          <span className={`chip ${state.laser.enabled ? 'chip--live' : 'chip--off'}`}>
            {state.laser.enabled ? 'BEAM LIVE' : 'BEAM OFF'}
          </span>
          <span className="nav__theta mono">
            θ<sub>B</sub> {result.brewster.brewsterAngleDeg.toFixed(2)}°
          </span>
        </div>

        <button
          type="button"
          className="nav__burger"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close section menu' : 'Open section menu'}
          onClick={() => setOpen((value) => !value)}
        >
          <span className={open ? 'is-open' : ''} />
          <span className={open ? 'is-open' : ''} />
        </button>
      </div>

      <div className="nav__section-bar">
        <div className="shell nav__section-inner">
          <span className="section-index">{active.index}</span>
          <span className="nav__section-title">{active.title}</span>
          <span className="nav__section-sub">{active.subtitle}</span>
        </div>
      </div>

      {open && (
        <div className="nav__mobile" id="mobile-nav">
          <nav aria-label="Mobile section menu">
            {ROUTES.map((route) => (
              <NavLink
                key={route.path}
                to={route.path}
                end={route.path === '/'}
                className={({ isActive }) => `nav__mobile-link${isActive ? ' is-active' : ''}`}
              >
                <span className="section-index">{route.index}</span>
                <span>
                  <strong>{route.label}</strong>
                  <small>{route.subtitle}</small>
                </span>
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
