import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PORTAL_DESTINATIONS,
  buildSceneData,
  destinationAt,
  nextIndex,
  type PortalDestination,
  type PortalSceneData,
} from '../data/portal';
import {
  advanceTilt,
  animateValue,
  clamp01,
  computeMaskGeometry,
  createMaskState,
  drawShade,
  easeInOutCubic,
  resetTiltTargets,
  tracePath,
  updateTiltTargets,
} from './maskEngine';
import { drawPortalScene } from './sceneRenderer';
import { useReducedMotion } from '../app/appState';

export type PortalPhase = 'booting' | 'revealing' | 'ready' | 'transitioning';

export interface PortalExperienceApi {
  readonly currentIndex: number;
  readonly destination: PortalDestination;
  readonly nextDestination: PortalDestination;
  readonly scene: PortalSceneData;
  readonly phase: PortalPhase;
  readonly progress: number;
  readonly reducedMotion: boolean;
  readonly portalRef: React.RefObject<HTMLButtonElement>;
  readonly canvasRef: React.RefObject<HTMLCanvasElement>;
  readonly revision: number;
  readonly travel: () => void;
  readonly selectIndex: (index: number) => void;
  readonly skipBoot: () => void;
}

const BOOT_SEQUENCE_MS = 2400;
const REVEAL_MS = 1050;

/**
 * Owns the portal's lifecycle: procedural "loading" sequence, canvas mask
 * animation, pointer tilt, and the destination transition.
 *
 * Everything that runs per frame lives in refs so React never re-renders at
 * display speed; React state changes only on discrete events (destination
 * changes, phase changes, the boot counter).
 */
export function usePortalExperience(onArrive?: (route: string) => void): PortalExperienceApi {
  const reducedMotion = useReducedMotion();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<PortalPhase>('booting');
  const [progress, setProgress] = useState(0);
  const [revision, setRevision] = useState(0);

  const portalRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const maskState = useRef(createMaskState());
  const busy = useRef(false);
  const phaseRef = useRef<PortalPhase>('booting');
  const indexRef = useRef(0);
  const sceneCache = useRef(new Map<string, PortalSceneData>());
  const sceneDataRef = useRef<PortalSceneData | null>(null);
  const cancellation = useRef({ cancelled: false });
  const dprRef = useRef(1);
  const arrivalCallback = useRef(onArrive);
  arrivalCallback.current = onArrive;

  const sceneFor = useCallback((destination: PortalDestination): PortalSceneData => {
    const cached = sceneCache.current.get(destination.key);
    if (cached) return cached;
    const built = buildSceneData(destination);
    sceneCache.current.set(destination.key, built);
    return built;
  }, []);

  const destination = destinationAt(currentIndex);
  const nextDestination = destinationAt(nextIndex(currentIndex));
  const scene = sceneFor(destination);

  useEffect(() => {
    sceneDataRef.current = scene;
  }, [scene]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);

  /* ------------------------------------------------------------------ */
  /* canvas sizing                                                      */
  /* ------------------------------------------------------------------ */

  const sizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  /* ------------------------------------------------------------------ */
  /* boot sequence — an honest, timed "calibration" instead of a video  */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    sizeCanvas();
    const start = performance.now();
    const duration = reducedMotion ? 600 : BOOT_SEQUENCE_MS;
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setProgress(Math.round(easeInOutCubic(t) * 100));
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setPhase('revealing');
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  // Once the boot counter finishes, open the mask onto the first destination.
  useEffect(() => {
    if (phase !== 'revealing') return;
    const state = maskState.current;
    state.maskScale = 0;
    state.expansion = 0;
    let cancelled = false;
    const token = cancellation.current;
    animateValue(
      reducedMotion ? 300 : REVEAL_MS,
      0,
      1,
      (value) => {
        state.maskScale = value;
      },
      token,
    ).then(() => {
      if (cancelled || token.cancelled) return;
      setPhase('ready');
    });
    // Safety net: if rAF is throttled (background tab, aggressive power saving)
    // the mask still finishes opening and the controls never stay disabled.
    const guard = window.setTimeout(
      () => {
        if (cancelled) return;
        state.maskScale = 1;
        setPhase('ready');
      },
      (reducedMotion ? 300 : REVEAL_MS) + 900,
    );
    return () => {
      cancelled = true;
      window.clearTimeout(guard);
    };
  }, [phase, reducedMotion]);

  /* ------------------------------------------------------------------ */
  /* pointer tilt                                                       */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (reducedMotion) return;
    const onMove = (event: PointerEvent) => {
      if (phaseRef.current === 'transitioning' || busy.current) return;
      const state = maskState.current;
      updateTiltTargets(state, event.clientX, event.clientY, window.innerWidth, window.innerHeight);
    };
    const onLeave = () => resetTiltTargets(maskState.current);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
    };
  }, [reducedMotion]);

  /* ------------------------------------------------------------------ */
  /* the render loop                                                    */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    let frame = 0;
    let last = 0;
    let running = true;
    const started = performance.now();

    const loop = (now: number) => {
      if (!running) return;
      const dt = last === 0 ? 16 : Math.min(now - last, 40);
      last = now;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const data = sceneDataRef.current;
      const state = maskState.current;

      if (ctx && canvas && data) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const dpr = dprRef.current;
        if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
          sizeCanvas();
        }

        advanceTilt(state, dt, reducedMotion);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);

        // The scene behind the aperture is painted flat-out, screen-locked.
        ctx.globalAlpha = state.opacity;
        drawPortalScene({
          ctx,
          width,
          height,
          time: reducedMotion ? 0 : now - started,
          data,
          reducedMotion,
        });

        const rect = portalRef.current?.getBoundingClientRect();
        if (rect && rect.width > 1) {
          // Progressively darken everything outside the aperture.
          const cover = clamp01(state.expansion);
          const outsideAlpha = 0.62 * (1 - cover) + 0.55 * cover;
          const geometry = computeMaskGeometry(
            state,
            { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
            width,
            height,
          );
          if (geometry.points.length > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, width, height);
            tracePath(ctx, geometry.points);
            ctx.fillStyle = `rgba(3,5,11,${outsideAlpha})`;
            ctx.fill('evenodd');
            ctx.restore();

            // Crisp light edge: the aperture reads as glass, not a cut-out.
            ctx.save();
            tracePath(ctx, geometry.points);
            ctx.strokeStyle = `rgba(127,228,251,${0.3 - cover * 0.28})`;
            ctx.lineWidth = 1.25;
            ctx.stroke();
            ctx.restore();
          }

          if (cover > 0.9 && phaseRef.current === 'transitioning') {
            drawShade(ctx, width, height);
          }
        }

        ctx.globalAlpha = 1;
      }

      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(frame);
    };
  }, [reducedMotion, sizeCanvas]);

  /* ------------------------------------------------------------------ */
  /* travel                                                             */
  /* ------------------------------------------------------------------ */

  const travel = useCallback(() => {
    if (busy.current || phaseRef.current === 'transitioning' || phaseRef.current === 'booting') return;
    busy.current = true;
    resetTiltTargets(maskState.current);
    const token = cancellation.current;
    const state = maskState.current;

    setPhase('transitioning');

    const run = async () => {
      try {
        await animateValue(
          reducedMotion ? 200 : 1100,
          0,
          1,
          (value) => {
            state.expansion = value;
          },
          token,
        );
        if (token.cancelled) return;

        const next = nextIndex(indexRef.current);
        // Commit: swap the scene under a flat, full-bleed canvas.
        state.opacity = 0;
        setCurrentIndex(next);
        setRevision((value) => value + 1);
        // Two frames so the new scene data is committed before we fade back in.
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        if (token.cancelled) return;

        state.expansion = 0;
        state.maskScale = 0;
        state.opacity = 1;
        setPhase('revealing');
        busy.current = false;
      } catch {
        // Never leave the portal stuck mid-transition.
        state.expansion = 0;
        state.maskScale = 1;
        state.opacity = 1;
        setPhase('ready');
        busy.current = false;
      }
    };

    void run();
  }, [reducedMotion]);

  const selectIndex = useCallback(
    (index: number) => {
      const target =
        ((index % PORTAL_DESTINATIONS.length) + PORTAL_DESTINATIONS.length) % PORTAL_DESTINATIONS.length;

      // A section chosen while the boot veil is still up is honoured
      // immediately — the intro must never trap the user.
      if (phaseRef.current === 'booting') {
        setProgress(100);
        setCurrentIndex(target);
        setRevision((value) => value + 1);
        maskState.current.maskScale = 0;
        setPhase('revealing');
        return;
      }

      if (busy.current || target === indexRef.current) return;
      busy.current = true;
      const token = cancellation.current;
      const state = maskState.current;
      setPhase('transitioning');
      const run = async () => {
        try {
          await animateValue(reducedMotion ? 120 : 520, 1, 0, (value) => {
            state.maskScale = value;
          }, token);
          if (token.cancelled) return;
          state.opacity = 0;
          setCurrentIndex(target);
          setRevision((value) => value + 1);
          await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
          state.maskScale = 0;
          state.opacity = 1;
          setPhase('revealing');
          busy.current = false;
        } catch {
          state.maskScale = 1;
          state.opacity = 1;
          setPhase('ready');
          busy.current = false;
        }
      };
      void run();
    },
    [reducedMotion],
  );

  /** Readiness follows the mask, not a timer: the travel button only unlocks
   *  once the aperture is actually open. */
  useEffect(() => {
    if (phase !== 'revealing') return;
    let frame = 0;
    const poll = () => {
      if (maskState.current.maskScale > 0.995) {
        setPhase('ready');
        return;
      }
      frame = requestAnimationFrame(poll);
    };
    frame = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  const skipBoot = useCallback(() => {
    setProgress(100);
    setPhase('revealing');
  }, []);

  // Clean up any in-flight animation on unmount.
  useEffect(() => {
    const token = cancellation.current;
    return () => {
      token.cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onResize = () => sizeCanvas();
    window.addEventListener('resize', onResize, { orientation: 'portrait' } as never);
    return () => window.removeEventListener('resize', onResize);
  }, [sizeCanvas]);

  return {
    currentIndex,
    destination,
    nextDestination,
    scene,
    phase,
    progress,
    reducedMotion,
    portalRef,
    canvasRef,
    revision,
    travel,
    selectIndex,
    skipBoot,
  };
}
