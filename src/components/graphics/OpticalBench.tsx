import { useEffect, useRef, useState } from 'react';
import { OpticalBench3D } from '../../graphics/OpticalBench3D';
import { isWebGLAvailable, type PerfSnapshot, type QualityTier } from '../../graphics/renderQuality';
import type { OpticalResult } from '../../physics/types';
import type { ViewMode } from '../../experiment/types';
import { RayDiagram } from './RayDiagram';
import './optical-bench.css';

interface Props {
  readonly result: OpticalResult;
  readonly laserOn: boolean;
  readonly view: ViewMode;
  readonly polariserDeg: number;
  readonly inputMode: 'unpolarised' | 's' | 'p' | 'linear';
  readonly onPerf?: (snapshot: PerfSnapshot) => void;
  readonly onFallback?: (reason: string) => void;
  readonly onTier?: (tier: QualityTier) => void;
  readonly resetSignal: number;
}

/**
 * The 3D bench, with an automatic, non-blocking 2D fallback.
 * No black screen is possible: the SVG diagram is always renderable.
 */
export function OpticalBench({
  result,
  laserOn,
  view,
  polariserDeg,
  inputMode,
  onPerf,
  onFallback,
  onTier,
  resetSignal,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const benchRef = useRef<OpticalBench3D | null>(null);
  const [fallback, setFallback] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const handlers = useRef({ onPerf, onFallback, onTier });
  handlers.current = { onPerf, onFallback, onTier };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (!isWebGLAvailable()) {
      setFallback('WebGL is unavailable on this device — showing the exact 2D ray bench.');
      handlers.current.onFallback?.('webgl-unavailable');
      return;
    }

    const bench = new OpticalBench3D(host, {
      onPerf: (snapshot) => handlers.current.onPerf?.(snapshot),
      onTier: (tier) => handlers.current.onTier?.(tier),
    });
    const ok = bench.init();
    if (!ok) {
      setFallback('The 3D bench could not initialise — the 2D ray bench is active.');
      handlers.current.onFallback?.('init-failed');
      return;
    }
    benchRef.current = bench;
    bench.observeResize();
    setReady(true);

    const failTimer = window.setTimeout(() => {
      if (!bench.isSupported) setFallback('3D rendering was interrupted — 2D bench active.');
    }, 6000);

    return () => {
      window.clearTimeout(failTimer);
      bench.dispose();
      benchRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const bench = benchRef.current;
    if (!bench) return;
    bench.update({
      incidenceDeg: result.incidenceDeg,
      laserOn,
      view,
      polariserDeg,
      n1: result.n1,
      n2: result.n2,
      reflectedFraction: result.fresnel.RUnpolarised,
      inputMode,
    });
  }, [result, laserOn, view, polariserDeg, inputMode]);

  useEffect(() => {
    if (resetSignal > 0) benchRef.current?.resetCamera();
  }, [resetSignal]);

  if (fallback) {
    return (
      <div className="bench bench--fallback">
        <div className="bench__banner" role="status">
          <span className="chip chip--amber">2D FALLBACK</span>
          <span>{fallback}</span>
        </div>
        <RayDiagram result={result} laserOn={laserOn} height={430} />
      </div>
    );
  }

  return (
    <div className={`bench bench--3d${ready ? ' is-ready' : ''}`}>
      <div ref={hostRef} className="bench__host" aria-hidden="true" />
      {!ready && (
        <div className="bench__loading" role="status">
          <div className="bench__loader" />
          <p className="label">ALIGNING OPTICAL BENCH</p>
          <p className="note">Geometry is already computed — the scene is being lit.</p>
        </div>
      )}
      <p className="sr-only">
        Interactive 3D optical bench. Incidence {result.incidenceDeg.toFixed(1)} degrees, reflection{' '}
        {result.reflectionDeg.toFixed(1)} degrees, refraction{' '}
        {result.refractionDeg === null ? 'total internal reflection' : `${result.refractionDeg.toFixed(1)} degrees`}.
        Orbiting the bench changes the camera only, never the physics.
      </p>
    </div>
  );
}
