import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { initAnalytics, trackPageView } from '../lib/analytics'

/**
 * AnalyticsProvider — Initializes GA4 + Clarity and tracks page views.
 *
 * Place this inside your Router (needs useLocation) but outside Routes.
 * It runs client-side only and does not affect SSR/hydration.
 *
 * Usage:
 *   <BrowserRouter>
 *     <AnalyticsProvider />
 *     <App />
 *   </BrowserRouter>
 */
export default function AnalyticsProvider() {
  // Initialize analytics scripts once on mount
  useEffect(() => {
    initAnalytics()
  }, [])

  // Track page views on every route change
  const location = useLocation()

  useEffect(() => {
    trackPageView(location.pathname + location.search)
  }, [location.pathname, location.search])

  return null // This component renders nothing
}
