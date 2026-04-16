import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  label?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="bg-sev-remBg border border-sev-remFg/30 rounded-xl p-5 my-4 text-sm">
          <div className="font-semibold text-sev-remFg mb-2">
            Something went wrong{this.props.label ? ` in ${this.props.label}` : ''}.
          </div>
          <pre className="mono text-xs text-ink whitespace-pre-wrap break-all">
            {this.state.error.message}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            className="mt-3 px-3 py-1 rounded bg-surface border border-edge text-xs hover:bg-primary-soft"
          >
            Dismiss
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
