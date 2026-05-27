import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-homestead-beige flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 border-2 border-homestead-terracotta shadow-lg max-w-sm w-full text-center space-y-4">
            <div className="text-4xl">🦆</div>
            <h2 className="text-lg font-bold text-homestead-green">Something went wrong</h2>
            <p className="text-sm text-homestead-green/70">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={this.handleReset}
              className="bg-homestead-green text-homestead-beige px-6 py-2 rounded-lg font-semibold hover:opacity-90 cursor-pointer transition-opacity"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
