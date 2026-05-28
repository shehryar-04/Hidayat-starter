import { Component } from 'react'

/**
 * Global Error Boundary — catches unhandled React errors and shows
 * a user-friendly fallback instead of a white screen.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log to error tracking service (Sentry, etc.) when integrated
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <img src="/assets/LOGO_HIDAYAT.png" alt="Hidayat" className="w-16 h-16 mx-auto mb-6 opacity-60" />
            <h1 className="text-2xl font-bold text-neutral-800 mb-3">Something went wrong</h1>
            <p className="text-neutral-500 text-sm mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Refresh Page
            </button>
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-neutral-400 cursor-pointer">Technical details</summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 rounded p-3 overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
