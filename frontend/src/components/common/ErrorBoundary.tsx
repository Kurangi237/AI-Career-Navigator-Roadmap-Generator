import React from 'react';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || 'Unexpected UI error' };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Keep logging in development/production for crash visibility.
    // eslint-disable-next-line no-console
    console.error('UI crash caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full rounded-xl border border-slate-700 bg-slate-900/80 p-6">
            <h1 className="text-xl font-bold">Something went wrong</h1>
            <p className="text-sm text-slate-300 mt-2">
              The page hit an unexpected error and was safely stopped.
            </p>
            {this.state.message ? (
              <p className="mt-3 text-xs text-rose-300 break-words">{this.state.message}</p>
            ) : null}
            <button
              onClick={this.handleReload}
              className="mt-5 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
