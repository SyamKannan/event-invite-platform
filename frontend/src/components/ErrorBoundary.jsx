// ERROR BOUNDARY — stops one broken section (e.g. an unexpected API shape)
// from white-screening the whole page. React only supports this as a class
// component. `fallback` defaults to rendering nothing, which is what we want
// per-section on the public page: the rest of the invitation stays usable.

import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error(`[ErrorBoundary${this.props.name ? `: ${this.props.name}` : ''}]`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}

export function PageErrorFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6 text-center text-fg">
      <div>
        <p className="font-script text-4xl text-accent">Something went wrong</p>
        <p className="mt-3 text-fg-soft">Please refresh the page to try again.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded-full border border-accent/40 px-5 py-2 text-xs uppercase tracking-[0.2em] text-fg-soft transition hover:bg-accent/10"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
