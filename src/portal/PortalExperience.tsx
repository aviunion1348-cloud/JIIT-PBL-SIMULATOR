import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PORTAL_DESTINATIONS } from '../data/portal';
import { usePortalExperience } from './usePortalExperience';
import { CustomCursor } from './CustomCursor';
import './portal.css';

interface Props {
  /** Called with the destination route when a travel commits. */
  readonly onArrive?: (route: string) => void;
}

/**
 * THE OPTICAL PORTAL — the laboratory's front door.
 *
 * A canvas aperture holds a live procedural optics scene. Tilt it with the
 * pointer, then travel: the window expands to swallow the screen, the scene
 * commits, and a fresh aperture opens on the next section.
 *
 * Every destination is a real route, every "subtopic" is a real topic of that
 * section, and nothing is decorative filler. Keyboard users get the whole
 * navigator without ever touching the canvas.
 */
export function PortalExperience({ onArrive }: Props) {
  const api = usePortalExperience(onArrive);
  const liveRef = useRef<HTMLParagraphElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const { destination, nextDestination, phase, progress, reducedMotion, revision } = api;

  const ready = phase === 'ready' || phase === 'transitioning';

  // Retrigger the rail's stagger without remounting it — remounting would drop
  // keyboard focus every time a section is activated.
  useEffect(() => {
    const list = listRef.current;
    if (!list || phase === 'booting') return;
    list.classList.remove('is-switching');
    // Force a reflow so the animation can restart.
    void list.offsetWidth;
    list.classList.add('is-switching');
  }, [revision, phase]);

  // Announce destination changes for assistive technology.
  useEffect(() => {
    if (phase !== 'ready' || !liveRef.current) return;
    liveRef.current.textContent = `Now showing ${destination.name}. Next destination ${nextDestination.name}.`;
  }, [destination.name, nextDestination.name, phase, revision]);

  // Arrow keys walk the destination ring; Enter travels.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /INPUT|SELECT|TEXTAREA/.test(target.tagName)) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        api.selectIndex((api.currentIndex + 1) % PORTAL_DESTINATIONS.length);
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        api.selectIndex((api.currentIndex - 1 + PORTAL_DESTINATIONS.length) % PORTAL_DESTINATIONS.length);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [api]);

  return (
    <section
      className={`portal-exp portal-exp--${phase}${ready ? ' is-ready' : ''}`}
      aria-label="Laboratory portal navigator"
      data-destination={destination.key}
    >
      {/* ---------------- procedural scene + aperture ---------------- */}
      <canvas ref={api.canvasRef} className="portal-exp__canvas" aria-hidden="true" />
      <div className="portal-exp__shade" aria-hidden="true" />

      {/* ---------------- boot veil ---------------- */}
      {phase === 'booting' && (
        <div className="portal-exp__boot" role="status" aria-live="polite">
          <div className="portal-exp__boot-inner">
            <span className="portal-exp__boot-kicker">OPTICAL BENCH · CALIBRATING</span>
            <div className="portal-exp__boot-count">
              <span className="portal-exp__boot-value">{progress}</span>
              <span className="portal-exp__boot-percent">%</span>
            </div>
            <div className="portal-exp__boot-track" aria-hidden="true">
              <span style={{ width: `${progress}%` }} />
            </div>
            <button type="button" className="portal-exp__skip" onClick={api.skipBoot}>
              SKIP
            </button>
          </div>
        </div>
      )}

      {/* ---------------- chrome ----------------
          Mounted only after the boot veil lifts: otherwise the entrance
          animations would play to completion hidden behind it. */}
      {phase !== 'booting' && (
        <>
      <header className="portal-exp__header chrome">
        <Link to="/" className="portal-exp__brand" aria-label="Brewster's Law Lab home">
          <span className="portal-exp__mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="26" height="26">
              <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(127,228,251,0.3)" strokeWidth="1" />
              <line x1="4" y1="26" x2="16" y2="14" stroke="#ff5f5f" strokeWidth="2.4" strokeLinecap="round" />
              <line x1="16" y1="14" x2="27" y2="6" stroke="#ff8a8a" strokeWidth="2.4" strokeLinecap="round" />
              <line x1="16" y1="14" x2="25" y2="26" stroke="#3fd0f0" strokeWidth="2.4" strokeLinecap="round" />
              <circle cx="16" cy="14" r="2.4" fill="#e8fbff" />
            </svg>
          </span>
          <span className="portal-exp__brand-text">
            <strong>BREWSTER'S LAW</strong>
            <small>OPTICAL LABORATORY</small>
          </span>
        </Link>

        <div className="portal-exp__header-actions">
          <span className="portal-exp__chip">650 nm · 3 mW</span>
          <button
            type="button"
            className="portal-exp__enter"
            data-cursor-label="BEGIN"
            onClick={() => onArrive?.('/experiment')}
          >
            SKIP TO THE BENCH
          </button>
        </div>
      </header>

      {/* ---------------- destination rail ---------------- */}
      <nav className="portal-exp__rail chrome" aria-label="Laboratory sections">
        <p className="portal-exp__rail-title">SECTIONS</p>
        <ol ref={listRef} className="portal-exp__list">
          {PORTAL_DESTINATIONS.map((entry, index) => {
            const active = index === api.currentIndex;
            return (
              <li key={entry.key}>
                <button
                  type="button"
                  className={`portal-exp__item${active ? ' is-active' : ''}`}
                  onClick={() => api.selectIndex(index)}
                  aria-current={active ? 'true' : undefined}
                  data-cursor-label="OPEN"
                >
                  <span className="portal-exp__item-index">{entry.index}</span>
                  <span className="portal-exp__item-name">{entry.name}</span>
                  {active && <span className="portal-exp__item-dot" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* ---------------- the aperture ---------------- */}
      <div className="portal-exp__aperture chrome">
        <div className="portal-exp__caption">
          <span className="portal-exp__caption-label">NEXT DESTINATION</span>
          <span className="portal-exp__caption-value">
            <span className="mono">{nextDestination.index}</span>
            <strong>{nextDestination.name}</strong>
          </span>
        </div>
        <button
          ref={api.portalRef}
          type="button"
          className="portal-exp__button"
          onClick={api.travel}
          aria-label={`Travel to ${nextDestination.name}`}
          data-cursor-label="TRAVEL"
          data-cursor="enter"
          disabled={!ready}
        >
          <span className="portal-exp__button-hint">
            <span className="portal-exp__button-ring" aria-hidden="true" />
            <span>CLICK TO TRAVEL</span>
          </span>
        </button>
      </div>

      {/* ---------------- destination content ---------------- */}
      <div className="portal-exp__content chrome">
        <div className="portal-exp__title-block">
          <p className="portal-exp__kicker">{destination.kicker}</p>
          <h1 key={`${destination.key}-title`} className="portal-exp__title">
            {destination.name}
          </h1>
          <div className="portal-exp__meta">
            <span className="mono">{destination.index}</span>
            <span className="portal-exp__meta-divider" aria-hidden="true" />
            <span>{destination.kicker}</span>
          </div>
        </div>

        <div className="portal-exp__side">
          <dl key={`${destination.key}-facts`} className="portal-exp__facts">
            {destination.subtopics.map((subtopic, index) => (
              <div
                className="portal-exp__fact"
                key={subtopic.term}
                style={{ animationDelay: `${520 + index * 160}ms` }}
              >
                <dt>{subtopic.term}</dt>
                <dd>{subtopic.detail}</dd>
              </div>
            ))}
          </dl>

          <div className="portal-exp__actions">
            <Link
              to={destination.route}
              className="portal-exp__action portal-exp__action--primary"
              data-cursor-label="ENTER"
            >
              {destination.action}
              <span aria-hidden="true">→</span>
            </Link>
            <Link to="/theory" className="portal-exp__action" data-cursor-label="OPEN">
              THEORY
            </Link>
            <Link to="/results" className="portal-exp__action" data-cursor-label="OPEN">
              RESULTS
            </Link>
          </div>
        </div>
      </div>

        </>
      )}

      <p className="sr-only" ref={liveRef} aria-live="polite" />

      <CustomCursor enterLabel={reducedMotion ? 'ENTER' : 'TRAVEL'} />
    </section>
  );
}
