import { Navigate } from 'react-router-dom'
import { useRole } from './RoleProvider'

export default function ProtectedRoute({ children }) {
  const { role, loading } = useRole()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading…</div>
  }

  if (!role) {
    return <Navigate to="/" replace />
  }

  return children
}
