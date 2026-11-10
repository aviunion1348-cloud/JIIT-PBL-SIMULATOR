import { Link } from 'react-router-dom';
import { MATERIALS, MATERIAL_MAP, sampledMinimum } from '../data/observations';
import { AIM, REPORTED_RESULTS, SOURCE_CITATION, SOURCE_CONCLUSION } from '../data/results';
import { printReport } from '../export/report';
import { useExperiment } from '../experiment/experimentStore';
import './results.css';

export default function ResultsPage() {
  const { notify } = useExperiment();

  return (
    <div className="shell page results">
      <header className="page__head">
        <p className="eyebrow">SECTION 06 · RESULTS</p>
        <h1 className="display page__title">THE POLARISING CONDITION</h1>
        <p className="lede">
          Three angles, each obtained from the minimum-current region of its own observation set.
          These are the results reported in the supplied document.
        </p>
      </header>

      <div className="results__cards">
        {REPORTED_RESULTS.map((reported, index) => {
          const material = MATERIAL_MAP[reported.materialKey];
          const minimum = sampledMinimum(material);
          return (
            <article
              key={reported.materialKey}
              className="result-hero panel bracketed"
              style={{ animationDelay: `${index * 110}ms` }}
            >
              <div className="result-hero__head">
                <span className="label">{material.shortName} GLASS</span>
                <span className="chip chip--amber">SOURCE REPORTED</span>
              </div>
              <p className="result-hero__value numeric">{reported.display}</p>
              <p className="result-hero__sub">
                Brewster angle θ<sub>B</sub> measured from the surface normal
              </p>
              <div className="result-hero__rows">
                <div>
                  <span>Trough in the record</span>
                  <span className="mono">{minimum.angleDeg}° · I = {minimum.currentA.toFixed(4)} A</span>
                </div>
                <div>
                  <span>Inferred index (n₁ = 1)</span>
                  <span className="mono">n₂ ≈ {material.effectiveIndexAirCalibration.toFixed(4)}</span>
                </div>
                <div>
                  <span>tan θ<sub>B</sub> check</span>
                  <span className="mono">
                    {Math.tan((material.sourceReportedBrewsterAngleDeg * Math.PI) / 180).toFixed(4)}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <section className="results__explain panel bracketed">
        <div className="panel-head">
          <h3>WHAT THE RESULT MEANS</h3>
          <span className="chip">PHYSICAL READING</span>
        </div>
        <div className="panel-body results__explain-body">
          <div>
            <h4 className="results__sub">THE P COMPONENT VANISHES</h4>
            <p>
              At each reported angle the p-polarised (parallel) reflected component approaches zero in
              the ideal dielectric model. The reflected beam is left purely s-polarised. This is the
              maximum-polarisation condition the experiment set out to find.
            </p>
            <h4 className="results__sub">THE RAYS MEET AT 90°</h4>
            <p>
              At Brewster incidence the reflected and refracted rays are perpendicular. Substitute
              θ<sub>B</sub> into Snell's law and the geometry collapses to θ<sub>r</sub> + θ
              <sub>t</sub> = 90°. This is the geometric form of Brewster's law that the supplied
              explanation uses.
            </p>
          </div>
          <div>
            <h4 className="results__sub">TOTAL REFLECTION IS NOT ZERO</h4>
            <p>
              For unpolarised incident light the total reflected intensity does not fall to zero,
              because the s component still reflects strongly. In the source data this appears as a
              minimum near 1.06–1.14 rather than a null — consistent, not contradictory.
            </p>
            <h4 className="results__sub">REPORTED Vs SAMPLED</h4>
            <p>
              The 5° sampling grid gives minima at {MATERIALS.map((material) => `${sampledMinimum(material).angleDeg}°`).join(', ')}{' '}
              for the three specimens, while the document reports{' '}
              {REPORTED_RESULTS.map((reported) => reported.display).join(', ')}. The source does not
              describe its interpolation; this simulator therefore preserves both and never
              overwrites one with the other.
            </p>
          </div>
        </div>
      </section>

      <section className="results__conclusion panel">
        <div className="panel-head">
          <h3>CONCLUSION — VERBATIM FROM THE SOURCE</h3>
          <span className="chip chip--amber">UNEDITED</span>
        </div>
        <div className="panel-body">
          <blockquote className="results__quote">{SOURCE_CONCLUSION}</blockquote>
          <p className="note" style={{ marginTop: 'var(--sp-3)' }}>{SOURCE_CITATION}</p>
        </div>
      </section>

      <section className="results__aim panel">
        <div className="panel-body">
          <p className="label">STATED AIM</p>
          <p className="results__aim-text">“{AIM}”</p>
        </div>
      </section>

      <section className="results__actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            printReport();
            notify('Report opened in the browser print dialog — choose “Save as PDF” to export.');
          }}
        >
          PRINT / SAVE REPORT AS PDF
        </button>
        <Link to="/experiment" className="btn">RE-OPEN THE BENCH</Link>
        <Link to="/observations" className="btn btn--ghost">SOURCE RECORD</Link>
        <Link to="/analysis" className="btn btn--ghost">GRAPH ANALYSIS</Link>
      </section>
    </div>
  );
}
