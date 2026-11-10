import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../app/appState';

/**
 * Refined contextual cursor: a 12 px dot plus a 36 px translucent orbit that
 * eases behind it. Only enabled for fine pointers — touch devices and
 * reduced-motion users keep the native cursor, and it never suppresses the
 * native cursor until the first real pointer movement proves it is working.
 */
export function CustomCursor({ enterLabel = 'ENTER' }: { readonly enterLabel?: string }) {
  const dotRef = useRef<HTMLSpanElement>(null);
  const orbitRef = useRef<HTMLSpanElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const finePointer = window.matchMedia?.('(pointer: fine)').matches ?? false;
    if (!finePointer || reducedMotion) return;

    const root = rootRef.current;
    const dot = dotRef.current;
    const orbit = orbitRef.current;
    if (!root || !dot || !orbit) return;

    let pointerX = -100;
    let pointerY = -100;
    let orbitX = -100;
    let orbitY = -100;
    let visible = false;
    let frame = 0;

    const handleMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!visible) {
        visible = true;
        root.classList.add('is-visible');
        document.body.classList.add('cursor-custom');
      }
      const target = event.target as HTMLElement | null;
      const interactive = target?.closest(
        'a, button, [role="button"], input, select, textarea, [data-cursor="enter"]',
      );
      root.classList.toggle('is-enter', Boolean(interactive));
      if (labelRef.current) {
        labelRef.current.textContent =
          target?.closest('[data-cursor-label]')?.getAttribute('data-cursor-label') ?? enterLabel;
      }
    };

    const handleLeave = () => {
      visible = false;
      root.classList.remove('is-visible');
      document.body.classList.remove('cursor-custom');
    };

    const loop = () => {
      // Dot follows exactly; the orbit eases, which is the whole effect.
      if (dot) dot.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0) translate(-50%, -50%)`;
      orbitX += (pointerX - orbitX) * 0.2;
      orbitY += (pointerY - orbitY) * 0.2;
      if (orbit) orbit.style.transform = `translate3d(${orbitX}px, ${orbitY}px, 0) translate(-50%, -50%)`;
      if (labelRef.current) {
        labelRef.current.style.transform = `translate3d(${orbitX}px, ${orbitY + 26}px, 0) translateX(-50%)`;
      }
      frame = requestAnimationFrame(loop);
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    document.addEventListener('pointerleave', handleLeave);
    frame = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerleave', handleLeave);
      cancelAnimationFrame(frame);
      document.body.classList.remove('cursor-custom');
    };
  }, [enterLabel, reducedMotion]);

  if (reducedMotion) return null;

  return (
    <div className="cursor" ref={rootRef} aria-hidden="true">
      <span className="cursor__orbit" ref={orbitRef} />
      <span className="cursor__dot" ref={dotRef} />
      <span className="cursor__label" ref={labelRef}>
        {enterLabel}
      </span>
    </div>
  );
}
