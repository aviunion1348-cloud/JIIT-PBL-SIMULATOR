import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OpticalBench } from '../components/graphics/OpticalBench';
import { RayDiagram } from '../components/graphics/RayDiagram';
import { AngleSlider, LabSelect, Segmented, Toggle } from '../components/controls/AngleSlider';
import { AngularDial } from '../components/controls/AngularDial';
import { AssemblyPanel } from '../components/controls/AssemblyPanel';
import { ReadoutPanel } from '../components/panels/ReadoutPanel';
import { useExperiment } from '../experiment/experimentStore';
import { MATERIALS, MATERIAL_MAP, CURRENT_UNIT } from '../data/observations';
import { MEDIUM_PRESETS } from '../data/materials';
import { buildSourceCsv, downloadFile } from '../export/csv';
import { serializeSessionFile } from '../experiment/persistence';
import type { PerfSnapshot } from '../graphics/renderQuality';
import type { InputPolarisationMode } from '../physics/types';
import './experiment.css';

export default function ExperimentPage() {
  const { state, dispatch, result, captureMeasurement, notify } = useExperiment();
  const [resetSignal, setResetSignal] = useState(0);
  const [perf, setPerf] = useState<PerfSnapshot | null>(null);
  const [showPerf, setShowPerf] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);
  const [refReading, setRefReading] = useState(10);
  const [darkOffset, setDarkOffset] = useState(0);
  const [specimenInput, setSpecimenInput] = useState(String(state.specimenRefractiveIndex));

  useEffect(() => {
    setSpecimenInput(String(state.specimenRefractiveIndex));
  }, [state.specimenRefractiveIndex]);

  const material = MATERIAL_MAP[state.selectedMaterial];
  const ready = state.apparatus.isReady;
  const running = state.status === 'running';

  // Keyboard shortcuts for the bench (only when no field is focused).
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /INPUT|SELECT|TEXTAREA|BUTTON/.test(target.tagName)) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        const delta = event.shiftKey ? 5 : 1;
        const next = Math.min(
          90,
          Math.max(0, state.geometry.incidenceAngleDeg + (event.key === 'ArrowRight' ? delta : -delta)),
        );
        dispatch({ type: 'set-incidence', angleDeg: Number(next.toFixed(1)) });
      }
      if (event.key.toLowerCase() === 'l') {
        dispatch({ type: 'set-laser', enabled: !state.laser.enabled });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dispatch, state.geometry.incidenceAngleDeg, state.laser.enabled]);

  const startExperiment = useCallback(() => {
    if (!ready) {
      notify('The optical train is incomplete — assemble all seven mounts first.');
      return;
    }
    dispatch({ type: 'set-status', status: 'running' });
    dispatch({ type: 'set-laser', enabled: true });
    notify('Acquisition started — beam live, detector armed.');
  }, [dispatch, notify, ready]);

  const mediumOptions = useMemo(
    () =>
      MEDIUM_PRESETS.map((preset) => ({
        value: preset.id,
        label: `${preset.name} · n = ${preset.refractiveIndex.toFixed(3)}`,
      })),
    [],
  );

  const activeMedium = MEDIUM_PRESETS.find(
    (preset) => preset.name === state.medium.name,
  );

  return (
    <div className="shell page experiment">
      <header className="experiment__head">
        <div>
          <p className="eyebrow">SECTION 03 · LIVE EXPERIMENT</p>
          <h1 className="display page__title">LIVE ANGULAR MEASUREMENT</h1>
        </div>
        <div className="experiment__head-status">
          <span className={`chip ${state.laser.enabled ? 'chip--live' : 'chip--off'}`}>
            {state.laser.enabled ? 'BEAM LIVE · 650 nm' : 'BEAM OFF'}
          </span>
          <span className={`chip ${ready ? 'chip--live' : 'chip--amber'}`}>
            {ready ? 'OPTICAL TRAIN READY' : 'TRAIN INCOMPLETE'}
          </span>
          <span className={`chip ${running ? 'chip--live' : 'chip--off'}`}>
            {state.status.toUpperCase()}
          </span>
        </div>
      </header>

      <div className="grid-lab">
        <div className="experiment__stage">
          <div className="experiment__bench panel bracketed">
            <div className="experiment__bench-head">
              <div>
                <span className="label">SPECIMEN INTERFACE</span>
                <p className="experiment__bench-title mono">
                  {material.name} · n₂ = {result.n2.toFixed(4)} · n₁ = {result.n1.toFixed(3)}
                </p>
              </div>
              <div className="experiment__view-toggle">
                <Segmented
                  label="VIEW"
                  options={[
                    { value: 'side', label: 'SIDE / RAY' },
                    { value: 'top', label: 'TOP / BENCH' },
                  ]}
                  value={state.geometry.view}
                  onChange={(view) => dispatch({ type: 'set-view', view })}
                  size="sm"
                />
                <button
                  type="button"
                  className="btn btn--sm btn--ghost"
                  onClick={() => {
                    setResetSignal((value) => value + 1);
                    notify('Camera returned to the preset view.');
                  }}
                >
                  RESET CAMERA
                </button>
              </div>
            </div>

            <OpticalBench
              result={result}
              laserOn={state.laser.enabled}
              view={state.geometry.view}
              polariserDeg={state.polarisation.inputAngleDeg}
              inputMode={state.polarisation.inputMode}
              onPerf={setPerf}
              onFallback={() => notify('3D unavailable — exact 2D ray bench engaged.')}
              resetSignal={resetSignal}
            />

            <div className="experiment__bench-foot">
              <span className="note">
                Orbit with drag · zoom with scroll/pinch · the camera never changes the physics
              </span>
              <div className="row" style={{ gap: 'var(--sp-2)' }}>
                <button
                  type="button"
                  className="btn btn--sm btn--ghost"
                  onClick={() => setShowPerf((value) => !value)}
                  aria-expanded={showPerf}
                >
                  {showPerf ? 'HIDE' : 'SHOW'} PERF
                </button>
                <span className="chip chip--off">{perf ? `${perf.fps} FPS` : 'MEASURING'}</span>
              </div>
            </div>

            {showPerf && (
              <div className="perf-strip" role="status">
                <span>FPS <strong className="mono">{perf?.fps ?? '—'}</strong></span>
                <span>FRAME <strong className="mono">{perf?.frameMs ?? '—'} ms</strong></span>
                <span>QUALITY <strong className="mono">{perf?.tier ?? '—'}</strong></span>
                <span>WEBGL <strong className="mono">{perf?.webgl ? 'YES' : 'NO'}</strong></span>
                <span className="note">Rolling 500 ms window, measured in this session only.</span>
              </div>
            )}
          </div>

          <div className="experiment__secondary">
            <div className="panel">
              <div className="panel-head">
                <h3>REFERENCE RAY GEOMETRY (2D)</h3>
                <span className="chip">SAME ENGINE</span>
              </div>
              <div className="panel-body">
                <RayDiagram result={result} laserOn={state.laser.enabled} height={300} compact />
                <p className="note" style={{ marginTop: 'var(--sp-3)' }}>
                  The 2D diagram and the 3D bench consume the same computed result object, so the
                  rendered rays and the displayed numbers cannot disagree.
                </p>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <h3>MEASUREMENT HISTORY</h3>
                <button
                  type="button"
                  className="btn btn--sm btn--ghost"
                  onClick={() => dispatch({ type: 'clear-history' })}
                  disabled={state.measurementHistory.length === 0}
                >
                  CLEAR
                </button>
              </div>
              <div className="panel-body">
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={captureMeasurement}
                  disabled={!state.laser.enabled}
                >
                  CAPTURE THEORETICAL READING
                </button>
                {!state.laser.enabled && (
                  <p className="note" style={{ marginTop: 8 }}>
                    Disabled: the laser is off, so there is nothing to acquire.
                  </p>
                )}
                {state.measurementHistory.length === 0 ? (
                  <p className="note" style={{ marginTop: 'var(--sp-4)' }}>
                    No captures yet. Each capture stores a simulator-derived theoretical value —
                    never a source observation.
                  </p>
                ) : (
                  <div className="history">
                    <table className="data-table history__table">
                      <thead>
                        <tr>
                          <th scope="col">Material</th>
                          <th scope="col">θi</th>
                          <th scope="col">θB</th>
                          <th scope="col">Signal</th>
                          <th scope="col">Rs</th>
                          <th scope="col">Rp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.measurementHistory.slice(0, 8).map((record) => (
                          <tr key={record.id}>
                            <td>{MATERIAL_MAP[record.materialKey].shortName}</td>
                            <td>{record.incidenceDeg.toFixed(1)}°</td>
                            <td>{record.brewsterDeg.toFixed(2)}°</td>
                            <td>{record.modelSignal.toFixed(4)}</td>
                            <td>{record.Rs.toFixed(4)}</td>
                            <td>{record.Rp.toExponential(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="note">
                      Showing the latest {Math.min(8, state.measurementHistory.length)} of{' '}
                      {state.measurementHistory.length} captures. Theoretical model values only.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <aside className="experiment__side" aria-label="Experiment controls">
          <section className="panel bracketed">
            <div className="panel-head">
              <h3>SPECIMEN &amp; MEDIUM</h3>
              <span className="chip chip--amber">SOURCE MATERIALS</span>
            </div>
            <div className="panel-body stack" style={{ gap: 'var(--sp-4)' }}>
              <div className="material-tiles" role="group" aria-label="Specimen material">
                {MATERIALS.map((entry) => (
                  <button
                    key={entry.key}
                    type="button"
                    className={`material-tile${state.selectedMaterial === entry.key ? ' is-active' : ''}`}
                    onClick={() => dispatch({ type: 'set-material', material: entry.key })}
                    aria-pressed={state.selectedMaterial === entry.key}
                  >
                    <span className="material-tile__name">{entry.shortName}</span>
                    <span className="material-tile__angle mono">{entry.sourceReportedBrewsterAngleDeg}°</span>
                    <span className="material-tile__index mono">
                      n ≈ {entry.effectiveIndexAirCalibration.toFixed(4)}
                    </span>
                  </button>
                ))}
              </div>

              <LabSelect
                label="SURROUNDING MEDIUM"
                value={activeMedium?.id ?? 'custom'}
                options={[
                  ...mediumOptions,
                  ...(activeMedium ? [] : [{ value: 'custom', label: `Custom · n = ${state.medium.refractiveIndex.toFixed(3)}` }]),
                ]}
                onChange={(id) => {
                  const preset = MEDIUM_PRESETS.find((item) => item.id === id);
                  if (preset) {
                    dispatch({ type: 'set-medium', name: preset.name, refractiveIndex: preset.refractiveIndex });
                  }
                }}
                hint={activeMedium?.provenance}
              />

              <AngleSlider
                label="Surrounding index n₁"
                value={state.medium.refractiveIndex}
                min={1}
                max={2.2}
                step={0.001}
                unit=""
                decimals={3}
                onChange={(value) => dispatch({ type: 'set-medium', name: 'Custom medium', refractiveIndex: value })}
              />

              <div className="specimen-index">
                <label className="ctrl__label" htmlFor="specimen-index">
                  SPECIMEN INDEX n₂ — INFERRED
                </label>
                <div className="specimen-index__row">
                  <input
                    id="specimen-index"
                    type="number"
                    className="numeric"
                    min={1.001}
                    max={4}
                    step={0.001}
                    value={specimenInput}
                    onChange={(event) => {
                      setSpecimenInput(event.target.value);
                      const parsed = Number.parseFloat(event.target.value);
                      if (Number.isFinite(parsed) && parsed > 1 && parsed <= 4) {
                        dispatch({ type: 'set-specimen-index', refractiveIndex: parsed });
                      }
                    }}
                    aria-describedby="specimen-index-note"
                  />
                  <button
                    type="button"
                    className="btn btn--sm btn--ghost"
                    onClick={() =>
                      dispatch({
                        type: 'set-specimen-index',
                        refractiveIndex: material.effectiveIndexAirCalibration * state.medium.refractiveIndex,
                      })
                    }
                  >
                    RESET TO PROFILE
                  </button>
                </div>
                <p id="specimen-index-note" className="note">
                  Effective calibration value inferred from the reported angle. Editing it changes the
                  live physics only — never the source table or the reported results.
                </p>
              </div>
            </div>
          </section>

          <section className="panel bracketed">
            <div className="panel-head">
              <h3>LIVE ANGULAR MEASUREMENT</h3>
              <span className={`chip ${result.atBrewster ? 'chip--amber' : 'chip--off'}`}>
                {result.atBrewster ? 'AT BREWSTER' : `Δ ${result.deltaFromBrewsterDeg.toFixed(2)}°`}
              </span>
            </div>
            <div className="panel-body stack" style={{ gap: 'var(--sp-4)' }}>
              <div className="dial-row">
                <AngularDial
                  value={state.geometry.incidenceAngleDeg}
                  max={90}
                  label="INCIDENCE θi"
                  accent="red"
                  secondary={{
                    value: result.brewster.brewsterAngleDeg,
                    label: 'θB',
                    accent: 'amber',
                  }}
                />
                <AngularDial
                  value={result.refractionDeg ?? 0}
                  max={90}
                  label="REFRACTION θt"
                  accent="cyan"
                  size={120}
                />
              </div>

              <AngleSlider
                label="Angle of incidence θi"
                value={state.geometry.incidenceAngleDeg}
                min={0}
                max={90}
                step={0.5}
                decimals={1}
                onChange={(value) => dispatch({ type: 'set-incidence', angleDeg: value })}
                hint={`θB = ${result.brewster.brewsterAngleDeg.toFixed(2)}°`}
                accent="red"
              />

              <button
                type="button"
                className="btn btn--sm"
                onClick={() =>
                  dispatch({
                    type: 'set-incidence',
                    angleDeg: Number(result.brewster.brewsterAngleDeg.toFixed(1)),
                  })
                }
              >
                SNAP TO BREWSTER ANGLE
              </button>
            </div>
          </section>

          <section className="panel bracketed">
            <div className="panel-head">
              <h3>SOURCE &amp; POLARISATION</h3>
            </div>
            <div className="panel-body stack" style={{ gap: 'var(--sp-4)' }}>
              <Toggle
                label="Diode laser"
                description="650 nm · 3 mW · RED"
                checked={state.laser.enabled}
                onChange={(enabled) => dispatch({ type: 'set-laser', enabled })}
                accent="red"
                onLabel="ON"
                offLabel="OFF"
              />

              <Segmented<InputPolarisationMode>
                label="INCIDENT POLARISATION"
                options={[
                  { value: 'unpolarised', label: 'UNPOL' },
                  { value: 's', label: 's' },
                  { value: 'p', label: 'p' },
                  { value: 'linear', label: 'LINEAR' },
                ]}
                value={state.polarisation.inputMode}
                onChange={(mode) => dispatch({ type: 'set-input-mode', mode })}
                size="sm"
              />

              {state.polarisation.inputMode === 'linear' && (
                <AngleSlider
                  label="Input ψ (from s axis)"
                  value={state.polarisation.inputAngleDeg}
                  min={0}
                  max={180}
                  step={1}
                  decimals={0}
                  onChange={(value) => dispatch({ type: 'set-input-angle', angleDeg: value })}
                  accent="amber"
                />
              )}

              <AngleSlider
                label="Polariser angle"
                value={state.polarisation.inputAngleDeg}
                min={0}
                max={360}
                step={1}
                decimals={0}
                onChange={(value) => dispatch({ type: 'set-polariser-angle', angleDeg: value })}
                hint="physical stage rotation"
                accent="amber"
              />

              <Toggle
                label="Reflected-beam analyser"
                description="Crossed analyser proves the reflected beam is s-polarised"
                checked={state.polarisation.analyserEnabled}
                onChange={(enabled) => dispatch({ type: 'set-analyser', enabled })}
              />

              {state.polarisation.analyserEnabled && (
                <AngleSlider
                  label="Analyser angle α"
                  value={state.polarisation.analyserAngleDeg}
                  min={0}
                  max={180}
                  step={1}
                  decimals={0}
                  onChange={(value) =>
                    dispatch({
                      type: 'set-analyser',
                      enabled: true,
                      angleDeg: value,
                    })
                  }
                  hint="90° extinguishes an s-polarised beam"
                />
              )}
            </div>
          </section>

          <section className="panel bracketed">
            <div className="panel-head">
              <h3>OPTICAL TRAIN ASSEMBLY</h3>
            </div>
            <div className="panel-body">
              <AssemblyPanel />
            </div>
          </section>

          <section className="panel bracketed">
            <div className="panel-head">
              <h3>MEASUREMENT &amp; DETECTOR</h3>
            </div>
            <div className="panel-body">
              <ReadoutPanel result={result} laserOn={state.laser.enabled} atBrewster={result.atBrewster} />
            </div>
          </section>

          <section className="panel bracketed">
            <div className="panel-head">
              <h3>RUN CONTROL</h3>
            </div>
            <div className="panel-body">
              <div className="run-controls">
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={startExperiment}
                  disabled={running}
                >
                  START
                </button>
                <button
                  type="button"
                  className="btn btn--sm"
                  onClick={() => dispatch({ type: 'set-status', status: 'paused' })}
                  disabled={!running}
                >
                  PAUSE
                </button>
                <button
                  type="button"
                  className="btn btn--sm btn--danger"
                  onClick={() => {
                    dispatch({ type: 'reset' });
                    setResetSignal((value) => value + 1);
                  }}
                >
                  RESET
                </button>
              </div>
              <p className="note" style={{ marginTop: 'var(--sp-3)' }}>
                Keyboard: ←/→ nudges the incidence angle by 1° (Shift for 5°), L toggles the laser.
              </p>

              <hr className="hairline" />

              <div className="export-row">
                <button
                  type="button"
                  className="btn btn--sm btn--ghost"
                  onClick={() => {
                    downloadFile('brewster-source-observations.csv', buildSourceCsv());
                    notify('Source observation CSV downloaded.');
                  }}
                >
                  EXPORT SOURCE CSV
                </button>
                <button
                  type="button"
                  className="btn btn--sm btn--ghost"
                  onClick={() => {
                    downloadFile(
                      'brewster-session.json',
                      serializeSessionFile(state),
                      'application/json',
                    );
                    notify('Session notebook downloaded.');
                  }}
                >
                  SAVE SESSION
                </button>
                <Link to="/observations" className="btn btn--sm btn--ghost">
                  FULL RECORD →
                </Link>
              </div>
              <p className="note" style={{ marginTop: 8 }}>
                Source units are preserved verbatim as “{CURRENT_UNIT}”.{' '}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setShowCalibration((value) => !value)}
                  aria-expanded={showCalibration}
                >
                  {showCalibration ? 'Hide' : 'Open'} detector calibration assumptions
                </button>
              </p>

              {showCalibration && (
                <div className="calibration">
                  <p className="note">
                    The source document states no responsivity, gain, or dark offset. Supplying
                    assumptions here produces calibrated units that are clearly labelled as yours —
                    they do not replace the normalised model signal.
                  </p>
                  <label className="calibration__field">
                    Reference reading at signal = max
                    <input
                      type="number"
                      className="numeric"
                      value={refReading}
                      step={0.5}
                      onChange={(event) => setRefReading(Number(event.target.value))}
                    />
                  </label>
                  <label className="calibration__field">
                    Dark offset
                    <input
                      type="number"
                      className="numeric"
                      value={darkOffset}
                      step={0.1}
                      onChange={(event) => setDarkOffset(Number(event.target.value))}
                    />
                  </label>
                  <div className="row" style={{ gap: 'var(--sp-2)' }}>
                    <button
                      type="button"
                      className="btn btn--sm btn--primary"
                      onClick={() => {
                        dispatch({
                          type: 'set-calibration',
                          calibration: {
                            referenceSignal: Math.max(1e-6, result.fresnel.RUnpolarised),
                            referenceReadingAmps: refReading,
                            darkOffsetAmps: darkOffset,
                          },
                        });
                        notify('Calibration applied to the live detector model.');
                      }}
                    >
                      APPLY CALIBRATION
                    </button>
                    <button
                      type="button"
                      className="btn btn--sm btn--ghost"
                      onClick={() => {
                        dispatch({ type: 'set-calibration', calibration: null });
                        notify('Calibration removed — normalised signal only.');
                      }}
                    >
                      CLEAR
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
