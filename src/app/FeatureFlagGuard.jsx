import { Navigate } from 'react-router-dom'
import { useFeatureFlags } from './FeatureFlagProvider'

/**
 * FeatureFlagGuard wraps a route and redirects to dashboard if the feature flag is disabled.
 * Requirement 3.4: If a user navigates directly to a URL for a disabled module, redirect to dashboard.
 */
export default function FeatureFlagGuard({ children, flagKey }) {
  const { flags, loading } = useFeatureFlags()

  if (loading) {
    return <div>Loading...</div>
  }

  // If the flag is disabled, redirect to dashboard
  if (!flags[flagKey]) {
    return <Navigate to="/" replace />
  }

  return children
}
