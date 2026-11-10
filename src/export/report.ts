import {
  CURRENT_UNIT,
  INCIDENCE_ANGLES,
  MATERIALS,
  TOTAL_SOURCE_READINGS,
  sampledMinimum,
} from '../data/observations';
import { AIM, REPORTED_RESULTS, SOURCE_CITATION, SOURCE_CONCLUSION } from '../data/results';

/**
 * Builds a self-contained, print-ready HTML academic report.
 *
 * Printing is done through the browser (window.print on a detached iframe),
 * so no server-side PDF service is involved and all core functionality works
 * from a static deployment.
 */
export function buildReportHtml(): string {
  const minimumRows = MATERIALS.map((material) => {
    const minimum = sampledMinimum(material);
    return `<tr><td>${material.name}</td><td>${material.sourceReportedBrewsterAngleDeg}°</td><td>${minimum.angleDeg}°</td><td>${minimum.currentA.toFixed(4)} A</td></tr>`;
  }).join('');

  const observationRows = INCIDENCE_ANGLES.map((angle, index) => {
    const cells = MATERIALS.map((material) => material.observations[index].currentA.toFixed(4)).join('</td><td>');
    return `<tr><td>${index + 1}</td><td>${angle}</td><td>${cells}</td></tr>`;
  }).join('');

  const resultCards = REPORTED_RESULTS.map(
    (reported) => `<div class="result"><span>${reported.label}</span><strong>${reported.display}</strong></div>`,
  ).join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Brewster's Law — Experiment Report</title>
<style>
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #16181d; line-height: 1.5; font-size: 10.5pt; margin: 0; }
  header { border-bottom: 2px solid #16181d; padding-bottom: 10px; margin-bottom: 16px; }
  .kicker { font-family: 'Courier New', monospace; font-size: 8pt; letter-spacing: 0.22em; text-transform: uppercase; color: #555; }
  h1 { font-size: 20pt; margin: 6px 0 4px; letter-spacing: -0.01em; }
  h2 { font-size: 12pt; text-transform: uppercase; letter-spacing: 0.1em; margin: 20px 0 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  h3 { font-size: 10.5pt; margin: 12px 0 4px; }
  p { margin: 0 0 8px; }
  .meta { font-size: 8.5pt; color: #555; font-family: 'Courier New', monospace; }
  .aim { font-style: italic; }
  .formula { font-family: 'Courier New', monospace; background: #f4f5f7; padding: 8px 10px; border-left: 3px solid #333; margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 8.6pt; font-family: 'Courier New', monospace; }
  th, td { border: 1px solid #c8ccd4; padding: 3px 6px; text-align: right; }
  th { background: #eceef2; text-align: center; font-size: 8pt; }
  td:first-child, th:first-child, td:nth-child(2), th:nth-child(2) { text-align: left; }
  .results { display: flex; gap: 10px; margin: 10px 0; }
  .result { flex: 1; border: 1px solid #c8ccd4; padding: 10px; text-align: center; }
  .result span { display: block; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.12em; color: #555; }
  .result strong { font-size: 17pt; font-family: 'Courier New', monospace; }
  .note { font-size: 8.6pt; color: #555; }
  ol, ul { margin: 0 0 8px 18px; padding: 0; }
  li { margin-bottom: 3px; }
  footer { margin-top: 24px; border-top: 1px solid #ccc; padding-top: 8px; font-size: 8pt; color: #666; }
  .page-break { page-break-before: always; }
  @media print { body { font-size: 10pt; } }
</style>
</head>
<body>
<header>
  <p class="kicker">Jaypee Institute of Information Technology, Noida · B.Tech Odd-I Semester</p>
  <h1>Verifying Brewster's Law and Finding the Brewster's Angle</h1>
  <p class="meta">PHYSICS PBL · Project Report · Generated from the Brewster's Law Lab simulator</p>
</header>

<h2>Aim</h2>
<p class="aim">${AIM}</p>

<h2>Theory</h2>
<p>Natural light is unpolarised: it may be represented as two incoherent, orthogonal, linearly polarised components of equal average intensity. When unpolarised light is incident on a transparent dielectric interface, the reflected light becomes completely linearly polarised at the polarising (Brewster) angle, at which the p-polarised reflected component vanishes. The s-polarised component continues to reflect, so the total reflected intensity does not become zero.</p>
<div class="formula">tan θ<sub>B</sub> = n₂ / n₁ &nbsp;&nbsp;&nbsp; θ<sub>B</sub> = tan⁻¹(n₂ / n₁)</div>
<p>At Brewster incidence the reflected and refracted rays are perpendicular:</p>
<div class="formula">θ<sub>r</sub> + θ<sub>t</sub> = 90°</div>
<p>Snell's law at the interface: n₁ sin θ<sub>i</sub> = n₂ sin θ<sub>t</sub>. Fresnel power reflectances for the two polarisations are</p>
<div class="formula">R<sub>s</sub> = |(n₁cosθ<sub>i</sub> − n₂cosθ<sub>t</sub>) / (n₁cosθ<sub>i</sub> + n₂cosθ<sub>t</sub>)|² &nbsp;&nbsp;&nbsp; R<sub>p</sub> = |(n₂cosθ<sub>i</sub> − n₁cosθ<sub>t</sub>) / (n₂cosθ<sub>i</sub> + n₁cosθ<sub>t</sub>)|²</div>

<h2>Apparatus</h2>
<ol>
  <li>Diode laser with power supply — 3 mW, 650 nm, red</li>
  <li>Kinematic laser mount</li>
  <li>Polariser</li>
  <li>Goniometer-based detector mount</li>
  <li>Glass slide specimen</li>
  <li>Pinhole photodetector with power supply</li>
  <li>Optical rail — 500 mm</li>
</ol>

<h2>Observations</h2>
<p class="note">${INCIDENCE_ANGLES.length} angles of incidence × ${MATERIALS.length} specimens = ${TOTAL_SOURCE_READINGS} readings. Column units are preserved exactly as ${CURRENT_UNIT}.</p>
<table>
  <thead>
    <tr><th>Sr No.</th><th>Angle of Incidence (°)</th>${MATERIALS.map((material) => `<th>${material.name} — ${CURRENT_UNIT}</th>`).join('')}</tr>
  </thead>
  <tbody>${observationRows}</tbody>
</table>

<h2 class="page-break">Reported Brewster Angles</h2>
<div class="results">${resultCards}</div>
<p>${SOURCE_CONCLUSION}</p>

<h2>Sampled Minima versus Reported Angles</h2>
<table>
  <thead><tr><th>Material</th><th>Reported Brewster angle</th><th>Minimum sampled angle</th><th>Minimum sampled current</th></tr></thead>
  <tbody>${minimumRows}</tbody>
</table>
<p class="note">The tabulated samples are spaced by 5°, so the tabulated minimum need not coincide with the reported angle. The source document does not state the interpolation or curve-fitting method used to obtain its reported angles; those reported values therefore stand as the authoritative experimental results and are not recomputed here.</p>

<h2>Conclusion</h2>
<p>The experiment verifies Brewster's law by determining the incidence angle associated with maximum polarisation of the reflected light, identified in the supplied observations through the minimum-current region. The reported Brewster angles are 58.1° for Topaz Glass, 56.7° for Crown Glass, and 57.51° for Flint Glass.</p>

<footer>
  ${SOURCE_CITATION}<br />
  Calibration note: the specimen refractive indices used by the simulator (n₂ ≈ 1.6066, 1.5224, 1.5703 for n₁ = 1) are <em>inferred</em> from the reported angles via n₂ = n₁ tan θ<sub>B</sub>. They are not independent material measurements from the source document.
</footer>
</body>
</html>`;
}

/** Opens the report in a hidden iframe and triggers the browser print dialog. */
export function printReport(): void {
  const html = buildReportHtml();
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  document.body.appendChild(frame);

  const cleanup = () => {
    window.setTimeout(() => frame.remove(), 1200);
  };

  frame.onload = () => {
    const win = frame.contentWindow;
    if (!win) {
      cleanup();
      return;
    }
    win.focus();
    win.print();
    cleanup();
  };

  const doc = frame.contentWindow?.document;
  if (!doc) {
    cleanup();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
}
