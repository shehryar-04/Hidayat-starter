import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Home, User, LogOut, ChevronRight, ExternalLink, ShieldCheck, GraduationCap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRole } from './RoleProvider'
import { useProfile } from './useProfile'
import SideNav from './SideNav'
import Logo from './Logo'
import ProfileModal from './ProfileModal'
import { cn, ThemeLanguageToggle } from '../shared/ui'

function AvatarCircle({ avatarUrl, initials }) {
  const [err, setErr] = useState(false)
  if (avatarUrl && !err) {
    return (
      <img
        src={avatarUrl}
        alt="avatar"
        className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-500/30 shadow-xs"
        onError={() => setErr(true)}
      />
    )
  }
  return (
    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-primary-500/30 shadow-xs">
      {initials}
    </div>
  )
}

// Map routes to human friendly titles & breadcrumbs
const routeTitles = {
  '/dashboard': 'Dashboard',
  '/short-courses': 'Short Courses & LMS',
  '/dars-e-nizami': 'Dars-e-Nizami Curriculum',
  '/hifz': 'Hifz Program',
  '/nazra': 'Nazra Program',
  '/darul-ifta': 'Darul Ifta & Fatwas',
  '/fatwas': 'Fatwa Platform',
  '/fatwas/moderation': 'Fatwa Moderation',
  '/fatwas/analytics': 'Search Analytics',
  '/research-center': 'Research Publications',
  '/articles': 'Articles & Papers',
  '/downloads': 'Downloadable Resources',
  '/wazifa': 'Wazifa Management',
  '/reports': 'Student & Course Reports',
  '/knowledge-test': 'Knowledge Test',
  '/admin-dashboard': 'Operations Dashboard',
  '/admin-dashboard/audit-log': 'System Audit Log',
  '/student-admin': 'Student Administration',
  '/scholar-admin': 'Scholar Administration',
  '/about': 'About Hidayat',
  '/services': 'Services & Programs',
  '/events': 'Events & Seminars',
  '/contact': 'Contact & Support',
  '/reset-password': 'Change Password',
}

export default function AuthenticatedLayout({ children }) {
  const { role, signOut, switchRole, isTestingMode } = useRole()
  const { profile, avatarUrl } = useProfile()
  const location = useLocation()
  const navigate = useNavigate()

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('hidayat_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  // Save collapse preference
  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('hidayat_sidebar_collapsed', String(next))
      } catch {}
      return next
    })
  }

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
    setUserDropdownOpen(false)
  }, [location.pathname])

  const displayName = profile?.full_name || profile?.first_name || 'User'
  const initials = profile
    ? `${(profile.first_name || profile.full_name || '?').charAt(0)}${(profile.last_name || '').charAt(0)}`.toUpperCase()
    : '?'

  const currentTitle = Object.entries(routeTitles).find(([route]) =>
    location.pathname === route || location.pathname.startsWith(`${route}/`)
  )?.[1] || 'Hidayat Portal'

  const handleSignOut = async () => {
    setUserDropdownOpen(false)
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex bg-neutral-50/80 dark:bg-[#070d0a] text-neutral-900 dark:text-neutral-100 overflow-x-hidden font-sans transition-colors duration-200">
      {/* Desktop SideNav (fixed sticky on left) */}
      <div className="hidden md:block flex-shrink-0 sticky top-0 h-screen z-30">
        <SideNav
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          isMobile={false}
        />
      </div>

      {/* Mobile Drawer Backdrop and SideNav */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Slide-in Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
              className="relative w-[280px] max-w-[85vw] h-full shadow-2xl z-50 bg-white dark:bg-[#0f1a14]"
            >
              <SideNav
                collapsed={false}
                isMobile={true}
                onCloseMobile={() => setMobileOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 h-16 bg-white/90 dark:bg-[#0f1a14]/90 backdrop-blur-md border-b border-neutral-200/80 dark:border-[#1a2e23] px-4 sm:px-6 flex items-center justify-between gap-4 transition-colors duration-200">
          {/* Left section: Hamburger (mobile) + Page Title & Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#14221b] transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-sm truncate">
              <span className="hidden sm:inline font-medium text-neutral-400 dark:text-neutral-500">Portal</span>
              <ChevronRight className="hidden sm:inline w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600 flex-shrink-0" />
              <h1 className="font-semibold text-neutral-800 dark:text-neutral-100 text-sm sm:text-base truncate">
                {currentTitle}
              </h1>
            </div>
          </div>

          {/* Right section: Theme/Lang, Link to Public Home + User Avatar & Menu */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <ThemeLanguageToggle />

            {/* Direct button to Public Home */}
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-primary-700 dark:hover:text-primary-400 bg-neutral-100/80 dark:bg-[#14221b] hover:bg-primary-50 dark:hover:bg-primary-950/40 border border-neutral-200/80 dark:border-[#1a2e23] rounded-lg transition-all"
            >
              <Home className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              <span>Public Website</span>
              <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
            </Link>

            {/* User Dropdown trigger */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen((o) => !o)}
                className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-primary-500/20 transition-all cursor-pointer"
                aria-label="User profile menu"
              >
                <AvatarCircle avatarUrl={avatarUrl} initials={initials} />
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#0f1a14] rounded-2xl shadow-xl border border-neutral-200 dark:border-[#1a2e23] py-2 z-50 text-sm animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2.5 border-b border-neutral-100 dark:border-[#1a2e23]">
                      <p className="font-semibold text-neutral-800 dark:text-neutral-100 truncate">{displayName}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block",
                          role === 'student'
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            : "bg-primary-100 dark:bg-primary-950/60 text-primary-800 dark:text-primary-300 border border-primary-200 dark:border-primary-800"
                        )}>
                          {role} Account
                        </span>
                        <span className="text-[10px] text-neutral-400 font-medium">Testing Mode</span>
                      </div>
                    </div>

                    {/* Role Switcher Box (Testing Mode) */}
                    {isTestingMode && (
                      <div className="p-2.5 mx-2 my-1.5 bg-neutral-50 dark:bg-[#14221b] border border-neutral-200/70 dark:border-[#1a2e23] rounded-xl">
                        <div className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-2 flex items-center justify-between">
                          <span>Switch Role</span>
                          <span className="text-[10px] text-neutral-400 font-normal">Test views</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 bg-neutral-200/60 dark:bg-[#0c1410] p-1 rounded-lg">
                          <button
                            type="button"
                            onClick={() => {
                              switchRole('admin')
                              setUserDropdownOpen(false)
                            }}
                            className={cn(
                              'flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer',
                              role === 'admin'
                                ? 'bg-white dark:bg-primary-600 text-neutral-900 dark:text-white shadow-xs'
                                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                            )}
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-primary-600 dark:text-emerald-400" />
                            <span>Admin</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              switchRole('student')
                              setUserDropdownOpen(false)
                              if (
                                location.pathname.startsWith('/admin') ||
                                location.pathname.startsWith('/student-admin') ||
                                location.pathname.startsWith('/scholar-admin')
                              ) {
                                navigate('/short-courses')
                              }
                            }}
                            className={cn(
                              'flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer',
                              role === 'student'
                                ? 'bg-white dark:bg-primary-600 text-neutral-900 dark:text-white shadow-xs'
                                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                            )}
                          >
                            <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Student</span>
                          </button>
                        </div>
                        {role === 'admin' ? (
                          <button
                            type="button"
                            onClick={() => {
                              switchRole('student')
                              setUserDropdownOpen(false)
                              navigate('/short-courses')
                            }}
                            className="mt-2 w-full text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>👉 View Student Course Catalog</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              switchRole('admin')
                              setUserDropdownOpen(false)
                              navigate('/dashboard')
                            }}
                            className="mt-2 w-full text-[11px] font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 hover:underline flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>👉 Return to Admin Dashboard</span>
                          </button>
                        )}
                      </div>
                    )}

                    <Link
                      to="/"
                      onClick={() => setUserDropdownOpen(false)}
                      className="w-full text-left px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#14221b] flex items-center gap-2.5 transition-colors"
                    >
                      <Home className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                      Public Website
                    </Link>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false)
                        setProfileOpen(true)
                      }}
                      className="w-full text-left px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#14221b] flex items-center gap-2.5 transition-colors"
                    >
                      <User className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                      My Profile
                    </button>

                    <div className="border-t border-neutral-100 dark:border-[#1a2e23] mt-1 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-error dark:text-red-400 hover:bg-error-light dark:hover:bg-red-950/30 flex items-center gap-2.5 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>

      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </div>
  )
}
