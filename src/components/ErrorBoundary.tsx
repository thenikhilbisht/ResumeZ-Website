import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught application error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080711] text-[#F5F1E8] flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl border border-[#292344] bg-[#151329] p-6 shadow-2xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#A94D4D]/20 text-[#E57373] mb-4">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-[#F5F1E8] mb-2">Something went wrong</h2>
            <p className="text-sm text-[#AAA6B7] mb-6">
              An unexpected error occurred while rendering this section. You can reload the page or return to the main dashboard.
            </p>
            {this.state.error && (
              <div className="mb-6 rounded-xl bg-[#080711] p-3 text-left border border-[#292344] overflow-auto max-h-32 text-xs text-[#E57373] font-mono">
                {this.state.error.message || 'Unknown error'}
              </div>
            )}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 rounded-xl bg-[#292344] px-4 py-2.5 text-sm font-semibold text-[#F5F1E8] hover:bg-[#342D56] transition cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 rounded-xl bg-[#C6A75E] px-4 py-2.5 text-sm font-semibold text-[#080711] hover:bg-[#D5B97B] transition cursor-pointer shadow-lg shadow-[#C6A75E]/20"
              >
                <Home className="h-4 w-4" />
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
