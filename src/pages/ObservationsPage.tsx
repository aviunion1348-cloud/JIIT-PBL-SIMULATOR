import { useMemo, useState } from 'react';
import {
  CURRENT_UNIT,
  INCIDENCE_ANGLES,
  MATERIALS,
  MATERIAL_MAP,
  TOTAL_SOURCE_READINGS,
  sampledMinimum,
} from '../data/observations';
import { REPORTED_RESULTS } from '../data/results';
import { buildMaterialCsv, buildSourceCsv, downloadFile } from '../export/csv';
import { useExperiment } from '../experiment/experimentStore';
import type { MaterialKey } from '../physics/types';
import './observations.css';

type Filter = 'all' | MaterialKey;

export default function ObservationsPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [highlightMinima, setHighlightMinima] = useState(true);
  const { notify } = useExperiment();

  const rows = useMemo(
    () =>
      INCIDENCE_ANGLES.map((angleDeg, index) => ({
        angleDeg,
        serial: index + 1,
        values: MATERIALS.map((material) => material.observations[index].currentA),
      })),
    [],
  );

  const visibleMaterials = filter === 'all' ? MATERIALS : [MATERIAL_MAP[filter]];
  const minima = useMemo(
    () => new Map(MATERIALS.map((material) => [material.key, sampledMinimum(material)])),
    [],
  );

  return (
    <div className="shell page observations">
      <header className="page__head">
        <p className="eyebrow">SECTION 04 · OBSERVATIONS</p>
        <h1 className="display page__title">SOURCE LAB RECORD</h1>
        <p className="lede">
          Every reading transcribed from the supplied experiment document: {INCIDENCE_ANGLES.length}{' '}
          incidence angles, {MATERIALS.length} specimens, {TOTAL_SOURCE_READINGS} recorded values.
          These numbers are immutable — no control in this simulator can alter them.
        </p>
      </header>

      <div className="observations__bar">
        <div className="observations__filters" role="group" aria-label="Filter by material">
          <button
            type="button"
            className={`chip${filter === 'all' ? ' is-active' : ''}`}
            onClick={() => setFilter('all')}
            aria-pressed={filter === 'all'}
          >
            ALL MATERIALS
          </button>
          {MATERIALS.map((material) => (
            <button
              key={material.key}
              type="button"
              className={`chip${filter === material.key ? ' is-active' : ''}`}
              onClick={() => setFilter(material.key)}
              aria-pressed={filter === material.key}
            >
              {material.shortName}
            </button>
          ))}
        </div>
        <div className="observations__actions">
          <label className="observations__toggle">
            <input
              type="checkbox"
              checked={highlightMinima}
              onChange={(event) => setHighlightMinima(event.target.checked)}
            />
            Highlight sampled minima
          </label>
          <button
            type="button"
            className="btn btn--sm btn--primary"
            onClick={() => {
              downloadFile('brewster-source-observations.csv', buildSourceCsv());
              notify('Source observation CSV downloaded.');
            }}
          >
            EXPORT CSV
          </button>
          {filter !== 'all' && (
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              onClick={() => {
                downloadFile(`${filter}-glass-observations.csv`, buildMaterialCsv(filter));
                notify(`${MATERIAL_MAP[filter].name} CSV downloaded.`);
              }}
            >
              EXPORT {MATERIAL_MAP[filter].shortName}
            </button>
          )}
        </div>
      </div>

      <p className="observations__label">
        <span className="chip chip--amber">SOURCE DATA</span>
        Column heading preserved exactly from the document:{' '}
        <strong className="mono">{CURRENT_UNIT}</strong>. No unit conversion has been applied.
      </p>

      <div className="data-table-wrap observations__table">
        <table className="data-table">
          <caption className="sr-only">
            Source observations: current in amperes against angle of incidence for Topaz, Crown and
            Flint glass.
          </caption>
          <thead>
            <tr>
              <th scope="col">Sr No.</th>
              <th scope="col">Angle of Incidence (°)</th>
              {visibleMaterials.map((material) => (
                <th key={material.key} scope="col">
                  {material.name}
                  <span className="observations__th-unit">{CURRENT_UNIT}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isMinimumRow = visibleMaterials.some(
                (material) =>
                  highlightMinima && minima.get(material.key)?.angleDeg === row.angleDeg,
              );
              return (
                <tr key={row.angleDeg} className={isMinimumRow ? 'is-minimum' : undefined}>
                  <td>{row.serial}</td>
                  <td>{row.angleDeg}</td>
                  {visibleMaterials.map((material) => {
                    const index = MATERIALS.findIndex((item) => item.key === material.key);
                    const value = row.values[index];
                    const isMinimum = minima.get(material.key)?.angleDeg === row.angleDeg;
                    return (
                      <td key={material.key}>
                        {value.toFixed(4)}
                        {isMinimum && highlightMinima && (
                          <span className="observations__min-tag">MIN</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="observations__summaries">
        {visibleMaterials.map((material) => {
          const minimum = minima.get(material.key)!;
          return (
            <article key={material.key} className="panel observations__summary">
              <div className="spread">
                <span className="label">{material.shortName} GLASS</span>
                <span className="chip chip--amber">REPORTED {material.sourceReportedBrewsterAngleDeg}°</span>
              </div>
              <div className="observations__summary-grid">
                <div>
                  <span className="readout__label">MINIMUM SAMPLED READING</span>
                  <p className="observations__summary-value numeric">
                    {minimum.angleDeg}
                    <small>°</small>
                  </p>
                  <span className="note">serial {minimum.serial}</span>
                </div>
                <div>
                  <span className="readout__label">CURRENT AT MINIMUM</span>
                  <p className="observations__summary-value numeric observations__summary-value--amber">
                    {minimum.currentA.toFixed(4)}
                    <small>A</small>
                  </p>
                  <span className="note">as printed</span>
                </div>
              </div>
              <p className="note">
                The tabulated minimum sits at {minimum.angleDeg}°, while the document reports{' '}
                {material.sourceReportedBrewsterAngleDeg}° as the Brewster angle. The two are kept
                deliberately separate: the source does not state the interpolation it used.
              </p>
            </article>
          );
        })}
      </section>

      <section className="panel observations__official">
        <div className="panel-head">
          <h3>OFFICIAL REPORTED RESULTS</h3>
          <span className="chip">FROM THE DOCUMENT</span>
        </div>
        <div className="panel-body">
          <div className="observations__official-grid">
            {REPORTED_RESULTS.map((reported) => (
              <div key={reported.materialKey} className="observations__official-item">
                <span className="label">{reported.label}</span>
                <span className="observations__official-value numeric">{reported.display}</span>
              </div>
            ))}
          </div>
          <p className="note" style={{ marginTop: 'var(--sp-4)' }}>
            These three values are the authoritative results of the source experiment. They are never
            recomputed, never curve-fitted by this simulator, and never overwritten by any live
            control.
          </p>
        </div>
      </section>
    </div>
  );
}
