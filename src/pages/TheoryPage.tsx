import { useMemo, useState } from 'react';
import { AngleSlider } from '../components/controls/AngleSlider';
import { RayDiagram } from '../components/graphics/RayDiagram';
import { computeOpticalResult } from '../physics';
import { brewsterAngleDeg } from '../physics/brewster';
import { malusLaw } from '../physics/polarisation';
import './theory.css';

const TOC = [
  { id: 'natural-light', label: 'Natural & unpolarised light' },
  { id: 'components', label: 'Orthogonal components' },
  { id: 'plane-polarised', label: 'Plane-polarised light' },
  { id: 'incidence-plane', label: 'Plane of incidence & normal' },
  { id: 'reflection-refraction', label: 'Reflection & refraction' },
  { id: 'brewster', label: "Brewster's angle" },
  { id: 'snell', label: "Snell's relation" },
  { id: 'right-angle', label: 'The right-angle condition' },
  { id: 'sp', label: 's and p polarisation' },
];

export default function TheoryPage() {
  const [angle, setAngle] = useState(56.31);
  const [n1, setN1] = useState(1);
  const [n2, setN2] = useState(1.5);
  const [malusAngle, setMalusAngle] = useState(45);

  const result = useMemo(
    () =>
      computeOpticalResult({
        n1,
        n2,
        incidenceDeg: angle,
        polarisation: { mode: 'unpolarised', angleDeg: 0 },
        laserOn: true,
      }),
    [angle, n1, n2],
  );

  const thetaB = brewsterAngleDeg(n1, n2);

  return (
    <div className="shell page theory">
      <header className="page__head">
        <p className="eyebrow">SECTION 01 · THEORY</p>
        <h1 className="display page__title">POLARISATION AT THE INTERFACE</h1>
        <p className="lede">
          A first-year optics account of what the laser actually does when it meets a glass slide —
          and precisely why one reflected component disappears at the polarising angle.
        </p>
      </header>

      <div className="theory__layout">
        <aside className="theory__toc" aria-label="Theory contents">
          <p className="label">CONTENTS</p>
          <ol>
            {TOC.map((item, index) => (
              <li key={item.id}>
                <a href={`#${item.id}`}>
                  <span className="mono">{String(index + 1).padStart(2, '0')}</span>
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </aside>

        <div className="theory__body">
          <article className="theory-block" id="natural-light">
            <h2 className="theory-block__title display">01 · NATURAL AND UNPOLARISED LIGHT</h2>
            <div className="theory-block__grid">
              <div>
                <p>
                  An ordinary source contains an enormous number of randomly oriented atomic
                  emitters. Each radiates a polarised wavetrain for roughly 10<sup>−8</sup> s. Those
                  wavetrains combine into a resultant polarisation that persists for less than
                  10<sup>−8</sup> s, then changes again. Because the state changes so rapidly and
                  randomly, the light is called <strong>unpolarised</strong> or randomly polarised.
                </p>
                <p>
                  The essential point: unpolarised light is <em>not</em> a single wave with a
                  wobbling direction. It is a statistical mixture. That is why it must be treated as
                  two <em>incoherent</em> components that add in intensity, never as one coherent
                  vector.
                </p>
              </div>
              <UnpolarisedDiagram />
            </div>
          </article>

          <article className="theory-block" id="components">
            <h2 className="theory-block__title display">02 · TWO ORTHOGONAL COMPONENTS</h2>
            <div className="theory-block__grid">
              <div>
                <p>
                  Natural light can be resolved into two arbitrary, mutually perpendicular,
                  <em> incoherent</em>, linearly polarised waves of equal average intensity. Each
                  carries half the total power.
                </p>
                <p>
                  In this experiment those two directions are named relative to the plane of
                  incidence: <strong>p</strong> (parallel to the plane of incidence) and{' '}
                  <strong>s</strong> (perpendicular to it, from the German <em>senkrecht</em>).
                </p>
                <div className="formula">I<sub>unpolarised</sub> = I<sub>s</sub> + I<sub>p</sub> = 2I₀</div>
              </div>
              <ComponentsDiagram />
            </div>
          </article>

          <article className="theory-block" id="plane-polarised">
            <h2 className="theory-block__title display">03 · PLANE-POLARISED LIGHT</h2>
            <div className="theory-block__grid">
              <div>
                <p>
                  Light is <strong>plane polarised</strong> when all its electric-field vibrations
                  are confined to a single plane containing the propagation direction. A polariser
                  produces this by transmitting one component and absorbing the orthogonal one.
                </p>
                <p>
                  For an ideal analyser placed in an already plane-polarised beam, the transmitted
                  intensity follows Malus's law. This law applies <em>only</em> in that situation —
                  not at the specimen interface, and not to an unpolarised input.
                </p>
              </div>
              <div className="theory-card panel">
                <p className="label">MALUS'S LAW</p>
                <div className="formula">I = I₀ cos² φ</div>
                <AngleSlider
                  label="Analyser angle φ"
                  value={malusAngle}
                  min={0}
                  max={90}
                  step={1}
                  decimals={0}
                  onChange={setMalusAngle}
                  hint="relative to the incident polarisation"
                  accent="amber"
                />
                <MalusMeter ratio={malusLaw(1, malusAngle)} />
              </div>
            </div>
          </article>

          <article className="theory-block" id="incidence-plane">
            <h2 className="theory-block__title display">04 · PLANE OF INCIDENCE AND THE NORMAL</h2>
            <p>
              The <strong>surface normal</strong> is the line perpendicular to the interface at the
              point of incidence. The plane containing the incident ray and the normal is the{' '}
              <strong>plane of incidence</strong>.
            </p>
            <p className="callout">
              Every angle in this laboratory — incidence, reflection, refraction and the Brewster
              angle — is measured <strong>from the normal</strong>, never from the surface itself.
              Measuring from the surface would give the complement and make Brewster's law read
              cot θ instead of tan θ.
            </p>
            <NormalDiagram />
          </article>

          <article className="theory-block" id="reflection-refraction">
            <h2 className="theory-block__title display">05 · REFLECTION AND REFRACTION</h2>
            <p>
              At a transparent dielectric interface the incident beam splits. The reflected ray
              obeys θ<sub>r</sub> = θ<sub>i</sub>; the transmitted ray obeys Snell's law and bends
              toward the normal when entering the optically denser medium. Both the reflected and
              the transmitted intensities are set by the Fresnel coefficients.
            </p>
            <div className="theory-interactive panel bracketed">
              <div className="theory-interactive__controls">
                <AngleSlider
                  label="Illustrative incidence angle"
                  value={angle}
                  min={0}
                  max={90}
                  step={0.5}
                  onChange={setAngle}
                  hint={`Brewster at ${thetaB.toFixed(2)}°`}
                  accent="red"
                />
                <AngleSlider
                  label="Surrounding index n₁"
                  value={n1}
                  min={1}
                  max={1.6}
                  step={0.005}
                  unit=""
                  decimals={3}
                  onChange={setN1}
                  accent="cyan"
                />
                <AngleSlider
                  label="Specimen index n₂"
                  value={n2}
                  min={1.01}
                  max={2.4}
                  step={0.005}
                  unit=""
                  decimals={3}
                  onChange={setN2}
                  accent="cyan"
                />
                <div className="theory-interactive__readouts">
                  <ReadoutSmall label="θt" value={result.refractionDeg === null ? 'TIR' : `${result.refractionDeg.toFixed(2)}°`} />
                  <ReadoutSmall label="Rs" value={result.fresnel.Rs.toFixed(4)} />
                  <ReadoutSmall label="Rp" value={result.fresnel.Rp.toFixed(4)} />
                  <ReadoutSmall label="θr + θt" value={result.refractionDeg === null ? '—' : `${(angle + result.refractionDeg).toFixed(2)}°`} />
                </div>
              </div>
              <RayDiagram result={result} laserOn height={400} />
            </div>
          </article>

          <article className="theory-block" id="brewster">
            <h2 className="theory-block__title display">06 · BREWSTER'S ANGLE</h2>
            <div className="theory-block__grid">
              <div>
                <p>
                  Consider unpolarised light incident on a transparent surface. At one particular
                  angle of incidence the reflected beam emerges completely plane polarised. That
                  angle is the <strong>Brewster angle</strong>, also called the polarising angle
                  θ<sub>B</sub>.
                </p>
                <p>
                  Sir David Brewster found that the maximum polarisation of the reflected ray occurs
                  when the reflected ray is perpendicular to the refracted ray. This is{' '}
                  <strong>Brewster's law</strong>.
                </p>
                <div className="formula">
                  tan <em>θ</em><sub>B</sub> = n₂ / n₁ &nbsp;&nbsp;→&nbsp;&nbsp; <em>θ</em><sub>B</sub> = tan⁻¹(n₂ / n₁)
                </div>
                <p className="note">
                  n₁ is the refractive index of the surrounding medium, n₂ that of the reflecting
                  specimen. As the refractive index changes, the polarising angle changes — but the
                  simplified law is independent of the wavelength used, provided the indices
                  themselves are held fixed. Real indices do vary with wavelength.
                </p>
              </div>
              <div className="theory-card panel">
                <p className="label">LIVE EVALUATION</p>
                <p className="theory-value numeric">{thetaB.toFixed(3)}°</p>
                <p className="note">
                  θ<sub>B</sub> = tan⁻¹({n2.toFixed(3)} / {n1.toFixed(3)})
                </p>
                <hr className="hairline" />
                <p className="label">MOVE TO θB</p>
                <button type="button" className="btn btn--sm" onClick={() => setAngle(Number(thetaB.toFixed(2)))}>
                  SNAP GEOMETRY TO BREWSTER
                </button>
                <p className="note" style={{ marginTop: 'var(--sp-3)' }}>
                  Setting the incidence angle to θ<sub>B</sub> drives R<sub>p</sub> to approximately
                  zero while R<sub>s</sub> stays finite.
                </p>
              </div>
            </div>
          </article>

          <article className="theory-block" id="snell">
            <h2 className="theory-block__title display">07 · SNELL'S LAW RELATION</h2>
            <p>
              At the interface, the transmitted ray satisfies n₁ sin θ<sub>i</sub> = n₂ sin θ
              <sub>t</sub>. Combining this with Brewster's law gives the elegant geometric
              consequence that defines the experiment:
            </p>
            <div className="formula">
              <em>θ</em><sub>r</sub> + <em>θ</em><sub>t</sub> = 90°
            </div>
            <p>
              If the incident medium is denser than the specimen (n₁ &gt; n₂) the critical angle
              condition n₁ sin θ<sub>i</sub> = n₂ · 1 can be reached first, and total internal
              reflection occurs — no transmitted ray exists. This simulator reports that state
              explicitly rather than returning a meaningless angle.
            </p>
          </article>

          <article className="theory-block" id="right-angle">
            <h2 className="theory-block__title display">08 · WHY THE RAYS ARE PERPENDICULAR</h2>
            <p>
              At Brewster incidence the reflected and refracted rays meet at exactly 90°. Physically,
              the reflected s component scatters from the interface while the p component would have
              to drive the dipoles in the direction of the reflected ray. That direction lies
              parallel to the transmitted ray's dipole oscillation axis, and a dipole cannot radiate
              along its own axis of oscillation. The p component therefore has no reflected wave to
              belong to.
            </p>
            <p className="callout">
              Important: the p-polarised <em>reflected component</em> vanishes. The total reflected
              intensity of unpolarised light is <strong>not</strong> zero, because the s-polarised
              component still reflects with a substantial fraction of the incident power. Stating
              otherwise is a common and serious error.
            </p>
            <BrewsterProof result={result} thetaB={thetaB} />
          </article>

          <article className="theory-block" id="sp">
            <h2 className="theory-block__title display">09 · PHYSICAL MEANING OF s AND p</h2>
            <div className="theory-grid-2">
              <div className="panel theory-card">
                <span className="chip">s-POLARISED</span>
                <p>
                  Electric field <strong>perpendicular</strong> to the plane of incidence
                  (<em>senkrecht</em>). Always partially reflected. At Brewster incidence it is the
                  only thing left in the reflected beam, so the reflected ray is purely s-polarised.
                </p>
                <p className="mono theory-card__value">
                  R<sub>s</sub> = {result.fresnel.Rs.toFixed(4)} at θ = {angle.toFixed(1)}°
                </p>
              </div>
              <div className="panel theory-card">
                <span className="chip chip--amber">p-POLARISED</span>
                <p>
                  Electric field <strong>parallel</strong> to the plane of incidence. Its reflection
                  coefficient crosses zero at Brewster incidence and changes sign beyond it.
                </p>
                <p className="mono theory-card__value">
                  R<sub>p</sub> = {result.fresnel.Rp.toFixed(6)} at θ = {angle.toFixed(1)}°
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

function ReadoutSmall({ label, value }: { label: string; value: string }) {
  return (
    <div className="readout readout--tight">
      <span className="readout__label">{label}</span>
      <span className="readout__value mono">{value}</span>
    </div>
  );
}

function UnpolarisedDiagram() {
  const ticks = Array.from({ length: 26 }, (_, i) => i);
  return (
    <div className="panel theory-figure">
      <p className="label">FIG. 1 — RANDOMLY ORIENTED E-FIELD</p>
      <svg viewBox="0 0 300 190" className="theory-figure__svg" role="img" aria-label="Unpolarised light with randomly oriented electric field vectors along the propagation direction">
        <line x1="14" y1="95" x2="286" y2="95" stroke="rgba(143,170,210,0.25)" strokeDasharray="4 5" />
        <text x="252" y="112" className="fig-tag">PROPAGATION</text>
        {ticks.map((i) => {
          const x = 20 + i * 10.4;
          const seed = Math.sin(i * 12.9898) * 43758.5453;
          const angle = (seed - Math.floor(seed)) * Math.PI;
          const len = 26;
          return (
            <line
              key={i}
              x1={x - Math.cos(angle) * len * 0.5}
              y1={95 - Math.sin(angle) * len * 0.5}
              x2={x + Math.cos(angle) * len * 0.5}
              y2={95 + Math.sin(angle) * len * 0.5}
              stroke="rgba(127,228,251,0.62)"
              strokeWidth="1.4"
            />
          );
        })}
      </svg>
    </div>
  );
}

function ComponentsDiagram() {
  return (
    <div className="panel theory-figure">
      <p className="label">FIG. 2 — 50% / 50% DECOMPOSITION</p>
      <svg viewBox="0 0 300 190" className="theory-figure__svg" role="img" aria-label="Unpolarised light split into equal horizontal and vertical linearly polarised components">
        <line x1="60" y1="95" x2="248" y2="95" stroke="rgba(143,170,210,0.28)" strokeDasharray="4 5" />
        <text x="196" y="76" className="fig-tag">SOURCE</text>
        <line x1="60" y1="60" x2="60" y2="130" stroke="#7fe4fb" strokeWidth="1.2" opacity="0.5" />
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1={82 + i * 14} y1={70} x2={82 + i * 14} y2={120} stroke="#3fd0f0" strokeWidth="2" />
        ))}
        <text x="150" y="140" className="fig-tag fig-tag--cyan">VERTICAL — 50%</text>
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1={76 + i * 14} y1={40} x2={96 + i * 14} y2={40} stroke="#ffd479" strokeWidth="2" />
        ))}
        <text x="150" y="30" className="fig-tag fig-tag--amber">HORIZONTAL — 50%</text>
      </svg>
    </div>
  );
}

function NormalDiagram() {
  return (
    <div className="panel theory-figure">
      <p className="label">FIG. 3 — THE MEASUREMENT REFERENCE</p>
      <svg viewBox="0 0 460 210" className="theory-figure__svg" role="img" aria-label="The angle of incidence measured from the surface normal rather than from the surface">
        <line x1="40" y1="150" x2="420" y2="150" stroke="#7fe4fb" strokeOpacity="0.6" strokeWidth="1.6" />
        <line x1="230" y1="34" x2="230" y2="196" stroke="#9fb4ff" strokeOpacity="0.55" strokeDasharray="5 6" />
        <line x1="90" y1="58" x2="230" y2="150" stroke="#ff5f5f" strokeWidth="2" strokeLinecap="round" />
        <path d="M 230 108 A 42 42 0 0 0 258 80" fill="none" stroke="#ff8a8a" strokeWidth="1.6" />
        <text x="266" y="96" className="fig-tag fig-tag--red">θi FROM NORMAL</text>
        <path d="M 170 150 A 46 46 0 0 1 190 116" fill="none" stroke="#4c5a73" strokeWidth="1.4" />
        <text x="120" y="176" className="fig-tag">WRONG: FROM SURFACE</text>
        <text x="244" y="28" className="fig-tag">NORMAL</text>
        <text x="352" y="142" className="fig-tag fig-tag--cyan">INTERFACE</text>
      </svg>
    </div>
  );
}

function MalusMeter({ ratio }: { ratio: number }) {
  return (
    <div className="malus-meter">
      <div className="malus-meter__bar">
        <span style={{ width: `${ratio * 100}%` }} />
      </div>
      <div className="spread">
        <span className="label">TRANSMITTED</span>
        <span className="mono">{(ratio * 100).toFixed(1)}% of I₀</span>
      </div>
    </div>
  );
}

function BrewsterProof({
  result,
  thetaB,
}: {
  result: ReturnType<typeof computeOpticalResult>;
  thetaB: number;
}) {
  const atBrewster = Math.abs(result.incidenceDeg - thetaB) < 0.6;
  return (
    <div className="panel bracketed brewster-proof">
      <div className="brewster-proof__stats">
        <div>
          <span className="label">REFLECTED ↔ REFRACTED</span>
          <p className="brewster-proof__value numeric">
            {result.geometry.angleBetweenReflectedAndRefractedDeg?.toFixed(3) ?? '—'}°
          </p>
          <span className="note">equals 90° exactly at Brewster incidence</span>
        </div>
        <div>
          <span className="label">R<sub>p</sub> AT CURRENT ANGLE</span>
          <p className={`brewster-proof__value numeric${result.fresnel.Rp < 0.001 ? ' is-zero' : ''}`}>
            {result.fresnel.Rp.toExponential(3)}
          </p>
          <span className="note">{result.fresnel.Rp < 0.001 ? 'p component suppressed' : 'p component still reflecting'}</span>
        </div>
        <div>
          <span className="label">R<sub>s</sub> AT CURRENT ANGLE</span>
          <p className="brewster-proof__value numeric">{result.fresnel.Rs.toFixed(4)}</p>
          <span className="note">never vanishes for a dielectric</span>
        </div>
      </div>
      <p className={`brewster-proof__verdict${atBrewster ? ' is-matched' : ''}`}>
        {atBrewster
          ? '✓ Current geometry sits at the polarising condition: the reflected ray is purely s-polarised.'
          : `Away from θB by ${Math.abs(result.incidenceDeg - thetaB).toFixed(2)}° — the p component is still present.`}
      </p>
    </div>
  );
}
