import { Navigate } from 'react-router-dom'
import { useFeatureFlags } from './FeatureFlagProvider'

/**
 * FeatureFlagGuard wraps a route and redirects to dashboard if the feature flag is disabled.
 * Requirement 3.4: If a user navigates directly to a URL for a disabled module, redirect to dashboard.
 */
export default function FeatureFlagGuard({ children, flagKey }) {
  const { flags, loading } = useFeatureFlags()

  // Only block on initial load. Once flags are loaded, keep showing content
  // even during background refetches to prevent unmounting.
  if (loading && !flags[flagKey] && flags[flagKey] === undefined) {
    return <div>Loading...</div>
  }

  // If the flag is disabled, redirect to dashboard
  if (!loading && !flags[flagKey]) {
    return <Navigate to="/" replace />
  }

  return children
}
