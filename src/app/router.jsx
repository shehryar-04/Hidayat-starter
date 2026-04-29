import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './LoginPage'
import ProtectedRoute from './ProtectedRoute'
import FeatureFlagGuard from './FeatureFlagGuard'
import Layout from './Layout'
import Dashboard from './Dashboard'
import HomePage from './HomePage'
import { useRole } from './RoleProvider'

// Module imports
import DarsENizamiModule from '../modules/dars-e-nizami'
import HifzModule from '../modules/hifz'
import NazraModule from '../modules/nazra'
import ShortCoursesModule from '../modules/short-courses'
import DarulIftaModule from '../modules/darul-ifta'
import ResearchCenterModule from '../modules/research-center'
import WazifaModule from '../modules/wazifa'
import StudentReportsModule from '../modules/reports'
import StudentAdminModule from '../modules/student-admin'
import ScholarAdminModule from '../modules/scholar-admin'

/** Root route: show HomePage for guests, Dashboard for authenticated users */
function RootRoute() {
  const { role, loading } = useRole()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading…</div>
  if (!role) return <HomePage />
  return (
    <Layout>
      <Dashboard />
    </Layout>
  )
}

/**
 * Darul Ifta is public — guests can browse fatwas.
 * Logged-in users get the full Layout wrapper.
 */
function DarulIftaPublicRoute() {
  const { role, loading } = useRole()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading…</div>
  if (!role) {
    // Guest: show module without sidebar layout
    return <DarulIftaModule />
  }
  return (
    <Layout>
      <FeatureFlagGuard flagKey="darul_ifta">
        <DarulIftaModule />
      </FeatureFlagGuard>
    </Layout>
  )
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Public home page + login */}
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected module routes */}
      <Route path="/dars-e-nizami/*" element={<ProtectedRoute><Layout><FeatureFlagGuard flagKey="dars_e_nizami"><DarsENizamiModule /></FeatureFlagGuard></Layout></ProtectedRoute>} />
      <Route path="/hifz/*" element={<ProtectedRoute><Layout><FeatureFlagGuard flagKey="hifz"><HifzModule /></FeatureFlagGuard></Layout></ProtectedRoute>} />
      <Route path="/nazra/*" element={<ProtectedRoute><Layout><FeatureFlagGuard flagKey="nazra"><NazraModule /></FeatureFlagGuard></Layout></ProtectedRoute>} />
      <Route path="/short-courses/*" element={<ProtectedRoute><Layout><FeatureFlagGuard flagKey="short_courses"><ShortCoursesModule /></FeatureFlagGuard></Layout></ProtectedRoute>} />
      {/* Darul Ifta — public route, no ProtectedRoute */}
      <Route path="/darul-ifta/*" element={<DarulIftaPublicRoute />} />
      <Route path="/research-center/*" element={<ProtectedRoute><Layout><FeatureFlagGuard flagKey="research_center"><ResearchCenterModule /></FeatureFlagGuard></Layout></ProtectedRoute>} />
      <Route path="/wazifa/*" element={<ProtectedRoute><Layout><FeatureFlagGuard flagKey="wazifa"><WazifaModule /></FeatureFlagGuard></Layout></ProtectedRoute>} />
      <Route path="/reports/*" element={<ProtectedRoute><Layout><FeatureFlagGuard flagKey="student_reports"><StudentReportsModule /></FeatureFlagGuard></Layout></ProtectedRoute>} />
      <Route path="/student-admin/*" element={<ProtectedRoute><Layout><StudentAdminModule /></Layout></ProtectedRoute>} />
      <Route path="/scholar-admin/*" element={<ProtectedRoute><Layout><ScholarAdminModule /></Layout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
