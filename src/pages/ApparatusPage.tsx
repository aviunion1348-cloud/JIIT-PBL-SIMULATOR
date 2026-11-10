import { useState } from 'react';
import { Link } from 'react-router-dom';
import { APPARATUS, RAIL_LENGTH_MM, type ComponentId } from '../experiment/apparatus';
import { ComponentArt } from '../components/graphics/ComponentArt';
import { useExperiment } from '../experiment/experimentStore';
import './apparatus.css';

export default function ApparatusPage() {
  const { state } = useExperiment();
  const [selected, setSelected] = useState<ComponentId>('laser-supply');
  const active = APPARATUS.find((component) => component.id === selected) ?? APPARATUS[0];

  return (
    <div className="shell page apparatus">
      <header className="page__head">
        <p className="eyebrow">SECTION 02 · APPARATUS</p>
        <h1 className="display page__title">THE OPTICAL TRAIN</h1>
        <p className="lede">
          Seven components, exactly as listed in the supplied experiment. Select any mount to read
          what it does on the bench and where it sits along the {RAIL_LENGTH_MM} mm rail.
        </p>
      </header>

      <section className="rail-map panel bracketed" aria-label="Optical rail layout">
        <div className="spread rail-map__head">
          <span className="label">RAIL LAYOUT · {RAIL_LENGTH_MM} mm · 10 mm GRADUATIONS</span>
          <span className="chip chip--live">SCALE 1 : 1</span>
        </div>
        <div className="rail-map__track">
          {APPARATUS.filter((component) => component.railPositionMm !== null).map((component) => {
            const placed = state.apparatus.placedComponentIds.includes(component.id);
            return (
              <button
                key={component.id}
                type="button"
                className={`rail-map__pin${placed ? ' is-placed' : ''}${selected === component.id ? ' is-selected' : ''}`}
                style={{ left: `${((component.railPositionMm ?? 0) / RAIL_LENGTH_MM) * 100}%` }}
                onClick={() => setSelected(component.id)}
                title={`${component.name} — ${component.railPositionMm} mm`}
                aria-label={`Select ${component.name} at ${component.railPositionMm} millimetres`}
              >
                <span className="rail-map__pin-dot" />
                <span className="rail-map__pin-label">
                  <span className="mono">{component.index}</span> {component.shortName}
                </span>
              </button>
            );
          })}
          {Array.from({ length: 11 }, (_, i) => (
            <span key={i} className="rail-map__tick" style={{ left: `${i * 10}%` }}>
              <span className="mono">{i * 50}</span>
            </span>
          ))}
        </div>
        <p className="note">
          The rail itself is a reference surface: every mount position above is measured from its
          zero mark in millimetres.
        </p>
      </section>

      <div className="apparatus__layout">
        <ol className="apparatus__list" aria-label="Apparatus components">
          {APPARATUS.map((component) => (
            <li key={component.id}>
              <button
                type="button"
                className={`apparatus__item${selected === component.id ? ' is-selected' : ''}`}
                onClick={() => setSelected(component.id)}
                aria-pressed={selected === component.id}
              >
                <span className="apparatus__item-index mono">
                  {String(component.index).padStart(2, '0')}
                </span>
                <span className="apparatus__item-body">
                  <strong>{component.name}</strong>
                  <small>{component.specification}</small>
                </span>
                <span
                  className={`apparatus__item-state${state.apparatus.placedComponentIds.includes(component.id) ? ' is-placed' : ''}`}
                  aria-label={
                    state.apparatus.placedComponentIds.includes(component.id)
                      ? 'On the rail'
                      : 'Not on the rail'
                  }
                />
              </button>
            </li>
          ))}
        </ol>

        <article className="apparatus__detail panel bracketed" aria-live="polite">
          <div className="apparatus__detail-art">
            <ComponentArt id={active.id} />
          </div>
          <div className="apparatus__detail-body">
            <div className="spread">
              <span className="chip chip--amber">COMPONENT {active.index} OF 7</span>
              {active.railPositionMm !== null ? (
                <span className="chip">
                  RAIL {active.railPositionMm} mm
                </span>
              ) : (
                <span className="chip">SPANS 0–{RAIL_LENGTH_MM} mm</span>
              )}
            </div>
            <h2 className="display apparatus__detail-title">{active.name}</h2>
            <p className="apparatus__spec mono">{active.specification}</p>
            <div className="apparatus__detail-grid">
              <div>
                <p className="label">FUNCTION</p>
                <p>{active.function}</p>
              </div>
              <div>
                <p className="label">ON THE BENCH</p>
                <p className="secondary">{active.description}</p>
              </div>
            </div>
            <div className="apparatus__detail-actions">
              <Link to="/experiment" className="btn btn--sm btn--primary">
                PLACE IT IN THE LIVE BENCH →
              </Link>
              <span className="note">
                {state.apparatus.placedComponentIds.includes(active.id)
                  ? 'Currently seated on the rail.'
                  : 'Not currently on the rail — assemble it in the live experiment.'}
              </span>
            </div>
          </div>
        </article>
      </div>

      <section className="apparatus__notes">
        <div className="panel apparatus__note-card">
          <p className="label">SOURCE SPECIFICATION — LASER</p>
          <p className="numeric apparatus__note-value">650 nm · 3 mW · RED</p>
          <p className="note">
            The experiment is run with this red diode source. Brewster's equation contains no
            wavelength term once the indices are fixed, but real materials disperse — any
            wavelength-dependence enters through n(λ), not through the law itself.
          </p>
        </div>
        <div className="panel apparatus__note-card">
          <p className="label">WHY A GONIOMETER</p>
          <p className="numeric apparatus__note-value">θ measured from the normal</p>
          <p className="note">
            A fixed rail cannot measure an angle. The goniometer arm gives the reflected beam a
            graduated angular scale, which is what turns a bright spot into a defensible value of
            θ<sub>B</sub>.
          </p>
        </div>
        <div className="panel apparatus__note-card">
          <p className="label">WHY A PINHOLE</p>
          <p className="numeric apparatus__note-value">specular beam only</p>
          <p className="note">
            The pinhole restricts the detector's field of view so stray light and scatter are
            rejected. The recorded quantity is labelled, exactly as in the source,
            “Current (I) in A”.
          </p>
        </div>
      </section>
    </div>
  );
}
