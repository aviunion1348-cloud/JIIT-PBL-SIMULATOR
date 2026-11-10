import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OpticalAperture } from '../components/layout/OpticalAperture';
import { useExperiment } from '../experiment/experimentStore';
import { useReducedMotion } from '../app/appState';
import { MATERIALS, MATERIAL_MAP, sampledMinimum } from '../data/observations';
import { REPORTED_RESULTS } from '../data/results';
import './home.css';

const INTRO_DURATION = 3600;

export default function HomePage() {
  const { state, result, dispatch } = useExperiment();
  const reducedMotion = useReducedMotion();
  const [introVisible, setIntroVisible] = useState(!state.introSeen && !reducedMotion);
  const [portalAngle, setPortalAngle] = useState(46);

  // Short, skippable cinematic prelude. It never gates navigation.
  useEffect(() => {
    if (!introVisible) return;
    const timer = window.setTimeout(() => {
      setIntroVisible(false);
      dispatch({ type: 'mark-intro-seen' });
    }, INTRO_DURATION);
    return () => window.clearTimeout(timer);
  }, [introVisible, dispatch]);

  // A slow, deliberate sweep of the aperture so the interface looks alive.
  useIntroSweep(introVisible, reducedMotion, setPortalAngle);

  const portalState = useMemo(
    () => ({
      incidenceDeg: introVisible ? portalAngle : result.incidenceDeg,
      brewsterDeg: result.brewster.brewsterAngleDeg,
      n1: result.n1,
      n2: result.n2,
      reflectedFraction: result.fresnel.RUnpolarised,
      laserOn: introVisible ? true : state.laser.enabled || true,
      polariserDeg: state.polarisation.inputAngleDeg,
    }),
    [introVisible, portalAngle, result, state.laser.enabled, state.polarisation.inputAngleDeg],
  );

  return (
    <>
      {introVisible && (
        <div className="intro" role="dialog" aria-label="Laboratory introduction">
          <div className="intro__beam" aria-hidden="true" />
          <div className="intro__content">
            <p className="intro__eyebrow">JIIT · PHYSICS PBL · ENGINEERING OPTICS</p>
            <h1 className="intro__title display">BREWSTER'S LAW LAB</h1>
            <p className="intro__line">650 nm beam energised · specimen mounted · goniometer zeroed</p>
            <div className="intro__meter" aria-hidden="true">
              <span />
            </div>
            <button
              type="button"
              className="btn btn--ghost intro__skip"
              onClick={() => {
                setIntroVisible(false);
                dispatch({ type: 'mark-intro-seen' });
              }}
            >
              SKIP INTRO
            </button>
          </div>
        </div>
      )}

      <section className="hero">
        <div className="hero__grid shell">
          <div className="hero__copy">
            <p className="eyebrow anim-fade-up">VERIFYING BREWSTER'S LAW</p>
            <h1 className="hero__title display anim-title">
              BREWSTER'S
              <br />
              <span className="hero__title-accent">LAW</span>
            </h1>
            <p className="hero__subtitle">
              An Interactive Optical Physics Laboratory
            </p>
            <p className="lede hero__lede">
              Drive a real goniometer bench, sweep the angle of incidence, and watch s- and
              p-polarised components separate exactly as Fresnel predicted. Then verify the
              supplied observations: three specimens, 57 readings, and the polarising condition
              hiding in a minimum of current.
            </p>

            <div className="hero__actions">
              <Link to="/experiment" className="btn btn--primary">
                ENTER THE LAB
                <span aria-hidden="true">→</span>
              </Link>
              <Link to="/theory" className="btn">
                EXPLORE THE THEORY
              </Link>
            </div>

            <div className="hero__spec" role="list" aria-label="Source apparatus specification">
              <div role="listitem">
                <span className="mono">650 nm</span>
                <small>DIODE LASER</small>
              </div>
              <div role="listitem">
                <span className="mono">3 mW</span>
                <small>OPTICAL POWER</small>
              </div>
              <div role="listitem">
                <span className="mono">500 mm</span>
                <small>OPTICAL RAIL</small>
              </div>
              <div role="listitem">
                <span className="mono">{MATERIALS.length}</span>
                <small>SPECIMENS</small>
              </div>
            </div>
          </div>

          <div className="hero__visual">
            <OpticalAperture state={portalState} reducedMotion={reducedMotion} />
            <div className="hero__visual-caption">
              <span className="chip chip--live">LIVE OPTICAL SOLUTION</span>
              <span className="note">
                Incidence {result.incidenceDeg.toFixed(1)}° · θB {result.brewster.brewsterAngleDeg.toFixed(2)}° · R<sub>p</sub>{' '}
                {result.fresnel.Rp.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="shell home-results">
        <div className="section-head">
          <div>
            <p className="eyebrow">REPORTED POLARISING ANGLES</p>
            <h2>THREE SPECIMENS, ONE LAW</h2>
          </div>
          <Link to="/results" className="btn btn--sm btn--ghost">
            FULL RESULTS →
          </Link>
        </div>

        <div className="result-preview-grid">
          {REPORTED_RESULTS.map((reported, index) => {
            const material = MATERIAL_MAP[reported.materialKey];
            const minimum = sampledMinimum(material);
            return (
              <article
                key={reported.materialKey}
                className="result-preview panel bracketed"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <div className="result-preview__top">
                  <span className="label">{material.shortName} GLASS</span>
                  <span className="chip chip--amber">SOURCE REPORTED</span>
                </div>
                <p className="result-preview__angle numeric">{reported.display}</p>
                <p className="result-preview__formula mono">
                  tan θB = n₂ / n₁ → n₂ ≈ {material.effectiveIndexAirCalibration.toFixed(4)}
                </p>
                <div className="result-preview__foot">
                  <span>Sampled minimum</span>
                  <span className="mono">
                    {minimum.angleDeg}° · I = {minimum.currentA.toFixed(4)} A
                  </span>
                </div>
              </article>
            );
          })}
        </div>
        <p className="note home-results__note">
          The reported angles come from the supplied document. The sampled minima are the lowest
          tabulated 5° readings and are deliberately kept separate — the document does not state its
          interpolation method.
        </p>
      </section>

      <section className="shell home-journey">
        <div className="section-head">
          <div>
            <p className="eyebrow">THE WORKING ROUTE</p>
            <h2>FROM APPARATUS TO CONCLUSION</h2>
          </div>
        </div>
        <ol className="journey">
          {[
            { to: '/theory', index: '01', title: 'POLARISATION AT THE INTERFACE', body: 'Why the p component vanishes and the s component survives.' },
            { to: '/apparatus', index: '02', title: 'THE OPTICAL TRAIN', body: 'Laser, mount, polariser, specimen, goniometer, detector, rail.' },
            { to: '/experiment', index: '03', title: 'LIVE ANGULAR MEASUREMENT', body: 'Sweep the incidence angle against a real Fresnel engine.' },
            { to: '/observations', index: '04', title: 'SOURCE LAB RECORD', body: 'All 57 readings, exactly preserved, exportable as CSV.' },
            { to: '/analysis', index: '05', title: 'CURRENT RESPONSE', body: 'Plot every material and locate the minimum-current region.' },
            { to: '/results', index: '06', title: 'THE POLARISING CONDITION', body: 'The reported angles, with the source-faithful conclusion.' },
            { to: '/viva', index: '07', title: 'TEST YOUR OPTICS', body: 'Twenty-four questions with study and test modes.' },
          ].map((step) => (
            <li key={step.to}>
              <Link to={step.to} className="journey__item">
                <span className="journey__index mono">{step.index}</span>
                <span className="journey__body">
                  <strong>{step.title}</strong>
                  <small>{step.body}</small>
                </span>
                <span className="journey__arrow" aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

/** Small hook keeping the aperture sweep out of the render body. */
function useIntroSweep(
  introVisible: boolean,
  reducedMotion: boolean,
  setAngle: (value: number) => void,
): void {
  useEffect(() => {
    if (!introVisible || reducedMotion) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / INTRO_DURATION);
      // ease-in-out sweep from 20° to 68° and back toward the Brewster region
      const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      setAngle(18 + eased * 40);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [introVisible, reducedMotion, setAngle]);
}
