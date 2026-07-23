import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import LoginPage from './LoginPage'
import ProtectedRoute from './ProtectedRoute'
import FeatureFlagGuard from './FeatureFlagGuard'
import HomePage from './HomePage'
import Dashboard from './Dashboard'
import PublicTopNav from './PublicTopNav'
import { useRole } from './RoleProvider'

// Module imports
import DarsENizamiModule from '../modules/dars-e-nizami'
import HifzModule from '../modules/hifz'
import NazraModule from '../modules/nazra'
import ShortCoursesModule from '../modules/short-courses'
import DarulIftaModule from '../modules/darul-ifta'
import ResearchCenterModule from '../modules/research-center'
import WazifaModule from '../modules/wazifa'

// Lazy-loaded public pages
const CertificateVerifyPage = lazy(() => import('../modules/short-courses/CertificateVerifyPage'))
const CertificatePage = lazy(() => import('../modules/short-courses/CertificatePage'))
import StudentReportsModule from '../modules/reports'
import StudentAdminModule from '../modules/student-admin'
import ScholarAdminModule from '../modules/scholar-admin'
import ArticlesPage from '../modules/articles'
import DownloadsPage from '../modules/downloads'
import FatwaPlatformModule from '../modules/fatwa-platform'
import AdminDashboard from '../modules/admin-dashboard'
import AuditLogViewer from '../modules/admin-dashboard/AuditLogViewer'

/**
 * Shell wrapper — single navbar for all pages (guest + authenticated).
 * Content is rendered below the fixed navbar with top padding.
 */
function AppShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicTopNav />
      <main className="flex-1 pt-[57px] sm:pt-[65px]">
        {children}
      </main>
    </div>
  )
}

/**
 * SmartHome — Shows the public landing page (HomePage) for guests,
 * and the module hub (Dashboard) for authenticated users.
 */
function SmartHome() {
  const { role } = useRole()

  if (role) {
    return <AppShell><Dashboard /></AppShell>
  }
  return <HomePage />
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Home page — public landing for guests, module hub for authenticated */}
      <Route path="/" element={<SmartHome />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Under construction modules — no auth required, no flag guard */}
      <Route path="/dars-e-nizami/*" element={<AppShell><FeatureFlagGuard flagKey="dars_e_nizami"><DarsENizamiModule /></FeatureFlagGuard></AppShell>} />
      <Route path="/hifz/*" element={<AppShell><FeatureFlagGuard flagKey="hifz"><HifzModule /></FeatureFlagGuard></AppShell>} />
      <Route path="/nazra/*" element={<AppShell><FeatureFlagGuard flagKey="nazra"><NazraModule /></FeatureFlagGuard></AppShell>} />

      {/* Protected module routes */}
      <Route path="/admin-dashboard" element={<ProtectedRoute><AppShell><AdminDashboard /></AppShell></ProtectedRoute>} />
      <Route path="/admin-dashboard/audit-log" element={<ProtectedRoute><AppShell><AuditLogViewer /></AppShell></ProtectedRoute>} />
      <Route path="/short-courses/*" element={<ProtectedRoute><AppShell><FeatureFlagGuard flagKey="short_courses"><ShortCoursesModule /></FeatureFlagGuard></AppShell></ProtectedRoute>} />
      <Route path="/wazifa/*" element={<ProtectedRoute><AppShell><FeatureFlagGuard flagKey="wazifa"><WazifaModule /></FeatureFlagGuard></AppShell></ProtectedRoute>} />
      <Route path="/reports/*" element={<ProtectedRoute><AppShell><FeatureFlagGuard flagKey="student_reports"><StudentReportsModule /></FeatureFlagGuard></AppShell></ProtectedRoute>} />
      <Route path="/student-admin/*" element={<ProtectedRoute><AppShell><StudentAdminModule /></AppShell></ProtectedRoute>} />
      <Route path="/scholar-admin/*" element={<ProtectedRoute><AppShell><ScholarAdminModule /></AppShell></ProtectedRoute>} />

      {/* Public routes — accessible without login, same navbar */}
      <Route path="/darul-ifta/*" element={<AppShell><DarulIftaModule /></AppShell>} />
      <Route path="/research-center/*" element={<AppShell><ResearchCenterModule /></AppShell>} />
      <Route path="/articles/*" element={<AppShell><ArticlesPage /></AppShell>} />
      <Route path="/downloads/*" element={<AppShell><DownloadsPage /></AppShell>} />
      <Route path="/fatwas/*" element={<AppShell><FatwaPlatformModule /></AppShell>} />
      <Route path="/darul-iftaa/*" element={<AppShell><FatwaPlatformModule /></AppShell>} />

      {/* Certificate Verification — public, no login required */}
      <Route path="/certificate/verify/:code" element={
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>}>
          <CertificateVerifyPage />
        </Suspense>
      } />

      {/* Certificate View & Download — protected (owner/admin) */}
      <Route path="/certificate/:id" element={
        <ProtectedRoute>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>}>
            <CertificatePage />
          </Suspense>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
