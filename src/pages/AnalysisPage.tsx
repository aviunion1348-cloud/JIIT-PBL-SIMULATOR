import { useMemo, useState } from 'react';
import { MATERIALS, MATERIAL_MAP, sampledMinimum, INCIDENCE_ANGLES } from '../data/observations';
import { ObservationChart } from '../components/graphics/ObservationChart';
import { interpolateMinimum } from '../experiment/measurements';
import type { MaterialKey } from '../physics/types';
import './analysis.css';

type Mode = 'topaz' | 'crown' | 'flint' | 'compare';

export default function AnalysisPage() {
  const [mode, setMode] = useState<Mode>('compare');
  const [showFit, setShowFit] = useState(false);

  const visible = useMemo(
    () => (mode === 'compare' ? MATERIALS : [MATERIAL_MAP[mode as MaterialKey]]),
    [mode],
  );

  const fits = useMemo(
    () =>
      MATERIALS.map((material) => ({
        material,
        fit: interpolateMinimum(material.observations),
        minimum: sampledMinimum(material),
      })),
    [],
  );

  return (
    <div className="shell page analysis">
      <header className="page__head">
        <p className="eyebrow">SECTION 05 · ANALYSIS</p>
        <h1 className="display page__title">CURRENT RESPONSE / INCIDENCE ANGLE</h1>
        <p className="lede">
          The recorded current collapses toward a minimum around 55°–60° and recovers on either side.
          That trough is the experimental signature of the polarising condition — the reflected beam
          is losing its p component.
        </p>
      </header>

      <div className="analysis__bar">
        <div className="analysis__modes" role="group" aria-label="Chart mode">
          <button type="button" className={`chip${mode === 'topaz' ? ' is-active' : ''}`} onClick={() => setMode('topaz')} aria-pressed={mode === 'topaz'}>TOPAZ</button>
          <button type="button" className={`chip${mode === 'crown' ? ' is-active' : ''}`} onClick={() => setMode('crown')} aria-pressed={mode === 'crown'}>CROWN</button>
          <button type="button" className={`chip${mode === 'flint' ? ' is-active' : ''}`} onClick={() => setMode('flint')} aria-pressed={mode === 'flint'}>FLINT</button>
          <button type="button" className={`chip${mode === 'compare' ? ' is-active' : ''}`} onClick={() => setMode('compare')} aria-pressed={mode === 'compare'}>COMPARE ALL</button>
        </div>
        <label className="analysis__toggle">
          <input type="checkbox" checked={showFit} onChange={(event) => setShowFit(event.target.checked)} />
          Show simulator vertex fit (not a source measurement)
        </label>
      </div>

      <section className="panel bracketed analysis__chart-panel">
        <div className="panel-head">
          <h3>{mode === 'compare' ? 'ALL SPECIMENS' : MATERIAL_MAP[mode as MaterialKey].name.toUpperCase()}</h3>
          <span className="chip chip--amber">SOURCE OBSERVATIONS · 19 POINTS PER MATERIAL</span>
        </div>
        <div className="panel-body">
          <ObservationChart
            materials={visible}
            highlightKey={mode === 'compare' ? 'topaz' : mode}
            showBrewsterMarkers
            showFit={showFit}
            height={400}
          />
          <p className="note" style={{ marginTop: 'var(--sp-3)' }}>
            Connecting lines join consecutive 5° samples; no extra measurements are invented between
            them. The amber dashed verticals are the angles <em>reported</em> by the source document,
            not values derived here.
          </p>
        </div>
      </section>

      <div className="analysis__grid">
        {fits.map(({ material, fit, minimum }) => (
          <article key={material.key} className="panel analysis__card">
            <div className="spread">
              <span className="label">{material.shortName} GLASS</span>
              <span className="chip chip--amber">{material.sourceReportedBrewsterAngleDeg}°</span>
            </div>
            <div className="analysis__card-rows">
              <div>
                <span className="readout__label">MINIMUM SAMPLED</span>
                <span className="mono analysis__card-value">{minimum.angleDeg}°</span>
                <span className="note">at I = {minimum.currentA.toFixed(4)} A</span>
              </div>
              <div>
                <span className="readout__label">SIMULATOR VERTEX FIT</span>
                <span className="mono analysis__card-value analysis__card-value--fit">
                  {fit ? `${fit.angleDeg.toFixed(2)}°` : '—'}
                </span>
                <span className="note">labelled analysis, not source</span>
              </div>
              <div>
                <span className="readout__label">REPORTED BY SOURCE</span>
                <span className="mono analysis__card-value analysis__card-value--reported">
                  {material.sourceReportedBrewsterAngleDeg}°
                </span>
                <span className="note">authoritative</span>
              </div>
            </div>
            <p className="note analysis__card-note">
              Fit offset from the report: {fit ? `${(fit.angleDeg - material.sourceReportedBrewsterAngleDeg).toFixed(2)}°` : '—'}.
              The document does not state how it interpolated between the 5° samples, so the reported
              value stands as the result.
            </p>
          </article>
        ))}
      </div>

      <section className="panel analysis__interpretation">
        <div className="panel-head">
          <h3>INTERPRETATION</h3>
          <span className="chip">READ THE TROUGH</span>
        </div>
        <div className="panel-body analysis__interpretation-body">
          <div>
            <h4 className="analysis__sub">WHY THE CURRENT FALLS</h4>
            <p>
              The detector collects the reflected beam. As the incidence angle approaches the
              polarising angle, the p-polarised share of the reflected light is progressively
              suppressed, so the collected intensity — and the recorded current — passes through a
              minimum. Beyond θ<sub>B</sub> the p component returns with reversed sign and the signal
              climbs again.
            </p>
            <h4 className="analysis__sub">WHY IT DOES NOT REACH ZERO</h4>
            <p>
              The reflection is not extinguished. The s-polarised component still reflects with a
              substantial Fresnel coefficient, which is why the minimum sits near 1.06–1.14 in the
              source units rather than at the origin. A true null would require an s-polarised
              suppressor as well — that is what the analyser is for.
            </p>
          </div>
          <div>
            <h4 className="analysis__sub">WHY THE MINIMUM IS NOT THE REPORT</h4>
            <p>
              The samples are spaced by 5°, so the true minimum falls between two table rows. The
              closest sampled minima are {sampledMinimum(MATERIAL_MAP.topaz).angleDeg}° (Topaz),{' '}
              {sampledMinimum(MATERIAL_MAP.crown).angleDeg}° (Crown) and{' '}
              {sampledMinimum(MATERIAL_MAP.flint).angleDeg}° (Flint). The document instead reports
              58.1°, 56.7° and 57.51°, which requires some interpolation the document does not
              describe.
            </p>
            <p className="callout">
              The {INCIDENCE_ANGLES.length}-point grid cannot resolve better than ±2.5° by sampling
              alone. Any finer value is a modelling decision — which is exactly why this simulator
              labels its own parabola fit as derived, and never replaces the reported result.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
