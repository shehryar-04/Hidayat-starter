import { Navigate } from 'react-router-dom'
import { useRole } from './RoleProvider'

export default function ProtectedRoute({ children }) {
  const { role, loading } = useRole()

  // Only show loading on initial app load, not on subsequent re-checks
  // If we already have a role, keep showing the content while re-validating
  if (loading && !role) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading…</div>
  }

  if (!role) {
    return <Navigate to="/login" replace />
  }

  return children
}
