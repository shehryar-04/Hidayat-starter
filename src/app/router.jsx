import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import LoginPage from './LoginPage'
import AuthCallbackPage from './AuthCallbackPage'
import ResetPasswordPage from './ResetPasswordPage'
import ProtectedRoute from './ProtectedRoute'
import FeatureFlagGuard from './FeatureFlagGuard'
import HomePage from './HomePage'
import Dashboard from './Dashboard'
import PublicTopNav from './PublicTopNav'
import AuthenticatedLayout from './AuthenticatedLayout'
import { useRole } from './RoleProvider'

// Module imports
import DarsENizamiModule from '../modules/dars-e-nizami'
import HifzModule from '../modules/hifz'
import NazraModule from '../modules/nazra'
import ShortCoursesModule from '../modules/short-courses'
import DarulIftaModule from '../modules/darul-ifta'
import ResearchCenterModule from '../modules/research-center'
import WazifaModule from '../modules/wazifa'
import ThemeShowcase from './ThemeShowcase'

// Lazy-loaded public pages
const CertificateVerifyPage = lazy(() => import('../modules/short-courses/CertificateVerifyPage'))
const CertificatePage = lazy(() => import('../modules/short-courses/CertificatePage'))
const KnowledgeTestPage = lazy(() => import('./KnowledgeTestPage'))

// Lazy-loaded institutional content pages (company profile)
const AboutPage = lazy(() => import('../modules/institution/AboutPage'))
const DirectorMessagePage = lazy(() => import('../modules/institution/DirectorMessagePage'))
const MissionValuesPage = lazy(() => import('../modules/institution/MissionValuesPage'))
const TrainersPage = lazy(() => import('../modules/institution/TrainersPage'))
const ServicesPage = lazy(() => import('../modules/institution/ServicesPage'))
const TrainingPage = lazy(() => import('../modules/institution/TrainingPage'))
const ConsultancyPage = lazy(() => import('../modules/institution/ConsultancyPage'))
const DistanceLearningPage = lazy(() => import('../modules/institution/DistanceLearningPage'))
const EventsPage = lazy(() => import('../modules/institution/EventsPage'))
const ContactPage = lazy(() => import('../modules/institution/ContactPage'))
const PrivacyPolicyPage = lazy(() => import('../modules/institution/PrivacyPolicyPage'))
const TermsOfServicePage = lazy(() => import('../modules/institution/TermsOfServicePage'))
import StudentReportsModule from '../modules/reports'
import StudentAdminModule from '../modules/student-admin'
import ScholarAdminModule from '../modules/scholar-admin'
import ArticlesPage from '../modules/articles'
import DownloadsPage from '../modules/downloads'
import FatwaPlatformModule from '../modules/fatwa-platform'
import AdminDashboard from '../modules/admin-dashboard'
import AuditLogViewer from '../modules/admin-dashboard/AuditLogViewer'

/**
 * PublicShell — top navbar for public marketing and institutional pages.
 */
function PublicShell({ children }) {
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
 * AdaptiveShell — uses AuthenticatedLayout with SideNav when user is logged in,
 * or PublicShell with top navbar when user is a guest.
 */
function AdaptiveShell({ children }) {
  const { role } = useRole()

  if (role) {
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>
  }

  return <PublicShell>{children}</PublicShell>
}

/** Suspense fallback for lazily loaded pages. */
function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-neutral-400">Loading…</p>
    </div>
  )
}

/** Public content page: shared navbar + lazy boundary. */
function ContentRoute({ children }) {
  return (
    <PublicShell>
      <Suspense fallback={<PageFallback />}>{children}</Suspense>
    </PublicShell>
  )
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Home page — public landing accessible to everyone (guests + authenticated) */}
      <Route path="/" element={<HomePage />} />

      {/* Authentication */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route
        path="/reset-password"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <ResetPasswordPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      {/* Main Authenticated Hub / Dashboard with SideNav */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Dashboard />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      {/* Protected administrative modules */}
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <AdminDashboard />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-dashboard/audit-log"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <AuditLogViewer />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student-admin/*"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <StudentAdminModule />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/scholar-admin/*"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <ScholarAdminModule />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/short-courses/*"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <FeatureFlagGuard flagKey="short_courses">
                <ShortCoursesModule />
              </FeatureFlagGuard>
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/wazifa/*"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <FeatureFlagGuard flagKey="wazifa">
                <WazifaModule />
              </FeatureFlagGuard>
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/*"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <FeatureFlagGuard flagKey="student_reports">
                <StudentReportsModule />
              </FeatureFlagGuard>
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      {/* Academic modules */}
      <Route
        path="/dars-e-nizami/*"
        element={
          <AdaptiveShell>
            <FeatureFlagGuard flagKey="dars_e_nizami">
              <DarsENizamiModule />
            </FeatureFlagGuard>
          </AdaptiveShell>
        }
      />
      <Route
        path="/hifz/*"
        element={
          <AdaptiveShell>
            <FeatureFlagGuard flagKey="hifz">
              <HifzModule />
            </FeatureFlagGuard>
          </AdaptiveShell>
        }
      />
      <Route
        path="/nazra/*"
        element={
          <AdaptiveShell>
            <FeatureFlagGuard flagKey="nazra">
              <NazraModule />
            </FeatureFlagGuard>
          </AdaptiveShell>
        }
      />

      {/* Public / Hybrid Knowledge routes */}
      <Route path="/darul-ifta/*" element={<AdaptiveShell><DarulIftaModule /></AdaptiveShell>} />
      <Route path="/research-center/*" element={<AdaptiveShell><ResearchCenterModule /></AdaptiveShell>} />
      <Route path="/articles/*" element={<AdaptiveShell><ArticlesPage /></AdaptiveShell>} />
      <Route path="/downloads/*" element={<AdaptiveShell><DownloadsPage /></AdaptiveShell>} />
      <Route path="/fatwas/*" element={<AdaptiveShell><FatwaPlatformModule /></AdaptiveShell>} />
      <Route path="/darul-iftaa/*" element={<AdaptiveShell><FatwaPlatformModule /></AdaptiveShell>} />
      <Route path="/knowledge-test" element={<AdaptiveShell><Suspense fallback={<PageFallback />}><KnowledgeTestPage /></Suspense></AdaptiveShell>} />

      {/* Institutional content pages — public, sourced from company profile */}
      <Route path="/about" element={<ContentRoute><AboutPage /></ContentRoute>} />
      <Route path="/about/directors-message" element={<ContentRoute><DirectorMessagePage /></ContentRoute>} />
      <Route path="/about/mission-values" element={<ContentRoute><MissionValuesPage /></ContentRoute>} />
      <Route path="/about/trainers" element={<ContentRoute><TrainersPage /></ContentRoute>} />
      <Route path="/services" element={<ContentRoute><ServicesPage /></ContentRoute>} />
      <Route path="/services/training" element={<ContentRoute><TrainingPage /></ContentRoute>} />
      <Route path="/services/consultancy" element={<ContentRoute><ConsultancyPage /></ContentRoute>} />
      <Route path="/services/distance-learning" element={<ContentRoute><DistanceLearningPage /></ContentRoute>} />
      <Route path="/events" element={<ContentRoute><EventsPage /></ContentRoute>} />
      <Route path="/contact" element={<ContentRoute><ContactPage /></ContentRoute>} />
      <Route path="/privacy-policy" element={<ContentRoute><PrivacyPolicyPage /></ContentRoute>} />
      <Route path="/terms-of-service" element={<ContentRoute><TermsOfServicePage /></ContentRoute>} />

      {/* Certificate Verification — public, no login required */}
      <Route
        path="/certificate/verify/:code"
        element={
          <Suspense fallback={<PageFallback />}>
            <CertificateVerifyPage />
          </Suspense>
        }
      />

      {/* Certificate View & Download — protected (owner/admin) */}
      <Route
        path="/certificate/:id"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Suspense fallback={<PageFallback />}>
                <CertificatePage />
              </Suspense>
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      {/* Developer Theme Workbench & Component Showcase */}
      <Route
        path="/theme-showcase"
        element={
          <AdaptiveShell>
            <ThemeShowcase />
          </AdaptiveShell>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
