'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  moduleName?: string;
  fallbackHeight?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[WidgetErrorBoundary: ${this.props.moduleName || 'Widget'}] caught error:`, error, errorInfo);
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          className={`flex flex-col items-center justify-center p-6 rounded-xl bg-[#0c101c] border border-rose-500/20 text-center font-mono ${
            this.props.fallbackHeight || 'min-h-[180px]'
          }`}
        >
          <div className="flex items-center gap-2 text-rose-400 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {this.props.moduleName ? `${this.props.moduleName} Offline` : 'Widget Temporarily Unavailable'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 max-w-sm mb-3">
            Institutional live failover active. Other terminal modules are running normally.
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-white/[0.1] hover:bg-white/[0.05] text-xs text-slate-300 font-bold transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Module</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
