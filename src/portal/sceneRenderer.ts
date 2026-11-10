import type { PortalSceneData, PortalSceneKind } from '../data/portal';

/**
 * ============================================================================
 *  PROCEDURAL PORTAL SCENES
 * ============================================================================
 *  The reference experience sampled remote 3D footage. This laboratory has a
 *  hard contract: no runtime CDN, no remote media, and everything must work
 *  offline after the bundle loads. So each destination instead renders a
 *  purpose-built optical scene entirely in Canvas 2D — beams, glass, angular
 *  scales, interference and data plots — driven by the same physics result
 *  object as the rest of the app.
 *
 *  A scene is a pure function of (kind, geometry, time). No state is cached
 *  between frames, so the portal can be drawn at any size and device ratio.
 * ============================================================================
 */

export interface SceneFrame {
  readonly ctx: CanvasRenderingContext2D;
  readonly width: number;
  readonly height: number;
  readonly time: number;
  readonly data: PortalSceneData;
  readonly reducedMotion: boolean;
}

export function drawPortalScene(frame: SceneFrame): void {
  const { ctx, width, height } = frame;
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Shared base: deep optical environment, never flat black.
  const base = ctx.createRadialGradient(
    width * 0.5,
    height * 0.34,
    Math.min(width, height) * 0.06,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.78,
  );
  base.addColorStop(0, 'rgba(22, 44, 82, 0.92)');
  base.addColorStop(0.52, 'rgba(9, 17, 34, 0.95)');
  base.addColorStop(1, 'rgba(3, 5, 11, 1)');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  drawWavefronts(frame);
  drawGrid(frame);

  switch (frame.data.kind) {
    case 'theory':
      drawTheory(frame);
      break;
    case 'apparatus':
      drawApparatus(frame);
      break;
    case 'experiment':
      drawExperiment(frame);
      break;
    case 'observations':
      drawObservations(frame);
      break;
    case 'analysis':
      drawAnalysis(frame);
      break;
    case 'results':
      drawResults(frame);
      break;
    case 'viva':
      drawViva(frame);
      break;
    case 'hero':
    default:
      drawHero(frame);
      break;
  }

  drawVignette(frame);
  ctx.restore();
}

/* -------------------------------------------------------------------------- */
/* shared layers                                                              */
/* -------------------------------------------------------------------------- */

function drawWavefronts({ ctx, width, height, time, reducedMotion, data }: SceneFrame): void {
  const cx = width * 0.5;
  const cy = height * 0.42;
  const span = Math.max(width, height);
  const drift = reducedMotion ? 0 : (time / 9000) % 1;
  ctx.save();
  for (let i = 0; i < 6; i += 1) {
    const phase = (drift + i / 6) % 1;
    const radius = span * (0.1 + phase * 0.62);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = hexToRgba(data.accent, (1 - phase) * 0.13);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

function drawGrid({ ctx, width, height }: SceneFrame): void {
  const step = Math.max(46, Math.min(width, height) / 11);
  ctx.save();
  ctx.strokeStyle = 'rgba(143,170,210,0.055)';
  ctx.lineWidth = 1;
  for (let x = step; x < width; x += step) {
    ctx.beginPath();
    ctx.moveTo(Math.round(x) + 0.5, 0);
    ctx.lineTo(Math.round(x) + 0.5, height);
    ctx.stroke();
  }
  for (let y = step; y < height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, Math.round(y) + 0.5);
    ctx.lineTo(width, Math.round(y) + 0.5);
    ctx.stroke();
  }
  ctx.restore();
}

function drawVignette({ ctx, width, height }: SceneFrame): void {
  const vignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.22,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.72,
  );
  vignette.addColorStop(0, 'rgba(3,5,11,0)');
  vignette.addColorStop(1, 'rgba(3,5,11,0.88)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

/** The interface + three rays, drawn from the physics result. */
function drawInterfaceScene(
  frame: SceneFrame,
  options: {
    readonly originY?: number;
    readonly beam?: number;
    readonly showBrewster?: boolean;
    readonly showGlass?: boolean;
    readonly showLabels?: boolean;
  } = {},
): { originX: number; originY: number } {
  const { ctx, width, height, data, time, reducedMotion } = frame;
  const originX = width * 0.5;
  const originY = height * (options.originY ?? 0.56);
  const beam = options.beam ?? Math.max(width, height) * 0.42;

  const thI = (data.incidenceDeg * Math.PI) / 180;
  const thT = data.refractionDeg === null ? null : (data.refractionDeg * Math.PI) / 180;
  const thB = (data.brewsterDeg * Math.PI) / 180;

  // glass body
  if (options.showGlass !== false) {
    const glassW = width * 0.78;
    const glassH = height - originY;
    const grad = ctx.createLinearGradient(0, originY, 0, originY + glassH);
    grad.addColorStop(0, hexToRgba(data.accent, 0.3));
    grad.addColorStop(0.5, hexToRgba(data.accent, 0.1));
    grad.addColorStop(1, 'rgba(18,34,60,0.5)');
    ctx.beginPath();
    ctx.moveTo(originX - glassW / 2, originY);
    ctx.lineTo(originX + glassW / 2, originY);
    ctx.lineTo(originX + glassW / 2 - 16, height);
    ctx.lineTo(originX - glassW / 2 + 16, height);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = hexToRgba(data.accent, 0.4);
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(originX - glassW / 2, originY);
    ctx.lineTo(originX + glassW / 2, originY);
    ctx.strokeStyle = 'rgba(232,251,255,0.74)';
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }

  // normal
  ctx.save();
  ctx.setLineDash([5, 8]);
  ctx.beginPath();
  ctx.moveTo(originX, originY - beam * 0.66);
  ctx.lineTo(originX, originY + beam * 0.5);
  ctx.strokeStyle = 'rgba(159,180,255,0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Brewster reference
  if (options.showBrewster !== false) {
    ctx.save();
    ctx.setLineDash([3, 9]);
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(originX + Math.sin(thB) * beam * 0.74, originY - Math.cos(thB) * beam * 0.74);
    ctx.strokeStyle = 'rgba(247,183,61,0.5)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.setLineDash([]);
    const bx = originX + Math.sin(thB) * beam * 0.74;
    const by = originY - Math.cos(thB) * beam * 0.74;
    ctx.beginPath();
    ctx.arc(bx, by, 2.6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(247,183,61,0.95)';
    ctx.fill();
    if (options.showLabels !== false) {
      ctx.font = '500 10px ui-monospace, Menlo, monospace';
      ctx.fillStyle = 'rgba(247,183,61,0.92)';
      ctx.fillText(`θB ${data.brewsterDeg.toFixed(2)}°`, bx + 8, by + 3);
    }
    ctx.restore();
  }

  // beams
  const shimmer = reducedMotion ? 1 : 0.88 + Math.sin(time / 620) * 0.12;
  drawBeam(
    ctx,
    originX - Math.sin(thI) * beam,
    originY - Math.cos(thI) * beam,
    originX,
    originY,
    '255,90,90',
    2.6 * shimmer,
  );
  drawBeam(
    ctx,
    originX,
    originY,
    originX + Math.sin(thI) * beam,
    originY - Math.cos(thI) * beam,
    '255,110,110',
    (1.4 + Math.sqrt(Math.max(0, data.reflectedFraction)) * 3.4) * shimmer,
  );
  if (thT !== null) {
    drawBeam(
      ctx,
      originX,
      originY,
      originX + Math.sin(thT) * beam * 0.9,
      originY + Math.cos(thT) * beam * 0.9,
      '63,208,240',
      2.2 * shimmer,
    );
  }

  // Angle arcs. The incident beam lives on the LEFT of the normal, so its
  // arc is mirrored onto that side (negate the sweep) — otherwise θi would be
  // drawn between the normal and the *reflected* ray, which is θr, not θi.
  drawArc(ctx, originX, originY, beam * 0.2, 0, -data.incidenceDeg, 'up', 'rgba(255,140,140,0.85)');
  drawArc(ctx, originX, originY, beam * 0.26, 0, -data.incidenceDeg, 'up', 'rgba(255,110,110,0.45)');
  if (data.refractionDeg !== null) {
    // The transmitted ray continues on the far (right) side of the normal.
    drawArc(ctx, originX, originY, beam * 0.22, 0, data.refractionDeg, 'down', hexToRgba(data.accent, 0.8));
  }

  if (options.showLabels !== false) {
    const ta = thI / 2;
    ctx.font = '500 11px ui-monospace, Menlo, monospace';
    ctx.fillStyle = 'rgba(255,157,157,0.95)';
    ctx.fillText(
      `θi ${data.incidenceDeg.toFixed(1)}°`,
      originX - Math.sin(ta) * beam * 0.3 - 30,
      originY - Math.cos(ta) * beam * 0.3 + 4,
    );
    if (data.refractionDeg !== null) {
      const tt = ((data.refractionDeg * Math.PI) / 180) / 2;
      ctx.fillStyle = hexToRgba(data.accent, 0.95);
      ctx.fillText(
        `θt ${data.refractionDeg.toFixed(1)}°`,
        originX + Math.sin(tt) * beam * 0.34 + 18,
        originY + Math.cos(tt) * beam * 0.32 + 4,
      );
    }
  }

  // origin node
  ctx.beginPath();
  ctx.arc(originX, originY, 3.4, 0, Math.PI * 2);
  ctx.fillStyle = '#e8fbff';
  ctx.fill();

  return { originX, originY };
}

function drawBeam(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rgb: string,
  width: number,
): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = `rgba(${rgb},0.16)`;
  ctx.lineWidth = width * 6;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.strokeStyle = `rgba(${rgb},0.9)`;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,248,248,0.7)';
  ctx.lineWidth = width * 0.34;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawArc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  fromDeg: number,
  toDeg: number,
  side: 'up' | 'down',
  colour: string,
): void {
  const start = Math.min(fromDeg, toDeg);
  const end = Math.max(fromDeg, toDeg);
  ctx.save();
  ctx.beginPath();
  const steps = Math.max(6, Math.ceil((end - start) / 3));
  for (let i = 0; i <= steps; i += 1) {
    const angle = ((start + ((end - start) * i) / steps) * Math.PI) / 180;
    const x = cx + Math.sin(angle) * radius;
    const y = side === 'up' ? cy - Math.cos(angle) * radius : cy + Math.cos(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = colour;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.restore();
}

/* -------------------------------------------------------------------------- */
/* per-section scenes                                                         */
/* -------------------------------------------------------------------------- */

function drawHero(frame: SceneFrame): void {
  const { ctx, width, height, data, time, reducedMotion } = frame;
  const { originX, originY } = drawInterfaceScene(frame, { originY: 0.62, beam: Math.max(width, height) * 0.46 });

  // polarisation ticks travelling along the incident beam
  const thI = (data.incidenceDeg * Math.PI) / 180;
  const beam = Math.max(width, height) * 0.46;
  ctx.save();
  for (let i = 0; i < 16; i += 1) {
    const progress = reducedMotion ? i / 16 : ((time / 3200) + i / 16) % 1;
    const px = originX - Math.sin(thI) * beam * (1 - progress);
    const py = originY - Math.cos(thI) * beam * (1 - progress);
    const len = 4 + Math.sin(progress * Math.PI) * 6;
    ctx.beginPath();
    ctx.moveTo(px - len, py);
    ctx.lineTo(px + len, py);
    ctx.strokeStyle = `rgba(255,212,121,${0.1 + progress * 0.5})`;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
  ctx.restore();

  // specimen label
  ctx.save();
  ctx.font = '600 10px ui-monospace, Menlo, monospace';
  ctx.fillStyle = 'rgba(232,251,255,0.5)';
  ctx.textAlign = 'center';
  ctx.fillText(`n₂ ${data.n2.toFixed(4)}`, originX, originY + height * 0.16);
  ctx.restore();
}

function drawTheory(frame: SceneFrame): void {
  const { ctx, width, height, data, time, reducedMotion } = frame;
  drawInterfaceScene(frame, { originY: 0.62, beam: Math.min(width, height) * 0.42, showLabels: true });

  // Two orthogonal polarisation axes in the incident medium: the unpolarised
  // beam mixes both, which is the whole premise of the experiment.
  const cx = width * 0.22;
  const cy = height * 0.26;
  const size = Math.min(width, height) * 0.085;
  const wobble = reducedMotion ? 0 : Math.sin(time / 1500) * 0.16;
  ctx.save();
  ctx.translate(cx, cy);

  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.32, wobble, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(159,180,255,0.5)';
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.32, size, -wobble, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-size, 0);
  ctx.lineTo(size, 0);
  ctx.strokeStyle = hexToRgba(data.accent, 0.9);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(0, size);
  ctx.strokeStyle = 'rgba(255,212,121,0.9)';
  ctx.stroke();

  ctx.font = '600 10px ui-monospace, Menlo, monospace';
  ctx.fillStyle = hexToRgba(data.accent, 0.95);
  ctx.fillText('R∥', size * 0.72, -5);
  ctx.fillStyle = 'rgba(255,212,121,0.95)';
  ctx.fillText('R⟂', 7, -size * 0.66);

  ctx.font = '500 8px ui-monospace, Menlo, monospace';
  ctx.fillStyle = 'rgba(143,170,210,0.65)';
  ctx.fillText('UNPOLARISED', -size * 1.15, size + 16);
  ctx.fillText('INCIDENT', -size * 1.15, size + 26);
  ctx.restore();

  // The law, stated honestly: the right angle is a consequence of *reaching*
  // Brewster incidence, so we only claim it when we are actually there.
  const atBrewster = Math.abs(data.incidenceDeg - data.brewsterDeg) < 0.5;
  const sum = data.incidenceDeg + (data.refractionDeg ?? 0);
  ctx.save();
  ctx.font = '500 9px ui-monospace, Menlo, monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = atBrewster ? 'rgba(120,230,170,0.9)' : 'rgba(143,170,210,0.7)';
  ctx.fillText(
    atBrewster
      ? `θi + θt = ${sum.toFixed(1)}°  ·  RIGHT ANGLE`
      : `θi + θt = ${sum.toFixed(1)}°  (90° only at θB)`,
    width * 0.9,
    height * 0.2,
  );
  ctx.fillStyle = 'rgba(247,183,61,0.8)';
  ctx.fillText(`tan θB = n₂ / n₁ = ${data.n2.toFixed(4)}`, width * 0.9, height * 0.2 + 14);
  ctx.restore();
}

function drawApparatus(frame: SceneFrame): void {
  const { ctx, width, height, data, time, reducedMotion } = frame;
  const railY = height * 0.68;
  const railLeft = width * 0.1;
  const railRight = width * 0.9;
  const railWidth = railRight - railLeft;
  const labelY = railY + 38;

  // rail body
  ctx.save();
  const railGrad = ctx.createLinearGradient(0, railY, 0, railY + 14);
  railGrad.addColorStop(0, 'rgba(44,58,86,0.98)');
  railGrad.addColorStop(1, 'rgba(16,23,38,0.98)');
  ctx.fillStyle = railGrad;
  ctx.fillRect(railLeft, railY, railWidth, 13);
  ctx.strokeStyle = hexToRgba(data.accent, 0.3);
  ctx.lineWidth = 1;
  ctx.strokeRect(railLeft + 0.5, railY + 0.5, railWidth - 1, 12);

  // graduations every 10 mm, emphasised every 50 mm
  for (let i = 0; i <= 50; i += 1) {
    const x = railLeft + (railWidth * i) / 50;
    const major = i % 5 === 0;
    ctx.beginPath();
    ctx.moveTo(x, railY);
    ctx.lineTo(x, railY - (major ? 9 : 4));
    ctx.strokeStyle = major ? 'rgba(247,183,61,0.85)' : hexToRgba(data.accent, 0.4);
    ctx.lineWidth = major ? 1.2 : 0.8;
    ctx.stroke();
  }
  ctx.font = '500 7px ui-monospace, Menlo, monospace';
  ctx.fillStyle = 'rgba(143,170,210,0.55)';
  ctx.textAlign = 'center';
  ctx.fillText('0', railLeft, railY + 22);
  ctx.fillText('250 mm', railLeft + railWidth / 2, railY + 22);
  ctx.fillText('500 mm', railRight, railY + 22);
  ctx.restore();

  // The seven components of the published apparatus list, each labelled.
  const items: Array<{ at: number; label: string; kind: 'laser' | 'post' | 'glass' | 'ring' }> = [
    { at: 0.04, label: 'LASER', kind: 'laser' },
    { at: 0.2, label: 'POLARISER', kind: 'ring' },
    { at: 0.34, label: 'SLIT', kind: 'post' },
    { at: 0.5, label: 'SPECIMEN', kind: 'glass' },
    { at: 0.64, label: 'GONIOMETER', kind: 'ring' },
    { at: 0.8, label: 'DETECTOR', kind: 'post' },
    { at: 0.94, label: 'READOUT', kind: 'post' },
  ];

  items.forEach((item, index) => {
    const x = railLeft + railWidth * item.at;
    const towerHeight = height * (item.kind === 'glass' ? 0.2 : 0.13);
    const topY = railY - towerHeight;
    ctx.save();

    // post
    ctx.strokeStyle = 'rgba(120,140,175,0.55)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x, railY);
    ctx.lineTo(x, topY);
    ctx.stroke();
    // base clamp
    ctx.fillStyle = 'rgba(52,68,96,0.95)';
    ctx.fillRect(x - 7, railY - 5, 14, 5);

    if (item.kind === 'laser') {
      const pulse = reducedMotion ? 0.9 : 0.55 + Math.sin(time / 460) * 0.4;
      ctx.fillStyle = 'rgba(38,52,78,0.98)';
      ctx.fillRect(x - 6, topY - 9, 20, 18);
      ctx.beginPath();
      ctx.arc(x + 16, topY, 3.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,70,70,${pulse})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 16, topY, 8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,70,70,${pulse * 0.16})`;
      ctx.fill();
    } else if (item.kind === 'glass') {
      // the specimen, tilted to Brewster incidence
      const tilt = (data.brewsterDeg * Math.PI) / 180;
      ctx.translate(x, topY + 12);
      ctx.rotate(tilt * 0.24);
      const gw = 10;
      const gh = 30;
      const g = ctx.createLinearGradient(-gw, 0, gw, 0);
      g.addColorStop(0, hexToRgba(data.accent, 0.5));
      g.addColorStop(0.5, 'rgba(232,251,255,0.42)');
      g.addColorStop(1, hexToRgba(data.accent, 0.5));
      ctx.fillStyle = g;
      ctx.fillRect(-gw / 2, -gh / 2, gw, gh);
      ctx.strokeStyle = 'rgba(232,251,255,0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-gw / 2, -gh / 2, gw, gh);
    } else if (item.kind === 'ring') {
      ctx.beginPath();
      ctx.arc(x, topY + 4, 10, 0, Math.PI * 2);
      ctx.strokeStyle = hexToRgba(data.accent, 0.85);
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, topY + 4, 4, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(data.accent, 0.35);
      ctx.fill();
      // graduation arm
      ctx.beginPath();
      ctx.moveTo(x, topY + 4);
      ctx.lineTo(x + Math.cos(-0.7 + index) * 14, topY + 4 + Math.sin(-0.7 + index) * 14);
      ctx.strokeStyle = 'rgba(247,183,61,0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(36,50,74,0.98)';
      ctx.fillRect(x - 5, topY, 10, 20);
      ctx.strokeStyle = hexToRgba(data.accent, 0.6);
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 5, topY, 10, 20);
    }

    // component label
    ctx.font = '600 7px ui-monospace, Menlo, monospace';
    ctx.fillStyle = 'rgba(232,251,255,0.62)';
    ctx.textAlign = 'center';
    ctx.fillText(item.label, x, labelY + (index % 2 === 0 ? 0 : 13));
    if (index % 2 === 0) {
      ctx.strokeStyle = 'rgba(143,170,210,0.2)';
      ctx.beginPath();
      ctx.moveTo(x, topY - 14);
      ctx.lineTo(x, labelY - 9);
      ctx.stroke();
    }
    ctx.restore();
  });

  // the beam, drawn last so it reads as light passing the train
  const beamY = railY - height * 0.2;
  ctx.save();
  const beamGrad = ctx.createLinearGradient(railLeft, beamY, railRight, beamY);
  beamGrad.addColorStop(0, 'rgba(255,70,70,0.95)');
  beamGrad.addColorStop(0.5, 'rgba(255,120,120,0.7)');
  beamGrad.addColorStop(1, hexToRgba(data.accent, 0.65));
  ctx.strokeStyle = beamGrad;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(railLeft + railWidth * 0.04, beamY);
  ctx.lineTo(railRight + 6, beamY);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,180,180,0.16)';
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.restore();
}

function drawExperiment(frame: SceneFrame): void {
  const { ctx, width, height, data } = frame;
  drawInterfaceScene(frame, { originY: 0.5, beam: Math.min(width, height) * 0.4, showLabels: false });

  // detector gauge on the reflected beam
  const cx = width * 0.78;
  const cy = height * 0.26;
  const radius = Math.min(width, height) * 0.1;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.arc(0, 0, radius, Math.PI * 0.75, Math.PI * 2.25);
  ctx.strokeStyle = 'rgba(143,170,210,0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const fraction = Math.min(1, Math.max(0, data.reflectedFraction * 3.4));
  ctx.beginPath();
  ctx.arc(0, 0, radius, Math.PI * 0.75, Math.PI * 0.75 + Math.PI * 1.5 * fraction);
  ctx.strokeStyle = hexToRgba(data.accent, 0.95);
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.font = '600 12px ui-monospace, Menlo, monospace';
  ctx.fillStyle = 'rgba(232,251,255,0.9)';
  ctx.textAlign = 'center';
  ctx.fillText(`${(data.reflectedFraction * 100).toFixed(1)}%`, 0, 2);
  ctx.font = '500 8px ui-monospace, Menlo, monospace';
  ctx.fillStyle = 'rgba(143,170,210,0.75)';
  ctx.fillText('R UNPOL', 0, 16);
  ctx.restore();
}

function drawObservations(frame: SceneFrame): void {
  const { ctx, width, height, data } = frame;
  const left = width * 0.14;
  const right = width * 0.86;
  const top = height * 0.18;
  const bottom = height * 0.74;
  const plotW = right - left;
  const plotH = bottom - top;

  ctx.save();

  // axes + grid
  ctx.strokeStyle = 'rgba(143,170,210,0.16)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = top + (plotH * i) / 4;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
    ctx.font = '500 8px ui-monospace, Menlo, monospace';
    ctx.fillStyle = 'rgba(143,170,210,0.5)';
    ctx.textAlign = 'right';
    ctx.fillText(`${100 - i * 25}`, left - 8, y + 3);
  }
  for (let i = 0; i <= 9; i += 1) {
    const x = left + (plotW * i) / 9;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.strokeStyle = 'rgba(143,170,210,0.1)';
    ctx.stroke();
    ctx.font = '500 8px ui-monospace, Menlo, monospace';
    ctx.fillStyle = 'rgba(143,170,210,0.6)';
    ctx.textAlign = 'center';
    ctx.fillText(`${i * 10}°`, x, bottom + 14);
  }
  ctx.strokeStyle = 'rgba(143,170,210,0.24)';
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left, bottom);
  ctx.lineTo(right, bottom);
  ctx.stroke();

  // Exact Fresnel reflectance for this specimen. Two curves, because the
  // whole point of Brewster's law is that they behave differently: R_s climbs
  // monotonically while R_p collapses to zero at θB.
  type Pt = [number, number, number];
  const sCurve: Pt[] = [];
  const pCurve: Pt[] = [];
  for (let angle = 0; angle <= 90; angle += 1) {
    const thI = (angle * Math.PI) / 180;
    const sinT = Math.sin(thI) / data.n2;
    const thT = Math.asin(Math.min(1, sinT));
    const cosI = Math.cos(thI);
    const cosT = Math.cos(thT);
    const rs = Math.abs((cosI - data.n2 * cosT) / (cosI + data.n2 * cosT));
    const rp = Math.abs((data.n2 * cosI - cosT) / (data.n2 * cosI + cosT));
    const x = left + (plotW * angle) / 90;
    sCurve.push([x, bottom - plotH * Math.min(1, rs * rs), angle]);
    pCurve.push([x, bottom - plotH * Math.min(1, rp * rp), angle]);
  }

  const strokeCurve = (curve: Pt[], colour: string) => {
    ctx.beginPath();
    curve.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.strokeStyle = colour;
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  // s-polarisation (reflected strongly at every angle)
  strokeCurve(sCurve, 'rgba(255,110,110,0.85)');
  // p-polarisation (the one that vanishes) plus its fill
  const fill = ctx.createLinearGradient(0, top, 0, bottom);
  fill.addColorStop(0, hexToRgba(data.accent, 0.26));
  fill.addColorStop(1, hexToRgba(data.accent, 0));
  ctx.beginPath();
  pCurve.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.lineTo(right, bottom);
  ctx.lineTo(left, bottom);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  strokeCurve(pCurve, hexToRgba(data.accent, 0.98));

  // the measured minimum is the intersection with the axis
  const bx = left + (plotW * data.brewsterDeg) / 90;
  ctx.save();
  ctx.setLineDash([4, 5]);
  ctx.beginPath();
  ctx.moveTo(bx, top);
  ctx.lineTo(bx, bottom);
  ctx.strokeStyle = 'rgba(247,183,61,0.85)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(bx, bottom, 3.2, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd479';
  ctx.fill();

  ctx.font = '600 9px ui-monospace, Menlo, monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(247,183,61,0.95)';
  ctx.fillText(`θB ${data.brewsterDeg.toFixed(2)}°`, bx + 6, top + 10);

  // Labels use ⟂ / ∥ rather than s / p: at this size a monospace "p" reads
  // as an "f", which makes the two curves ambiguous.
  ctx.font = '600 11px ui-monospace, Menlo, monospace';
  ctx.fillStyle = 'rgba(255,130,130,0.95)';
  ctx.fillText('R⟂', right - 24, top + 12);
  ctx.fillStyle = hexToRgba(data.accent, 0.98);
  ctx.fillText('R∥', right - 24, top + 28);
  ctx.font = '500 8px ui-monospace, Menlo, monospace';
  ctx.fillStyle = 'rgba(143,170,210,0.6)';
  ctx.textAlign = 'right';
  ctx.fillText('REFLECTANCE %', left - 8, top - 8);
  ctx.restore();
}

function drawAnalysis(frame: SceneFrame): void {
  drawObservations(frame);
}

function drawResults(frame: SceneFrame): void {
  const { ctx, width, height, data, time, reducedMotion } = frame;
  const cx = width * 0.42;
  const cy = height * 0.58;
  const radius = Math.min(width * 0.29, height * 0.42);

  // The three angles published in the results table, in the order we report them.
  const specimens: Array<{ label: string; angle: number; colour: string }> = [
    { label: 'TOPAZ', angle: 58.1, colour: 'rgba(255,212,121,0.95)' },
    { label: 'CROWN', angle: 56.7, colour: hexToRgba(data.accent, 0.95) },
    { label: 'FLINT', angle: 57.51, colour: 'rgba(255,138,138,0.95)' },
  ];

  ctx.save();

  // the interface (horizontal) and the normal (vertical)
  ctx.beginPath();
  ctx.moveTo(cx - radius * 1.18, cy);
  ctx.lineTo(cx + radius * 1.16, cy);
  ctx.strokeStyle = 'rgba(232,251,255,0.5)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.save();
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius * 1.08);
  ctx.lineTo(cx, cy + radius * 0.1);
  ctx.strokeStyle = 'rgba(159,180,255,0.42)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // graduated protractor quadrant: 0° at the normal, 90° at the interface
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.92, -Math.PI / 2, 0);
  ctx.strokeStyle = 'rgba(143,170,210,0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();
  for (let angle = 0; angle <= 90; angle += 10) {
    const a = -Math.PI / 2 + (angle * Math.PI) / 180;
    const inner = radius * 0.92;
    const outer = radius * (angle % 30 === 0 ? 0.98 : 0.95);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
    ctx.strokeStyle = 'rgba(143,170,210,0.3)';
    ctx.stroke();
    if (angle % 30 === 0) {
      ctx.font = '500 8px ui-monospace, Menlo, monospace';
      ctx.fillStyle = 'rgba(143,170,210,0.55)';
      ctx.textAlign = 'center';
      ctx.fillText(`${angle}°`, cx + Math.cos(a) * radius * 1.07, cy + Math.sin(a) * radius * 1.07 + 3);
    }
  }

  // one arm per specimen, all close together — because the physics says so
  specimens.forEach((specimen, index) => {
    const a = -Math.PI / 2 + (specimen.angle * Math.PI) / 180;
    const endpointX = cx + Math.cos(a) * radius;
    const endpointY = cy + Math.sin(a) * radius;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(endpointX, endpointY);
    ctx.strokeStyle = specimen.colour;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(endpointX, endpointY, 3, 0, Math.PI * 2);
    ctx.fillStyle = specimen.colour;
    ctx.fill();

    // legend, right-hand column
    const legendY = height * 0.24 + index * 34;
    const legendX = width * 0.76;
    ctx.beginPath();
    ctx.moveTo(legendX, legendY);
    ctx.lineTo(legendX + 18, legendY);
    ctx.strokeStyle = specimen.colour;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '600 10px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(232,251,255,0.9)';
    ctx.fillText(specimen.label, legendX + 26, legendY - 2);
    ctx.font = '500 9px ui-monospace, Menlo, monospace';
    ctx.fillStyle = specimen.colour;
    ctx.fillText(`${specimen.angle.toFixed(2)}°`, legendX + 26, legendY + 11);
  });

  // the 90° reflected/refracted relation pulsing at Brewster incidence
  const sweep = reducedMotion ? 0 : Math.abs(Math.sin(time / 2400));
  if (sweep > 0.02) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.5, Math.PI * 1.5, Math.PI * 1.5 + (Math.PI / 2) * sweep);
    ctx.strokeStyle = `rgba(255,95,95,${0.55 * sweep})`;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, 3.4, 0, Math.PI * 2);
  ctx.fillStyle = '#e8fbff';
  ctx.fill();

  // the relation these three numbers come from
  ctx.font = '500 9px ui-monospace, Menlo, monospace';
  ctx.fillStyle = 'rgba(143,170,210,0.62)';
  ctx.textAlign = 'left';
  ctx.fillText('θB = arctan(n₂ / n₁)   n₁ = 1.000 (air)', cx - radius * 1.18, cy + height * 0.2);
  ctx.restore();
}

function drawViva(frame: SceneFrame): void {
  const { ctx, width, height, data, time, reducedMotion } = frame;
  const cx = width * 0.5;
  const cy = height * 0.44;
  const baseRadius = Math.min(width, height) * 0.27;

  ctx.save();
  ctx.translate(cx, cy);

  // Three orbital shells, one per difficulty band in the viva bank.
  const shells = [
    { r: baseRadius, count: 8, speed: 1, tilt: 0.42, label: 'FOUNDATION' },
    { r: baseRadius * 1.42, count: 9, speed: -0.62, tilt: 0.34, label: 'APPLICATION' },
    { r: baseRadius * 1.84, count: 7, speed: 0.44, tilt: 0.28, label: 'DERIVATION' },
  ];

  shells.forEach((shell, shellIndex) => {
    ctx.beginPath();
    ctx.ellipse(0, 0, shell.r, shell.r * shell.tilt, 0, 0, Math.PI * 2);
    ctx.strokeStyle = shellIndex === 0 ? hexToRgba(data.accent, 0.34) : 'rgba(143,170,210,0.16)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const nodes: Array<[number, number, boolean]> = [];
    for (let i = 0; i < shell.count; i += 1) {
      const angle = (i / shell.count) * Math.PI * 2 + (reducedMotion ? 0 : (time / 6000) * shell.speed);
      const x = Math.cos(angle) * shell.r;
      const y = Math.sin(angle) * shell.r * shell.tilt;
      nodes.push([x, y, Math.sin(angle) > 0]);
    }

    // chords joining neighbouring questions on the same shell
    ctx.beginPath();
    for (let i = 0; i < nodes.length; i += 1) {
      const [x1, y1] = nodes[i];
      const [x2, y2] = nodes[(i + 1) % nodes.length];
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.strokeStyle = shellIndex === 0 ? hexToRgba(data.accent, 0.16) : 'rgba(143,170,210,0.09)';
    ctx.lineWidth = 0.9;
    ctx.stroke();

    nodes.forEach(([x, y, front]) => {
      ctx.beginPath();
      ctx.arc(x, y, front ? 3 : 1.9, 0, Math.PI * 2);
      ctx.fillStyle = front
        ? shellIndex === 0
          ? hexToRgba(data.accent, 0.95)
          : 'rgba(232,251,255,0.72)'
        : 'rgba(143,170,210,0.34)';
      ctx.fill();
    });

    // shell caption, pinned to the ellipse's right edge
    ctx.font = '500 7px ui-monospace, Menlo, monospace';
    ctx.fillStyle = 'rgba(143,170,210,0.42)';
    ctx.textAlign = 'left';
    ctx.fillText(shell.label, shell.r + 8, 2);
  });

  // core
  const coreR = baseRadius * 0.4;
  const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR);
  coreGrad.addColorStop(0, hexToRgba(data.accent, 0.22));
  coreGrad.addColorStop(1, 'rgba(5,8,16,0)');
  ctx.beginPath();
  ctx.arc(0, 0, coreR, 0, Math.PI * 2);
  ctx.fillStyle = coreGrad;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, coreR * 0.62, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(232,251,255,0.55)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = '600 16px ui-monospace, Menlo, monospace';
  ctx.fillStyle = 'rgba(232,251,255,0.95)';
  ctx.fillText('24', 0, 1);
  ctx.font = '500 7px ui-monospace, Menlo, monospace';
  ctx.fillStyle = 'rgba(143,170,210,0.8)';
  ctx.fillText('QUESTIONS', 0, 14);
  ctx.fillStyle = 'rgba(247,183,61,0.9)';
  ctx.fillText('3 BANDS', 0, 25);

  ctx.restore();
}

/* -------------------------------------------------------------------------- */
/* helpers                                                                    */
/* -------------------------------------------------------------------------- */

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const value = Number.parseInt(full, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export type { PortalSceneKind };
