import { useEffect, useRef, useState } from 'react';
import { OpticalPortal, type PortalState } from '../../graphics/OpticalPortal';
import './aperture.css';

interface Props {
  readonly state: PortalState;
  readonly reducedMotion?: boolean;
}

/**
 * The signature interaction: a glass aperture that holds the live optical
 * condition. Pointer tilt is decorative; the physics inside is exact.
 * Falls back to a static SVG-less CSS panel if Canvas is unavailable.
 */
export function OpticalAperture({ state, reducedMotion = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const portalRef = useRef<OpticalPortal | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const portal = new OpticalPortal(canvas, state);
    if (!portal.init()) {
      setFailed(true);
      return;
    }
    portalRef.current = portal;
    const handleHidden = () => (document.hidden ? portal.stop() : portal.start());
    document.addEventListener('visibilitychange', handleHidden);
    return () => {
      document.removeEventListener('visibilitychange', handleHidden);
      portal.dispose();
      portalRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    portalRef.current?.update(state);
  }, [state]);

  return (
    <div className={`aperture${reducedMotion ? ' aperture--still' : ''}`}>
      <div className="aperture__frame">
        <div className="aperture__glass">
          {failed ? (
            <div className="aperture__fallback">
              <p className="label">OPTICAL APERTURE</p>
              <p className="display aperture__fallback-value">
                {state.incidenceDeg.toFixed(1)}° → {state.brewsterDeg.toFixed(2)}°
              </p>
              <p className="note">
                Canvas rendering is unavailable, so the aperture shows the live numerical relation
                instead. The full simulator is unaffected.
              </p>
            </div>
          ) : (
            <canvas ref={canvasRef} className="aperture__canvas" aria-hidden="true" />
          )}
          <span className="aperture__corner aperture__corner--tl" />
          <span className="aperture__corner aperture__corner--tr" />
          <span className="aperture__corner aperture__corner--bl" />
          <span className="aperture__corner aperture__corner--br" />
          <div className="aperture__hud">
            <span className="mono">INTERFACE APERTURE</span>
            <span className="mono aperture__hud-live">
              θi {state.incidenceDeg.toFixed(1)}° / θB {state.brewsterDeg.toFixed(2)}°
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
