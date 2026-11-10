import { useExperiment } from '../../experiment/experimentStore';
import './feedback.css';

export function ToastHost() {
  const { toast, clearToast } = useExperiment();
  if (!toast) return null;
  return (
    <div className="toast-host" role="status" aria-live="polite">
      <div className="toast">
        <span className="toast__dot" aria-hidden="true" />
        <span>{toast}</span>
        <button type="button" className="toast__close" onClick={clearToast} aria-label="Dismiss notification">
          ×
        </button>
      </div>
    </div>
  );
}
