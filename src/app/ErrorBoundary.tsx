import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  readonly children: ReactNode;
  readonly fallbackTitle?: string;
}

interface State {
  readonly error: Error | null;
}

/**
 * Never replaces the app with a blank screen: it renders a readable,
 * navigable recovery panel instead.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[BrewstersLab] recovered from a component error', error, info.componentStack);
  }

  private reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="page shell">
        <div className="panel bracketed" style={{ padding: 'var(--sp-6)', maxWidth: 720, margin: '0 auto' }}>
          <p className="eyebrow">SUBSYSTEM RECOVERY</p>
          <h1 className="display" style={{ fontSize: 'var(--step-3)', margin: 'var(--sp-3) 0' }}>
            {this.props.fallbackTitle ?? 'The bench hit an unexpected fault'}
          </h1>
          <p className="secondary">
            The laboratory is still running — only this panel failed to render. You can retry the panel or
            move to another section. The source observation data is unaffected.
          </p>
          <pre
            className="mono"
            style={{
              background: 'rgba(5,8,16,0.8)',
              border: '1px solid var(--hairline)',
              borderRadius: 'var(--r-sm)',
              padding: 'var(--sp-3)',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              overflowX: 'auto',
            }}
          >
            {error.message}
          </pre>
          <div className="row wrap" style={{ gap: 'var(--sp-3)', marginTop: 'var(--sp-4)' }}>
            <button type="button" className="btn btn--primary" onClick={this.reset}>
              RETRY PANEL
            </button>
            <a className="btn" href="/">
              RETURN TO LAB HOME
            </a>
            <a className="btn btn--ghost" href="/observations">
              OPEN SOURCE DATA
            </a>
          </div>
        </div>
      </div>
    );
  }
}
