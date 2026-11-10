import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FrameMeter, RenderQualityController, isWebGLAvailable, type PerfSnapshot, type QualityTier } from './renderQuality';
import type { ViewMode } from '../experiment/types';

/**
 * ============================================================================
 *  3D OPTICAL BENCH — coordinate convention
 * ============================================================================
 *  World units are centimetres (1 unit = 10 mm); the 500 mm rail is 50 units.
 *
 *    +X  →  along the optical rail, from the laser toward the detector.
 *    +Y  →  vertically up. The optical axis sits at y = BEAM_HEIGHT.
 *    +Z  →  laterally out of the plane of incidence, toward the observer.
 *
 *  The plane of incidence is the vertical XY plane, exactly as on a real
 *  θ–2θ goniometer: the incident beam travels along +X and the reflected beam
 *  swings upward through the vertical plane as the specimen rotates about Z.
 *
 *  Every ray below is derived from the same Snell / reflection algebra used by
 *  the physics engine, so the rendered geometry cannot drift from the numbers.
 * ============================================================================
 */

const DEG = Math.PI / 180;
const BEAM_HEIGHT = 4.6;
const RAIL_START = 1;
const RAIL_END = 51;
const SAMPLE_X = 27;
const DETECTOR_RADIUS = 15;

export interface BenchState {
  readonly incidenceDeg: number;
  readonly polariserDeg: number;
  readonly laserOn: boolean;
  readonly view: ViewMode;
  readonly n1: number;
  readonly n2: number;
  /** Unpolarised reflected power fraction, drives beam brightness. */
  readonly reflectedFraction: number;
  readonly inputMode: 'unpolarised' | 's' | 'p' | 'linear';
}

export interface RayVectors {
  readonly d: THREE.Vector3;
  readonly n: THREE.Vector3;
  readonly r: THREE.Vector3;
  readonly t: THREE.Vector3 | null;
  readonly thetaTDeg: number | null;
}

/**
 * Pure vector form of the interface geometry.
 * Exported so tests and the 2D layer can cross-check the 3D rays.
 */
export function rayVectors(incidenceDeg: number, n1: number, n2: number): RayVectors {
  const thI = Math.min(90, Math.max(0, incidenceDeg)) * DEG;
  const d = new THREE.Vector3(1, 0, 0);
  const n = new THREE.Vector3(-Math.cos(thI), Math.sin(thI), 0);
  const r = d.clone().addScaledVector(n, 2 * Math.cos(thI));
  r.normalize();

  const sinT = (n1 / n2) * Math.sin(thI);
  if (sinT > 1) return { d, n, r, t: null, thetaTDeg: null };

  const thT = Math.asin(Math.min(1, sinT));
  const a = n1 / n2;
  const b = a * Math.cos(thI) - Math.cos(thT);
  const t = d.clone().multiplyScalar(a).addScaledVector(n, b).normalize();
  return { d, n, r, t, thetaTDeg: thT / DEG };
}

export interface BenchOptions {
  readonly onPerf?: (snapshot: PerfSnapshot) => void;
  readonly onTier?: (tier: QualityTier) => void;
}

export class OpticalBench3D {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls | null = null;
  private root = new THREE.Group();
  private options: BenchOptions;

  private rayIncident!: THREE.Group;
  private rayReflected!: THREE.Group;
  private rayRefracted!: THREE.Group;
  private specimen!: THREE.Group;
  private polariser!: THREE.Group;
  private detectorArm!: THREE.Group;
  private angleArcs!: THREE.Group;
  private normalLine!: THREE.Line;

  private quality = new RenderQualityController();
  private meter = new FrameMeter();
  private rafId = 0;
  private running = false;
  private disposed = false;
  private observer: ResizeObserver | null = null;
  private state: BenchState = {
    incidenceDeg: 45,
    polariserDeg: 0,
    laserOn: false,
    view: 'side',
    n1: 1,
    n2: 1.6,
    reflectedFraction: 0.08,
    inputMode: 'unpolarised',
  };
  private animTime = 0;
  private lastFrame = 0;
  private manualCamera = false;

  constructor(container: HTMLElement, options: BenchOptions = {}) {
    this.container = container;
    this.options = options;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
    this.buildScene();
  }

  get isSupported(): boolean {
    return isWebGLAvailable();
  }

  /** Returns true when the renderer came up; false means the caller should fall back. */
  init(): boolean {
    if (!this.isSupported) return false;
    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: this.quality.settings.antialias,
        alpha: true,
        powerPreference: 'high-performance',
      });
      this.renderer.setClearColor(0x05070f, 0);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.quality.settings.pixelRatio));
      this.container.appendChild(this.renderer.domElement);
      this.renderer.domElement.classList.add('bench-canvas');

      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.075;
      this.controls.rotateSpeed = 0.55;
      this.controls.zoomSpeed = 0.7;
      this.controls.panSpeed = 0.5;
      this.controls.minDistance = 14;
      this.controls.maxDistance = 110;
      this.controls.minPolarAngle = 0.12;
      this.controls.maxPolarAngle = Math.PI - 0.12;
      this.controls.target.set(SAMPLE_X - 4, BEAM_HEIGHT, 0);
      this.controls.addEventListener('start', () => {
        this.manualCamera = true;
      });

      this.meter.setWebgl(true);
      this.resize();
      this.applyView(this.state.view, true);
      this.start();
      return true;
    } catch (error) {
      console.warn('[OpticalBench3D] WebGL failed, falling back to 2D.', error);
      this.renderer = null;
      return false;
    }
  }

  /* ------------------------------------------------------------------ */
  /* scene construction                                                  */
  /* ------------------------------------------------------------------ */

  private buildScene(): void {
    this.scene.fog = new THREE.FogExp2(0x05070f, 0.0055);
    this.root.position.set(0, 0, 0);
    this.scene.add(this.root);

    this.addEnvironment();
    this.addRail();
    this.addLaser();
    this.addPolariser();
    this.addSpecimen();
    this.addGoniometer();

    this.rayIncident = this.createBeam(0xff4a4a, 0.08);
    this.rayReflected = this.createBeam(0xff5f5f, 0.075);
    this.rayRefracted = this.createBeam(0x3fd0f0, 0.06);
    this.root.add(this.rayIncident, this.rayReflected, this.rayRefracted);

    const normalGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -3, 0),
      new THREE.Vector3(0, 11, 0),
    ]);
    this.normalLine = new THREE.Line(
      normalGeometry,
      new THREE.LineDashedMaterial({ color: 0x9fb4ff, dashSize: 0.5, gapSize: 0.45, transparent: true, opacity: 0.55 }),
    );
    this.normalLine.computeLineDistances();
    this.root.add(this.normalLine);

    this.angleArcs = new THREE.Group();
    this.root.add(this.angleArcs);
  }

  private addEnvironment(): void {
    // Layered ambient rig — the bench reads as an instrument, not a toy.
    const hemi = new THREE.HemisphereLight(0x8fb8ff, 0x0a1120, 0.9);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xcfe6ff, 1.45);
    key.position.set(-18, 34, 26);
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0x3fd0f0, 0.85);
    rim.position.set(34, 10, -26);
    this.scene.add(rim);

    const laserFill = new THREE.PointLight(0xff3030, 0.9, 46, 2);
    laserFill.position.set(6, BEAM_HEIGHT, 0);
    this.scene.add(laserFill);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(95, 48),
      new THREE.MeshStandardMaterial({
        color: 0x080d1a,
        roughness: 0.92,
        metalness: 0.15,
        transparent: true,
        opacity: 0.85,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.62;
    this.scene.add(floor);

    const grid = new THREE.GridHelper(110, 44, 0x1b3a63, 0x101c33);
    grid.position.y = -0.6;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.5;
    this.scene.add(grid);
  }

  private addRail(): void {
    const railMaterial = new THREE.MeshStandardMaterial({
      color: 0x151d2e,
      roughness: 0.42,
      metalness: 0.82,
    });
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(RAIL_END - RAIL_START, 0.52, 4.2),
      railMaterial,
    );
    rail.position.set((RAIL_START + RAIL_END) / 2, 0, 0);
    this.root.add(rail);

    const top = new THREE.Mesh(
      new THREE.BoxGeometry(RAIL_END - RAIL_START, 0.12, 3.0),
      new THREE.MeshStandardMaterial({ color: 0x24324a, roughness: 0.3, metalness: 0.9 }),
    );
    top.position.set((RAIL_START + RAIL_END) / 2, 0.3, 0);
    this.root.add(top);

    // 10 mm graduations, with taller 50 mm majors — the scale is visible.
    const tickMaterial = new THREE.MeshBasicMaterial({ color: 0x7fe4fb, transparent: true, opacity: 0.42 });
    const majorMaterial = new THREE.MeshBasicMaterial({ color: 0xf7b73d, transparent: true, opacity: 0.8 });
    const ticks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.02, 0.72), tickMaterial, 50);
    const majors = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 0.02, 1.28), majorMaterial, 10);
    const matrix = new THREE.Matrix4();
    let tickIndex = 0;
    let majorIndex = 0;
    for (let mm = 0; mm <= 500; mm += 10) {
      const x = RAIL_START + mm / 10;
      const isMajor = mm % 50 === 0;
      matrix.makeTranslation(x, 0.37, isMajor ? 1.0 : 1.28);
      if (isMajor) {
        majors.setMatrixAt(majorIndex++, matrix);
      } else {
        ticks.setMatrixAt(tickIndex++, matrix);
      }
    }
    ticks.count = tickIndex;
    majors.count = majorIndex;
    this.root.add(ticks, majors);

    const scaleLabel = this.createTextSprite('500 mm / 10 mm GRADUATION', '#7fe4fb', 0.5);
    scaleLabel.position.set(RAIL_START + 2.5, 1.4, 2.6);
    this.root.add(scaleLabel);
  }

  private addLaser(): void {
    const group = new THREE.Group();
    group.position.set(RAIL_START + 3, BEAM_HEIGHT, 0);

    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x222c40, roughness: 0.48, metalness: 0.72 });
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 3.6, 24), baseMaterial);
    housing.rotation.z = -Math.PI / 2;
    housing.position.x = 0.6;
    group.add(housing);

    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.34, 1.5, 20),
      new THREE.MeshStandardMaterial({ color: 0x0f1626, roughness: 0.35, metalness: 0.9 }),
    );
    barrel.rotation.z = -Math.PI / 2;
    barrel.position.x = 2.8;
    group.add(barrel);

    const aperture = new THREE.Mesh(
      new THREE.CircleGeometry(0.16, 20),
      new THREE.MeshBasicMaterial({ color: 0xff8a8a }),
    );
    aperture.rotation.y = Math.PI / 2;
    aperture.position.x = 3.58;
    group.add(aperture);
    aperture.name = 'laser-aperture';

    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.3, 1.9), baseMaterial);
    plate.position.set(0.2, -0.6, 0);
    group.add(plate);

    const label = this.createTextSprite('3 mW · 650 nm · RED', '#ff9d9d', 0.42);
    label.position.set(1.2, 1.5, 0);
    group.add(label);

    const supply = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.1, 1.7),
      new THREE.MeshStandardMaterial({ color: 0x1a2334, roughness: 0.7, metalness: 0.35 }),
    );
    supply.position.set(-1.9, -2.4, 0);
    group.add(supply);

    const supplyLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0x4fe0a6 }),
    );
    supplyLed.position.set(-0.9, -2.05, 0.87);
    group.add(supplyLed);

    this.root.add(group);
  }

  private addPolariser(): void {
    this.polariser = new THREE.Group();
    this.polariser.position.set(RAIL_START + 14, BEAM_HEIGHT, 0);

    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.17, BEAM_HEIGHT - 0.4, 12),
      new THREE.MeshStandardMaterial({ color: 0x2a3346, roughness: 0.5, metalness: 0.7 }),
    );
    post.position.y = -(BEAM_HEIGHT - 0.4) / 2;
    this.polariser.add(post);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.28, 0.11, 10, 40),
      new THREE.MeshStandardMaterial({ color: 0x9fb4ff, roughness: 0.28, metalness: 0.95 }),
    );
    ring.rotation.y = Math.PI / 2;
    this.polariser.add(ring);

    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(1.2, 40),
      new THREE.MeshPhysicalMaterial({
        color: 0x6fd8f0,
        transparent: true,
        opacity: 0.22,
        roughness: 0.1,
        metalness: 0.05,
        transmission: 0.7,
        side: THREE.DoubleSide,
      }),
    );
    disc.rotation.y = Math.PI / 2;
    disc.name = 'polariser-disc';
    this.polariser.add(disc);

    // The transmission axis marker rotates with the polariser setting.
    const axis = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 2.1, 0.05),
      new THREE.MeshBasicMaterial({ color: 0xffd479 }),
    );
    axis.position.x = 0.06;
    axis.name = 'polariser-axis';
    this.polariser.add(axis);

    const label = this.createTextSprite('POLARISER', '#7fe4fb', 0.36);
    label.position.set(0, 1.7, 0);
    this.polariser.add(label);

    this.root.add(this.polariser);
  }

  private addSpecimen(): void {
    this.specimen = new THREE.Group();
    this.specimen.position.set(SAMPLE_X, BEAM_HEIGHT, 0);

    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 9, 11),
      new THREE.MeshPhysicalMaterial({
        color: 0x9fe8ff,
        transparent: true,
        opacity: 0.34,
        roughness: 0.06,
        metalness: 0.0,
        transmission: 0.82,
        thickness: 0.6,
        ior: 1.52,
        side: THREE.DoubleSide,
      }),
    );
    plate.name = 'specimen-plate';
    this.specimen.add(plate);

    const frame = new THREE.Mesh(
      new THREE.TorusGeometry(5.6, 0.08, 8, 44),
      new THREE.MeshStandardMaterial({ color: 0x8a9cc4, roughness: 0.3, metalness: 0.9 }),
    );
    frame.rotation.y = Math.PI / 2;
    frame.scale.set(1, 1, 0.85);
    this.specimen.add(frame);

    const label = this.createTextSprite('SPECIMEN', '#e8fbff', 0.4);
    label.position.set(0, 6.2, 1.4);
    this.specimen.add(label);

    this.root.add(this.specimen);
  }

  private addGoniometer(): void {
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.6, 0.4, 36),
      new THREE.MeshStandardMaterial({ color: 0x1c2537, roughness: 0.42, metalness: 0.85 }),
    );
    base.position.set(SAMPLE_X, 0.5, 0);
    this.root.add(base);

    // Graduated angular ring — 5° marks, 15° majors.
    const ringGroup = new THREE.Group();
    ringGroup.position.set(SAMPLE_X, 0.75, 0);
    const tickMat = new THREE.MeshBasicMaterial({ color: 0x7fe4fb, transparent: true, opacity: 0.5 });
    const majorMat = new THREE.MeshBasicMaterial({ color: 0xf7b73d, transparent: true, opacity: 0.85 });
    for (let deg = 0; deg < 360; deg += 5) {
      const major = deg % 15 === 0;
      const tick = new THREE.Mesh(
        new THREE.BoxGeometry(major ? 1.1 : 0.6, 0.04, 0.07),
        major ? majorMat : tickMat,
      );
      const rad = deg * DEG;
      tick.position.set(Math.cos(rad) * 3.1, 0, Math.sin(rad) * 3.1);
      tick.rotation.y = -rad;
      ringGroup.add(tick);
    }
    this.root.add(ringGroup);

    this.detectorArm = new THREE.Group();
    this.detectorArm.position.set(SAMPLE_X, BEAM_HEIGHT, 0);

    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(DETECTOR_RADIUS, 0.16, 0.42),
      new THREE.MeshStandardMaterial({ color: 0x2f3c56, roughness: 0.4, metalness: 0.85 }),
    );
    arm.position.x = DETECTOR_RADIUS / 2;
    this.detectorArm.add(arm);

    const head = new THREE.Group();
    head.position.x = DETECTOR_RADIUS;
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.72, 0.72, 1.5, 20),
      new THREE.MeshStandardMaterial({ color: 0x141d2f, roughness: 0.42, metalness: 0.8 }),
    );
    body.rotation.z = Math.PI / 2;
    head.add(body);

    const apertureRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.34, 0.06, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0xf7b73d, roughness: 0.3, metalness: 0.9 }),
    );
    apertureRing.position.x = -0.76;
    apertureRing.rotation.y = Math.PI / 2;
    head.add(apertureRing);

    const sensor = new THREE.Mesh(
      new THREE.CircleGeometry(0.3, 20),
      new THREE.MeshBasicMaterial({ color: 0x3fd0f0, transparent: true, opacity: 0.9 }),
    );
    sensor.rotation.y = -Math.PI / 2;
    sensor.position.x = -0.78;
    sensor.name = 'detector-sensor';
    head.add(sensor);
    this.detectorArm.add(head);

    const label = this.createTextSprite('PINHOLE DETECTOR', '#7fe4fb', 0.34);
    label.position.set(DETECTOR_RADIUS, 1.6, 0);
    this.detectorArm.add(label);

    this.root.add(this.detectorArm);
  }

  private createBeam(color: number, radius: number): THREE.Group {
    const group = new THREE.Group();
    const coreMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glowMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const core = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 8, 1, true), coreMaterial);
    core.name = 'beam-core';
    const glow = new THREE.Mesh(new THREE.CylinderGeometry(radius * 4.2, radius * 4.2, 1, 10, 1, true), glowMaterial);
    glow.name = 'beam-glow';

    group.add(core, glow);
    return group;
  }

  private createTextSprite(text: string, color: string, scale: number): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const ratio = 4;
    canvas.width = 512 * ratio;
    canvas.height = 64 * ratio;
    if (context) {
      context.scale(ratio, ratio);
      context.font = '600 34px "JetBrains Mono", ui-monospace, monospace';
      context.fillStyle = color;
      context.textBaseline = 'middle';
      context.letterSpacing = '6px';
      context.fillText(text, 8, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(scale * 8, scale, 1);
    return sprite;
  }

  /* ------------------------------------------------------------------ */
  /* updates                                                             */
  /* ------------------------------------------------------------------ */

  update(next: Partial<BenchState>): void {
    const previousView = this.state.view;
    this.state = { ...this.state, ...next };
    if (this.disposed) return;
    this.applyRays();
    this.applySpecimenOrientation();
    this.applyPolariser();
    if (previousView !== this.state.view) this.applyView(this.state.view, false);
  }

  private applyRays(): void {
    const { incidenceDeg, n1, n2, laserOn, reflectedFraction } = this.state;
    const vectors = rayVectors(incidenceDeg, n1, n2);

    const origin = new THREE.Vector3(SAMPLE_X, BEAM_HEIGHT, 0);
    const laserExit = new THREE.Vector3(RAIL_START + 3 + 3.6, BEAM_HEIGHT, 0);

    // ---- incident beam (laser exit → interface centre) ----
    const incidentLength = origin.distanceTo(laserExit);
    this.orientBeam(this.rayIncident, laserExit, origin, incidentLength);
    this.setBeamOpacity(this.rayIncident, laserOn ? 1 : 0);

    // ---- reflected beam (interface → detector on the arm) ----
    const end = origin.clone().addScaledVector(vectors.r, DETECTOR_RADIUS);
    this.orientBeam(this.rayReflected, origin, end, DETECTOR_RADIUS);
    const reflectedAlpha = laserOn ? Math.min(1, 0.2 + Math.sqrt(Math.max(0, reflectedFraction)) * 1.5) : 0;
    this.setBeamOpacity(this.rayReflected, reflectedAlpha);

    // ---- refracted beam (into the glass) ----
    if (vectors.t) {
      const transEnd = origin.clone().addScaledVector(vectors.t, 9);
      this.orientBeam(this.rayRefracted, origin, transEnd, 9);
      this.setBeamOpacity(this.rayRefracted, laserOn ? 0.62 : 0);
    } else {
      this.setBeamOpacity(this.rayRefracted, 0);
    }

    // ---- detector arm follows the reflected beam exactly ----
    const armAngle = Math.atan2(vectors.r.y, vectors.r.x);
    this.detectorArm.rotation.z = armAngle;

    // ---- normal ----
    this.normalLine.position.copy(origin);
    const normalDir = new THREE.Vector3(0, 1, 0);
    const normalQuaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      vectors.n,
    );
    this.normalLine.quaternion.copy(normalQuaternion);
    void normalDir;

    this.buildAngleArcs(vectors, origin);
  }

  private buildAngleArcs(vectors: RayVectors, origin: THREE.Vector3): void {
    while (this.angleArcs.children.length > 0) {
      const child = this.angleArcs.children.pop()!;
      disposeObject(child);
    }

    // Incident ray comes in along +X; the reference for angle 0 is the normal.
    const incidentAngle = Math.atan2(vectors.d.y, vectors.d.x);
    const reflectedAngle = Math.atan2(vectors.r.y, vectors.r.x);
    const normalAngle = Math.atan2(vectors.n.y, vectors.n.x);

    this.addArc(origin, 3.1, normalAngle, incidentAngle, 0xff8a8a, 0.85);
    this.addArc(origin, 3.9, normalAngle, reflectedAngle, 0xff5f5f, 0.6);
    if (vectors.t) {
      const transAngle = Math.atan2(vectors.t.y, vectors.t.x);
      this.addArc(origin, 3.5, normalAngle + Math.PI, transAngle, 0x3fd0f0, 0.7);
    }
  }

  private addArc(
    origin: THREE.Vector3,
    radius: number,
    fromAngle: number,
    toAngle: number,
    color: number,
    opacity: number,
  ): void {
    let delta = toAngle - fromAngle;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    const steps = Math.max(8, Math.round(Math.abs(delta) / 0.06));
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= steps; i += 1) {
      const angle = fromAngle + (delta * i) / steps;
      points.push(
        new THREE.Vector3(
          origin.x + Math.cos(angle) * radius,
          origin.y + Math.sin(angle) * radius,
          origin.z + 0.02,
        ),
      );
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    this.angleArcs.add(new THREE.Line(geometry, material));
  }

  private orientBeam(
    beam: THREE.Group,
    from: THREE.Vector3,
    to: THREE.Vector3,
    length: number,
  ): void {
    const direction = to.clone().sub(from);
    const mid = from.clone().addScaledVector(direction, 0.5);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize(),
    );
    beam.position.copy(mid);
    beam.quaternion.copy(quaternion);
    beam.scale.set(1, Math.max(0.001, length), 1);
  }

  private setBeamOpacity(beam: THREE.Group, alpha: number): void {
    beam.visible = alpha > 0.002;
    for (const child of beam.children) {
      const mesh = child as THREE.Mesh;
      const material = mesh.material as THREE.MeshBasicMaterial;
      if (!material) continue;
      const isGlow = mesh.name === 'beam-glow';
      material.opacity = isGlow ? alpha * 0.2 : alpha * 0.95;
    }
  }

  private applySpecimenOrientation(): void {
    // Specimen normal must equal n = (−cos θi, sin θi, 0); the plate's +X face
    // is its normal, so rotate about Z by (180° − θi).
    // For n1 = 1 the incident beam runs along +X, so the surface normal must be
    // n = (−cos θi, sin θi, 0). The plate's face normal is +X, hence Rz(180° − θi).
    const radians = (180 - this.state.incidenceDeg) * DEG;
    this.specimen.rotation.z = radians;
  }

  private applyPolariser(): void {
    const disc = this.polariser.getObjectByName('polariser-disc');
    const axis = this.polariser.getObjectByName('polariser-axis');
    const radians = -this.state.polariserDeg * DEG;
    if (disc) disc.rotation.x = radians;
    if (axis) axis.rotation.x = radians;
  }

  /* ------------------------------------------------------------------ */
  /* camera                                                              */
  /* ------------------------------------------------------------------ */

  applyView(view: ViewMode, immediate: boolean): void {
    if (!this.controls) return;
    this.state = { ...this.state, view };
    const target = new THREE.Vector3(SAMPLE_X - 4, BEAM_HEIGHT, 0);
    this.controls.target.copy(target);
    this.manualCamera = false;

    if (view === 'side') {
      // Perpendicular to the plane of incidence: the textbook ray picture.
      this.camera.position.set(SAMPLE_X - 2, BEAM_HEIGHT + 1.5, 62);
      this.camera.up.set(0, 1, 0);
      this.camera.fov = 36;
    } else {
      // Above the bench: rail layout, mounts, polariser and goniometer arm.
      this.camera.position.set(SAMPLE_X - 6, 54, 6);
      this.camera.up.set(0, 0, -1);
      this.camera.fov = 42;
    }
    this.camera.updateProjectionMatrix();
    this.controls.update();
    if (immediate) this.renderFrame(0);
  }

  resetCamera(): void {
    this.applyView(this.state.view, false);
  }

  /* ------------------------------------------------------------------ */
  /* lifecycle                                                           */
  /* ------------------------------------------------------------------ */

  start(): void {
    if (this.running || this.disposed) return;
    this.running = true;
    this.lastFrame = 0;
    this.loop(performance.now());
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private handleVisibility = (): void => {
    if (document.hidden) {
      cancelAnimationFrame(this.rafId);
    } else if (this.running) {
      this.lastFrame = 0;
      this.loop(performance.now());
    }
  };

  private loop = (now: number): void => {
    if (!this.running || this.disposed) return;
    const delta = this.lastFrame === 0 ? 16.7 : Math.min(now - this.lastFrame, 120);
    this.lastFrame = now;
    this.animTime += delta;

    const nextTier = this.quality.sample(delta);
    if (nextTier) {
      this.applyQuality();
      this.options.onTier?.(nextTier);
    }

    const snapshot = this.meter.tick(now, this.quality.current);
    if (snapshot) this.options.onPerf?.(snapshot);

    this.controls?.update();

    // Purposeful ambient motion only: a slow laser shimmer, no busy decoration.
    if (this.state.laserOn) {
      const shimmer = 0.9 + Math.sin(this.animTime / 640) * 0.08;
      for (const beam of [this.rayIncident, this.rayReflected, this.rayRefracted]) {
        const core = beam.getObjectByName('beam-core') as THREE.Mesh | undefined;
        if (core) {
          const material = core.material as THREE.MeshBasicMaterial;
          material.opacity = Math.min(1, material.opacity * 0.85 + shimmer * 0.15);
        }
      }
      const sensor = this.detectorArm.getObjectByName('detector-sensor') as THREE.Mesh | undefined;
      if (sensor) {
        const material = sensor.material as THREE.MeshBasicMaterial;
        material.opacity = 0.7 + Math.sin(this.animTime / 260) * 0.18;
      }
    }

    this.renderFrame(delta);
    this.rafId = requestAnimationFrame(this.loop);
  };

  private applyQuality(): void {
    if (!this.renderer) return;
    const settings = this.quality.settings;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, settings.pixelRatio));
    this.resize();
  }

  private renderFrame(_delta: number): void {
    if (!this.renderer) return;
    this.renderer.render(this.scene, this.camera);
  }

  resize(): void {
    if (!this.renderer) return;
    const width = this.container.clientWidth || 1;
    const height = this.container.clientHeight || 1;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
  }

  observeResize(): void {
    if (typeof ResizeObserver === 'undefined') return;
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(this.container);
  }

  dispose(): void {
    this.disposed = true;
    this.stop();
    document.removeEventListener('visibilitychange', this.handleVisibility);
    this.observer?.disconnect();
    this.observer = null;
    this.controls?.dispose();
    this.controls = null;
    disposeObject(this.root);
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
      this.renderer = null;
    }
  }

  get isManualCamera(): boolean {
    return this.manualCamera;
  }

}

function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const material = mesh.material;
    if (Array.isArray(material)) {
      material.forEach((entry) => entry.dispose());
    } else if (material) {
      const map = (material as THREE.MeshStandardMaterial).map;
      if (map) map.dispose();
      material.dispose();
    }
  });
}
