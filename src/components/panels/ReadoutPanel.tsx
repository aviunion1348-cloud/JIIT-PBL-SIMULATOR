import type { OpticalResult } from '../../physics/types';
import { MATERIAL_MAP } from '../../data/observations';
import './panels.css';

interface Props {
  readonly result: OpticalResult;
  readonly laserOn: boolean;
  readonly atBrewster: boolean;
}

/** Live theoretical values. Everything here is simulator-derived, never source data. */
export function ReadoutPanel({ result, laserOn, atBrewster }: Props) {
  const material = result.materialKey ? MATERIAL_MAP[result.materialKey] : null;
  const degreePct = result.polarisation.degreeOfPolarisation * 100;

  return (
    <div className="readout-panel">
      <div className="readout-panel__grid">
        <div className="readout">
          <span className="readout__label">INCIDENCE / NORMAL</span>
          <span className="readout__value">
            {result.incidenceDeg.toFixed(1)}
            <small>°</small>
          </span>
        </div>
        <div className="readout">
          <span className="readout__label">REFLECTED COMPONENT</span>
          <span className="readout__value">
            {result.reflectionDeg.toFixed(1)}
            <small>°</small>
          </span>
        </div>
        <div className="readout">
          <span className="readout__label">TRANSMITTED COMPONENT</span>
          <span className="readout__value readout__value--cyan">
            {result.refractionDeg === null ? 'TIR' : `${result.refractionDeg.toFixed(1)}°`}
          </span>
        </div>
        <div className={`readout readout--amber${atBrewster ? ' is-hot' : ''}`}>
          <span className="readout__label">BREWSTER REFERENCE</span>
          <span className="readout__value">
            {result.brewster.brewsterAngleDeg.toFixed(2)}
            <small>°</small>
          </span>
        </div>
      </div>

      <div className="fresnel-block">
        <div className="spread">
          <span className="label">LIVE FRESNEL RESPONSE</span>
          <span className="mono tiny muted">
            n₁ {result.n1.toFixed(3)} → n₂ {result.n2.toFixed(4)}
          </span>
        </div>

        <FresnelBar label="Rs · perpendicular" value={result.fresnel.Rs} tone="cyan" />
        <FresnelBar label="Rp · parallel" value={result.fresnel.Rp} tone="red" />
        <FresnelBar
          label="R unpolarised"
          value={result.fresnel.RUnpolarised}
          tone="amber"
          hint="(Rs + Rp) / 2"
        />

        {result.fresnel.Rp < 0.002 && (
          <p className="fresnel-block__flag">
            p-polarised reflection suppressed — reflected ray is{' '}
            {(result.polarisation.reflectedSFraction * 100).toFixed(1)}% s-polarised
          </p>
        )}
      </div>

      <div className="polar-block">
        <span className="label">POLARISATION STATE</span>
        <div className="polar-block__rows">
          <span>
            <em>s</em> share
            <span className="mono">{(result.polarisation.reflectedSFraction * 100).toFixed(2)}%</span>
          </span>
          <span>
            <em>p</em> share
            <span className="mono">{(result.polarisation.reflectedPFraction * 100).toFixed(2)}%</span>
          </span>
          <span>
            degree of polarisation
            <span className={`mono${degreePct > 99 ? ' is-hot' : ''}`}>{degreePct.toFixed(2)}%</span>
          </span>
        </div>
        <div className="polar-block__bar" aria-hidden="true">
          <span
            className="polar-block__bar-s"
            style={{ width: `${result.polarisation.reflectedSFraction * 100}%` }}
          />
          <span
            className="polar-block__bar-p"
            style={{ width: `${result.polarisation.reflectedPFraction * 100}%` }}
          />
        </div>
      </div>

      <div className={`detector-block${laserOn ? ' is-live' : ''}`}>
        <div className="spread">
          <span className="label">DETECTOR MODEL</span>
          <span className={`chip ${laserOn ? 'chip--live' : 'chip--off'}`}>
            {laserOn ? 'ACQUIRING' : 'NO ACQUISITION'}
          </span>
        </div>
        {laserOn ? (
          <>
            <p className="detector-block__signal numeric">
              {result.detector.normalisedSignal.toFixed(5)}
              <small>normalised</small>
            </p>
            <div className="detector-block__bar">
              <span style={{ width: `${result.detector.normalisedSignal * 100}%` }} />
            </div>
            <p className="note">
              Normalised theoretical signal (incident beam = 1). This is a model output — the source
              supplies no responsivity or gain, so no amperes are claimed.
            </p>
            {result.detector.calibratedMicroAmps !== null && (
              <p className="detector-block__calibrated mono">
                {result.detector.calibratedMicroAmps.toFixed(3)} µA ·{' '}
                {result.detector.calibratedMilliVolts?.toFixed(3)} mV
                <small> exclusively from your stated calibration assumptions</small>
              </p>
            )}
          </>
        ) : (
          <p className="detector-block__idle">
            Detector dark. Switch the laser on to begin acquisition — no plausible reading is shown
            while the source is off.
          </p>
        )}
      </div>

      <p className="readout-panel__provenance">
        <strong>{material?.name ?? 'Specimen'}</strong> · n₂ is the inferred effective index
        n₂ = n₁·tan θ<sub>B</sub>, not an independent material measurement. Source observations are
        never modified by these controls.
      </p>
    </div>
  );
}

function FresnelBar({
  label,
  value,
  tone,
  hint,
}: {
  readonly label: string;
  readonly value: number;
  readonly tone: 'cyan' | 'red' | 'amber';
  readonly hint?: string;
}) {
  const pct = Math.min(1, Math.max(0, value)) * 100;
  return (
    <div className={`fresnel-bar fresnel-bar--${tone}`}>
      <div className="fresnel-bar__head">
        <span className="fresnel-bar__label">{label}</span>
        <span className="fresnel-bar__value mono">{value.toFixed(5)}</span>
      </div>
      <div className="fresnel-bar__track">
        <span style={{ width: `${pct}%` }} />
      </div>
      {hint && <span className="fresnel-bar__hint mono">{hint}</span>}
    </div>
  );
}
