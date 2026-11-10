# BREWSTER'S LAW LAB

**Verifying Brewster's Law and Finding the Brewster's Angle** — an interactive virtual optics
laboratory for the JIIT Noida Physics PBL.

A real computational model of a goniometer-based Brewster-angle bench: sweep the incidence angle,
switch specimen and medium, rotate the polariser, and watch the Fresnel s/p components separate
exactly as the equations say they must. The supplied experimental record — 19 angles × 3 specimens
= 57 readings — is preserved verbatim and can be inspected, plotted and exported.

> **The principle of this project:** a beautiful screen with fake calculations would be a failure,
> and correct calculations in an unpolished interface would also be a failure. Both are delivered,
> and the source data is never quietly rewritten to make the visuals look better.

---

## 1. Quick start

```bash
npm install        # install dependencies
npm run dev        # local development server (http://localhost:5173)
npm run build      # production build into dist/
npm run preview    # serve the production build locally
npm run typecheck  # TypeScript, no emit
npm run test       # full automated test suite
```

Requirements: Node.js **18+** (developed and verified on Node 22), npm 9+.
No environment variables, no API keys, no backend, no database, no analytics.

---

## 2. What is implemented

### Pages (all complete, all wired to real state)

| Route | Section | Contents |
|---|---|---|
| `/` | **The Optical Portal** | Full-viewport canvas navigator: eight sections, four real subtopics each, travel transitions, direct deep links |
| `/theory` | **Polarisation at the Interface** | 9 sections with live diagrams, Malus demonstration, interactive ray bench |
| `/apparatus` | **The Optical Train** | All 7 source components, custom SVG portraits, 500 mm rail map |
| `/experiment` | **Live Angular Measurement** | 3D optical bench, full control set, component assembly, live readouts, detector model |
| `/observations` | **Source Lab Record** | All 57 readings, material filter, minima highlighting, CSV export |
| `/analysis` | **Current Response / Incidence Angle** | Three data-driven charts, comparison view, interpretation |
| `/results` | **The Polarising Condition** | 58.1° / 56.7° / 57.51°, physical explanation, printable report |
| `/viva` | **Test Your Optics** | 24 experiment-specific questions, study and test modes, scoring, review |


### The Optical Portal (`src/portal/`)

The home route is a single-viewport navigator rather than a scrolling page. A
canvas aperture — a rounded rectangle sampled into 44 points and projected
through a fake perspective with focal length 850 — holds a live optical scene.
It tilts toward the pointer (clamped to ±16.5° / ±18.7°, relaxing to zero as it
expands), and travelling expands it until it covers the viewport, commits the
next section, and opens a fresh aperture.

Nothing is decorative. Every one of the eight destinations is a real route,
and its four subtopics are real topics of that section:

| File | Responsibility |
|---|---|
| `src/data/portal.ts` | Destination model: route, accent, scene kind, specimen preview, four subtopics, CTA label |
| `src/portal/sceneRenderer.ts` | Eight procedurally drawn scenes (pure Canvas 2D, no remote media) |
| `src/portal/maskEngine.ts` | Rounded-rect sampling, perspective projection, tilt smoothing, easing |
| `src/portal/usePortalExperience.ts` | Lifecycle: boot counter, render loop, pointer tilt, travel |
| `src/portal/PortalExperience.tsx` | Layout, keyboard ring, live announcements, deep links |

**No runtime CDN.** The reference interaction this is adapted from sampled remote
3D video; here every scene is drawn from the same physics result object the rest
of the app uses, so the portal works offline and cannot drift from the data. The
observations scene plots the exact Fresnel pair for the specimen, so R⟂ touches
zero precisely at θB; the results scene draws the three reported angles on a
graduated quadrant.

**Usable, not just pretty:**

- The boot counter has a visible **SKIP** control, and choosing a section during
  the boot honours the choice immediately — the intro can never trap you.
- `SKIP TO THE BENCH` in the header goes straight to `/experiment`, independent
  of any animation.
- Every destination carries a direct link (`href`), so `/theory` and friends work
  as real deep links with no portal visit required.
- Arrow keys walk the ring; the rail is a list of real buttons with
  `aria-current`; destination changes are announced through a live region.
- Below 980 px the section rail becomes a horizontal scrollable strip instead of
  disappearing, so narrow screens can still jump to any section.
- Readiness follows the mask, not a timer, plus a timeout guard — a throttled
  tab can never leave the travel button disabled.
- `prefers-reduced-motion` disables tilt, the custom cursor and all entrance
  animation, and shortens the transitions.

### The physics engine (`src/physics/`)

Pure functions only — no React, no Three.js, no DOM. One authoritative result object
(`OpticalResult`) is consumed by the 3D bench, the 2D diagram, the readouts, the charts and the
detector model, so graphics can never disagree with the numbers.

- **Brewster angle** — `θ_B = atan2(n₂, n₁)`, degrees at the API boundary, radians internally.
- **Snell's law** — returns a discriminated `refracted | total-internal-reflection` state. Never `NaN`.
- **Law of reflection** — `θ_r = θ_i`, measured from the normal.
- **Fresnel reflectance** — `R_s`, `R_p`, `R_unpol = (R_s + R_p)/2`, plus `T = 1 − R` for a lossless interface.
- **Polarisation** — Jones calculus for fully polarised (s / p / linear) input; a separate
  *incoherent* intensity treatment for unpolarised input, because that is what unpolarised light is.
  Malus's law is applied only to an ideal analyser in a plane-polarised beam.
- **Total internal reflection** — detected explicitly, with the critical angle reported and the
  transmitted ray suppressed rather than faked.
- **Detector model** — a clearly labelled *normalised* signal. Calibrated units appear only when the
  user supplies explicit calibration assumptions in the UI.

At Brewster incidence the engine drives `R_p → 0` (below `1e-12` for the supplied specimens) while
`R_s` stays substantial, and the reflected/refracted rays satisfy `θ_r + θ_t = 90°` to machine
precision. These are asserted in the test suite, not merely claimed here.

### Graphics

- **`OpticalBench3D`** — procedural Three.js bench: 500 mm rail with 10 mm / 50 mm graduations, laser
  head and power supply, kinematic mount, rotatable polariser with a visible transmission axis,
  glass specimen with physically-based transmission, graduated goniometer ring and detector arm,
  beam meshes with additive glow. Orbit/pan/zoom with sensible limits, side and top preset views,
  camera reset. Resource disposal and visibility handling are implemented.
- **`RayDiagram`** — exact SVG ray diagram driven by the same physics result. Always available, and
  automatically used whenever WebGL is missing or fails.
- **`OpticalPortal`** — procedural Canvas 2D aperture for the home page, with pointer parallax that
  moves the aperture, never the physics.
- **`ObservationChart`** — real data-driven chart with keyboard/tap/hover readouts, sampled-minimum
  highlights, reported-angle markers and an optional simulator fit.

### Performance

`RenderQualityController` watches a rolling window of frame deltas (median, not single spikes) and
steps quality down under sustained load. `FrameMeter` reports a rolling 500 ms FPS estimate in the
experiment page's performance strip. Rendering uses `requestAnimationFrame` against the display's
own cadence — **no 60 FPS cap is imposed** — with delta clamping after tab suspension and rendering
paused while the document is hidden. Physics precision is never reduced by a quality step.

---

## 3. Source-of-truth data and its provenance

All academic content is transcribed from the supplied project document:

> *Verifying Brewster's Law and finding the Brewster's angle* — Physics PBL, B.Tech Odd-I Semester,
> Jaypee Institute of Information Technology, Noida. Devansh Tripathi, 9923103148.

Stored **once**, in `src/data/observations.ts`, and imported everywhere:

```ts
export const INCIDENCE_ANGLES = [0, 5, 10, …, 90] as const;   // 19 values
export const TOPAZ_CURRENT   = [10.9945, 10.9810, …] as const; // 19 values
export const CROWN_CURRENT   = [10.9920, 10.9734, …] as const; // 19 values
export const FLINT_CURRENT   = [10.9936, 10.9782, …] as const; // 19 values
```

The unit label **`Current (I) in A`** is preserved exactly as printed. It is *not* silently converted
to mA, µA, volts or arbitrary units.

### Three concepts that must never be merged

| Concept | Value | Where it lives |
|---|---|---|
| **Source-reported Brewster angle** | Topaz **58.1°**, Crown **56.7°**, Flint **57.51°** | `src/data/results.ts` — authoritative, never recomputed |
| **Minimum sampled observation** | Topaz 60° @ 1.0793 A, Crown 55° @ 1.0610 A, Flint 60° @ 1.1374 A | derived by `sampledMinimum()` |
| **Simulator-derived fit** | parabolic vertex through the three samples around the minimum | `interpolateMinimum()`, labelled *derived analysis* in the UI |

The document does not state how it interpolated between its 5° samples, so the reported angles are
kept as the result and the simulator never overwrites them. The UI shows all three concepts side by
side, clearly labelled.

### Inferred refractive indices — read this before quoting them

The document gives no independently measured refractive indices for the specimens. The simulator
uses **effective calibration indices inferred from the reported angles** with `n₂ = n₁ tan θ_B`
(n₁ = 1.000 assumed):

| Material | Reported angle | Inferred n₂ |
|---|---:|---:|
| Topaz Glass | 58.1° | **1.6066** |
| Crown Glass | 56.7° | **1.5224** |
| Flint Glass | 57.51° | **1.5703** |

These are labelled *inferred/effective calibration values* in the interface and in the report. They
are **not** independent material-property measurements. Medium presets other than air (water,
ethanol, glycerine, immersion oil) are standard textbook values included for exploration only, each
with its provenance shown, and are not part of the source experiment.

Editing n₁, n₂ or the specimen index changes the **live theoretical physics only**. It cannot alter
the source table, the sampled minima, or the reported results.

---

## 4. Architecture

```text
src/
├── app/            App shell, routes table, error boundary, media-query hooks
├── components/
│   ├── controls/   AngleSlider + Toggle + Segmented + LabSelect, AngularDial, AssemblyPanel
│   ├── feedback/   Toast host, route fallback
│   ├── graphics/   OpticalBench (3D + fallback), RayDiagram (SVG), ObservationChart, ComponentArt
│   ├── layout/     OpticalAperture, LaboratoryFooter
│   ├── navigation/ NavBar with section status bar and mobile menu
│   └── panels/     ReadoutPanel (Fresnel, polarisation, detector)
├── data/           observations.ts (immutable), materials.ts, results.ts, viva.ts
├── experiment/     types, reducer store, apparatus model, assembly, measurements, persistence
├── export/         csv.ts, report.ts (print-ready HTML)
├── graphics/       OpticalBench3D.ts, RayDiagram2D.ts, OpticalPortal.ts, renderQuality.ts
├── physics/        types, angles, brewster, snell, fresnel, polarisation, detector, index
├── pages/          Home, Theory, Apparatus, Experiment, Observations, Analysis, Results, Viva, 404
└── styles/         tokens.css, global.css, motion.css, responsive.css
```

**Boundary rules enforced in the code**

- Physics is pure and DOM-free; it is imported by graphics, never the reverse.
- Graphics consume physics output; they never recompute an angle independently.
- Charts read the central dataset; they hold no private copy of the values.
- One experiment state tree (`useReducer` + context). Navigation never resets it.
- Persisted sessions are versioned, validated field by field, and can never restore or overwrite the
  source dataset.

**Coordinate conventions** are documented at the top of `src/physics/types.ts` (2D) and
`src/graphics/OpticalBench3D.ts` (3D, in centimetres, optical axis on +X).

---

## 5. Testing

```bash
npm run test        # 65 tests
npm run typecheck   # strict TypeScript
npm run build       # production build
```

Coverage:

- **`tests/physics.test.ts` (27)** — degree/radian conversion; Brewster angle for all three
  profiles; Brewster at 45° for matched media; Snell at normal and oblique incidence; total internal
  reflection either side of the critical angle; law of reflection; Fresnel bounds over a full sweep;
  normal-incidence value; `R_p → 0` and `R_s ≠ 0` at Brewster; grazing limit; unpolarised relation;
  Malus's law; crossed-analyser extinction at Brewster (and the real p-leakage just off it);
  s-polarised input handling; detector behaviour with the laser off and with/without calibration;
  input guarding and invalid-index errors.
- **`tests/data.test.ts` (8)** — 19 angles; exact array values; 19 readings per material and 57
  total; exact reported angles (58.1 / 56.7 / 57.51); exact sampled minima coordinates; minima
  distinct from reported angles; structural validation; CSV fidelity.
- **`tests/ui.test.tsx` (25)** — every route renders real content; navigation; all 19 table rows and
  the reported results; material filtering; start/laser/detector gating; incidence snap to Brewster;
  material switch updating the specimen index; side/top view switch; capture gated on the laser;
  clear/auto-assemble readiness; all seven apparatus components selectable; results page values;
  printable report contents; quiz scoring and explanation; corrupted-session recovery; 2D fallback
  when WebGL is unavailable.
- **`tests/geometry.test.ts` (5)** — the 3D bench's ray vectors are checked against the physics
  engine: reflection equals incidence, reflected ray stays in the normal half-space, refracted angle
  matches Snell for every specimen, TIR triggers at the same angle, and r·t = 0 at Brewster.

---

## 6. Deploying to Vercel

The repository is already configured. Two supported paths:

### Option A — import the Git repository (recommended)

1. Push this branch to GitHub (see below).
2. In Vercel: **Add New → Project → Import** the repository.
3. Vercel detects Vite automatically. Confirm the settings below and press **Deploy**.

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Install command | `npm install` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment variables | *none required* |

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel          # first deploy, links the project
vercel --prod   # production deploy
```

### Routing

`vercel.json` contains a catch-all rewrite to `index.html`, so **direct refresh works on every
route** (`/experiment`, `/theory`, `/results`, …) and browser back/forward behave correctly.
Hashed assets under `/assets/*` are served with a one-year immutable cache.

There is no SSR, no API route, no server runtime and no mandatory external resource: once the bundle
is loaded the simulator works offline.

### GitHub

```bash
git remote add origin https://github.com/<owner>/<repo>.git
git push -u origin main
```

---

## 7. Limitations, stated honestly

- **Live detector output is a model, not a measurement.** The source gives no responsivity, gain,
  collection efficiency, optical geometry or dark offset, so the Fresnel reflectance cannot be
  converted into the original amperes. The pages therefore show a labelled *normalised* signal, and
  calibrated units only after you enter explicit assumptions.
- **Refractive indices are inferred**, not measured — see §3.
- **The reported angles are the document's.** The simulator does not know the source's interpolation
  method and does not pretend to.
- **No FPS number is claimed here.** The experiment page includes a live rolling-window meter so you
  can measure on your own hardware; the app targets each display's own refresh cadence rather than a
  fixed 60 Hz cap.
- **WebGL** is optional. If it is unavailable or throws, the exact 2D ray bench takes over and all
  functionality except camera orbit remains.
- **Presets beyond the three supplied specimens** are standard textbook indices for exploration and
  are clearly separated from the experiment's materials.

---

## 8. Accessibility

Semantic landmarks, skip link, labelled range and number inputs, `aria-pressed` on every toggle and
tab-like control, `role="status"` live regions for acquisition and scoring changes, keyboard-
operable navigation, canvas scenes accompanied by a text summary of their essential measurements,
data tables readable without relying on colour, visible focus styling throughout, and a
`prefers-reduced-motion` path that removes decorative motion without disabling any experiment
function.

---

## 9. Licence

MIT. Academic content belongs to its original author and institution.
