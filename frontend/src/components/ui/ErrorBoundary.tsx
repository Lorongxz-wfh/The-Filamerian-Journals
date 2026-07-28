import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import api from '@/services/api';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Exception:', error, errorInfo);
    try {
      api.post('/public/client-error', {
        message: error.message || 'React Component Crash',
        file: 'Frontend React DOM',
        line: 0,
        path: window.location.href,
        stack_trace: `${error.stack}\n\nComponent Stack:\n${errorInfo.componentStack}`,
      }).catch(() => {});
    } catch (e) {
      // Ignore logging failures
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6 bg-surface border border-border">
          <div className="max-w-md text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-primary">An unexpected interface error occurred</h2>
              <p className="text-xs text-muted">
                Our system error tracker has automatically logged this incident for investigation.
              </p>
            </div>
            {this.state.error?.message && (
              <div className="p-3 bg-background border border-border text-left font-mono text-[11px] text-red-600 overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
