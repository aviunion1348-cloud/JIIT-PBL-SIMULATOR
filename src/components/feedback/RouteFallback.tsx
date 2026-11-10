import './feedback.css';

/**
 * Shown while a lazily-loaded section resolves. Never a blank screen: the
 * text explains what is happening and the app shell stays visible.
 */
export function RouteFallback({ active = false }: { readonly active?: boolean }) {
  if (!active) return null;
  return (
    <div className="route-fallback" role="status" aria-live="polite">
      <div className="route-fallback__bar">
        <span />
      </div>
      <p className="label">LOADING LABORATORY SECTION</p>
    </div>
  );
}
