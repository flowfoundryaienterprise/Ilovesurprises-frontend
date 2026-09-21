import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RotateCcw, AlertTriangle, Home } from 'lucide-react';

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
    console.error('Uncaught error in I Love Surprises platform:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white text-[#141219] flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center p-6 sm:p-8 rounded-[24px] bg-[#fffafb] border border-[#eedbe6] shadow-[0_16px_40px_rgba(50,31,63,0.08)]">
            <div className="w-14 h-14 rounded-full bg-[#fff1f2] text-[#D30915] border border-[#fecdd3] flex items-center justify-center mx-auto mb-4 shadow-2xs">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-[#141219] tracking-tight m-0 mb-2">
              Something went wrong
            </h1>

            <p className="text-xs sm:text-sm text-[#716d77] m-0 mb-6 leading-relaxed">
              We encountered a temporary loading issue. Click below to refresh and load the latest updates.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[12px] bg-[#D30915] hover:bg-[#b50711] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reload Website</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[12px] bg-white border border-[#eedbe6] hover:bg-stone-50 text-[#141219] font-bold text-xs transition-all shadow-2xs cursor-pointer active:scale-95"
              >
                <Home className="w-4 h-4 text-[#716d77]" />
                <span>Back to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
