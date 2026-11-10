/**
 * Procedural optical aperture.
 *
 * Renders the current optical condition inside a rounded glass aperture:
 * incident beam, reflected beam, refracted beam, polarisation ticks and the
 * angle arcs. Pure Canvas 2D — no remote assets, no WebGL dependency.
 *
 * The aperture itself provides pointer parallax; the physics never moves.
 */
export interface PortalState {
  readonly incidenceDeg: number;
  readonly brewsterDeg: number;
  readonly n1: number;
  readonly n2: number;
  readonly reflectedFraction: number;
  readonly laserOn: boolean;
  readonly polariserDeg: number;
}

export class OpticalPortal {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D | null;
  private host: HTMLElement;
  private state: PortalState;
  private raf = 0;
  private running = false;
  private disposed = false;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  private time = 0;
  private last = 0;
  private observer: ResizeObserver | null = null;
  private reducedMotion: boolean;

  constructor(canvas: HTMLCanvasElement, state: PortalState) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    this.context = context;
    this.host = canvas.parentElement ?? canvas;
    this.state = state;
    this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }

  get supported(): boolean {
    return this.context !== null;
  }

  init(): boolean {
    if (!this.context) return false;
    this.resize();
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(this.host);
    window.addEventListener('pointermove', this.handlePointer, { passive: true });
    window.addEventListener('pointerleave', this.handleLeave);
    this.start();
    return true;
  }

  update(state: PortalState): void {
    this.state = state;
    if (!this.running) this.draw(0);
  }

  private handlePointer = (event: PointerEvent): void => {
    const rect = this.host.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const nx = (event.clientX - cx) / Math.max(1, window.innerWidth / 2);
    const ny = (event.clientY - cy) / Math.max(1, window.innerHeight / 2);
    this.pointer.tx = Math.max(-1, Math.min(1, nx)) * 14;
    this.pointer.ty = Math.max(-1, Math.min(1, ny)) * 10;
  };

  private handleLeave = (): void => {
    this.pointer.tx = 0;
    this.pointer.ty = 0;
  };

  private resize(): void {
    const rect = this.host.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    if (!this.running) this.draw(0);
  }

  start(): void {
    if (this.running || this.disposed) return;
    this.running = true;
    this.last = 0;
    this.raf = requestAnimationFrame(this.loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  dispose(): void {
    this.disposed = true;
    this.stop();
    this.observer?.disconnect();
    window.removeEventListener('pointermove', this.handlePointer);
    window.removeEventListener('pointerleave', this.handleLeave);
  }

  private loop = (now: number): void => {
    if (!this.running || this.disposed) return;
    const delta = this.last === 0 ? 16 : Math.min(now - this.last, 80);
    this.last = now;
    this.time += delta;

    this.pointer.x += (this.pointer.tx - this.pointer.x) * 0.06;
    this.pointer.y += (this.pointer.ty - this.pointer.y) * 0.06;

    this.draw(this.reducedMotion ? 0 : this.time);
    this.raf = requestAnimationFrame(this.loop);
  };

  private draw(time: number): void {
    const ctx = this.context;
    if (!ctx) return;
    const { width: w, height: h } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2 + this.pointer.x;
    const cy = h * 0.54 + this.pointer.y;
    const scale = Math.min(w, h);

    // ---- ambient backdrop ----
    const backdrop = ctx.createRadialGradient(cx, cy * 0.7, scale * 0.05, cx, cy, scale * 0.8);
    backdrop.addColorStop(0, 'rgba(30, 62, 112, 0.55)');
    backdrop.addColorStop(0.55, 'rgba(10, 20, 40, 0.35)');
    backdrop.addColorStop(1, 'rgba(4, 7, 15, 0)');
    ctx.fillStyle = backdrop;
    ctx.fillRect(0, 0, w, h);

    // ---- radial wavefront rings ----
    ctx.save();
    ctx.translate(cx, cy);
    for (let i = 0; i < 7; i += 1) {
      const phase = ((time / 6200) + i / 7) % 1;
      const radius = scale * (0.12 + phase * 0.56);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(127, 228, 251, ${(1 - phase) * 0.16})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();

    // ---- angular scale ----
    const arcRadius = scale * 0.30;
    ctx.save();
    ctx.translate(cx, cy);
    for (let deg = -90; deg <= 90; deg += 5) {
      const rad = ((deg - 90) * Math.PI) / 180;
      const major = deg % 15 === 0;
      const r1 = arcRadius;
      const r2 = arcRadius + (major ? 12 : 6);
      ctx.beginPath();
      ctx.moveTo(Math.cos(rad) * r1, Math.sin(rad) * r1);
      ctx.lineTo(Math.cos(rad) * r2, Math.sin(rad) * r2);
      ctx.strokeStyle = major ? 'rgba(180, 205, 240, 0.4)' : 'rgba(143, 170, 210, 0.18)';
      ctx.lineWidth = major ? 1.4 : 1;
      ctx.stroke();
    }
    ctx.restore();

    const thetaI = (this.state.incidenceDeg * Math.PI) / 180;
    const thetaT = Math.asin(
      Math.min(1, (this.state.n1 / this.state.n2) * Math.sin(thetaI)),
    );
    const beam = scale * 0.52;
    const surfaceY = cy + scale * 0.06;

    // ---- glass specimen ----
    ctx.save();
    const glassWidth = scale * 0.82;
    const glassGradient = ctx.createLinearGradient(0, surfaceY, 0, surfaceY + scale * 0.34);
    glassGradient.addColorStop(0, 'rgba(127, 228, 251, 0.24)');
    glassGradient.addColorStop(0.5, 'rgba(63, 208, 240, 0.10)');
    glassGradient.addColorStop(1, 'rgba(27, 58, 99, 0.34)');
    ctx.beginPath();
    ctx.moveTo(cx - glassWidth / 2, surfaceY);
    ctx.lineTo(cx + glassWidth / 2, surfaceY);
    ctx.lineTo(cx + glassWidth / 2 - 12, surfaceY + scale * 0.34);
    ctx.lineTo(cx - glassWidth / 2 + 12, surfaceY + scale * 0.34);
    ctx.closePath();
    ctx.fillStyle = glassGradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(127, 228, 251, 0.34)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // interface highlight
    ctx.beginPath();
    ctx.moveTo(cx - glassWidth / 2, surfaceY);
    ctx.lineTo(cx + glassWidth / 2, surfaceY);
    ctx.strokeStyle = 'rgba(232, 251, 255, 0.72)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();

    // ---- normal ----
    ctx.save();
    ctx.setLineDash([5, 7]);
    ctx.beginPath();
    ctx.moveTo(cx, cy - beam * 0.62);
    ctx.lineTo(cx, surfaceY + beam * 0.42);
    ctx.strokeStyle = 'rgba(159, 180, 255, 0.42)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // ---- Brewster reference ----
    const thetaB = Math.atan2(this.state.n2, this.state.n1);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.sin(thetaB) * beam * 0.7, cy - Math.cos(thetaB) * beam * 0.7);
    ctx.strokeStyle = 'rgba(247, 183, 61, 0.42)';
    ctx.setLineDash([3, 8]);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    if (this.state.laserOn) {
      // ---- incident beam ----
      this.drawBeam(
        cx - Math.sin(thetaI) * beam,
        cy - Math.cos(thetaI) * beam,
        cx,
        cy,
        'rgba(255, 90, 90, 0.95)',
        'rgba(255, 40, 40, 0.28)',
        2.4,
      );

      // ---- reflected beam ----
      const reflectAlpha = Math.min(1, 0.22 + Math.sqrt(Math.max(0, this.state.reflectedFraction)) * 1.55);
      this.drawBeam(
        cx,
        cy,
        cx + Math.sin(thetaI) * beam,
        cy - Math.cos(thetaI) * beam,
        `rgba(255, 120, 120, ${reflectAlpha})`,
        `rgba(255, 60, 60, ${reflectAlpha * 0.3})`,
        2,
      );

      // ---- refracted beam ----
      this.drawBeam(
        cx,
        cy,
        cx + Math.sin(thetaT) * beam * 0.92,
        cy + Math.cos(thetaT) * beam * 0.92,
        'rgba(63, 208, 240, 0.8)',
        'rgba(63, 208, 240, 0.22)',
        1.8,
      );
    }

    // ---- polarisation ticks along the incident beam ----
    ctx.save();
    const psi = (this.state.polariserDeg * Math.PI) / 180;
    for (let i = 1; i <= 7; i += 1) {
      const f = i / 8;
      const px = cx - Math.sin(thetaI) * beam * (1 - f);
      const py = cy - Math.cos(thetaI) * beam * (1 - f);
      const len = 5 + Math.sin(time / 460 + i) * 1.2;
      ctx.beginPath();
      ctx.moveTo(px - Math.cos(psi) * len, py - Math.sin(psi) * len);
      ctx.lineTo(px + Math.cos(psi) * len, py + Math.sin(psi) * len);
      ctx.strokeStyle = `rgba(255, 231, 176, ${0.14 + f * 0.3})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.restore();

    // ---- origin node ----
    ctx.beginPath();
    ctx.arc(cx, cy, 3.4, 0, Math.PI * 2);
    ctx.fillStyle = '#e8fbff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 9 + (Math.sin(time / 700) * 1.6), 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(127, 228, 251, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // ---- angle labels ----
    ctx.save();
    ctx.font = '500 11px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillStyle = 'rgba(255, 157, 157, 0.9)';
    const labelRadius = arcRadius + 22;
    ctx.fillText(
      `θi ${this.state.incidenceDeg.toFixed(1)}°`,
      cx - Math.sin(thetaI / 2) * labelRadius - 26,
      cy - Math.cos(thetaI / 2) * labelRadius,
    );
    ctx.fillStyle = 'rgba(247, 183, 61, 0.95)';
    ctx.fillText(
      `θB ${((thetaB * 180) / Math.PI).toFixed(2)}°`,
      cx + Math.sin(thetaB) * labelRadius - 14,
      cy - Math.cos(thetaB) * labelRadius + 4,
    );
    ctx.restore();

    // ---- aperture edge vignette ----
    const vignette = ctx.createRadialGradient(cx, cy, scale * 0.24, cx, cy, scale * 0.78);
    vignette.addColorStop(0, 'rgba(5, 7, 15, 0)');
    vignette.addColorStop(1, 'rgba(5, 7, 15, 0.82)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }

  private drawBeam(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    core: string,
    glow: string,
    width: number,
  ): void {
    const ctx = this.context;
    if (!ctx) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = glow;
    ctx.lineWidth = width * 7;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = core;
    ctx.lineWidth = width;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = 'rgba(255, 245, 245, 0.7)';
    ctx.lineWidth = width * 0.36;
    ctx.stroke();
    ctx.restore();
  }
}
