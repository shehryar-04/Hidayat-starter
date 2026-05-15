import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { ChevronDown, Menu, X, User, LogOut } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRole } from './RoleProvider'
import { useFeatureFlags } from './FeatureFlagProvider'
import { useProfile } from './useProfile'
import Logo from './Logo'
import ProfileModal from './ProfileModal'
import { cn } from '../shared/ui'

const allNavItems = [
  { to: '/',                label: 'Home',            exact: true,  roles: ['admin','scholar','mufti','student'] },
  { to: '/student-admin',   label: 'Students',                      roles: ['admin'] },
  { to: '/scholar-admin',   label: 'Scholars',                      roles: ['admin'] },
  { to: '/dars-e-nizami',   label: 'Dars-e-Nizami',  flag: 'dars_e_nizami', roles: ['admin','scholar'] },
  { to: '/hifz',            label: 'Hifz',            flag: 'hifz',          roles: ['admin','scholar'] },
  { to: '/nazra',           label: 'Nazra',           flag: 'nazra',         roles: ['admin','scholar'] },
  { to: '/short-courses',   label: 'Courses',         flag: 'short_courses', roles: ['admin','scholar','student'] },
  { to: '/darul-ifta',      label: 'Darul Ifta',      flag: 'darul_ifta',    roles: ['admin','scholar','mufti','student'] },
  { to: '/research-center', label: 'Research',        flag: 'research_center', roles: ['admin','scholar','student'] },
  { to: '/wazifa',          label: 'Wazifa',          flag: 'wazifa',        roles: ['admin'] },
  { to: '/reports',         label: 'Reports',         flag: 'student_reports', roles: ['admin','scholar','student'] },
]

// How many nav links to show inline before collapsing the rest into "More ▾"
const MAX_INLINE = 6

function AvatarCircle({ avatarUrl, initials }) {
  const [err, setErr] = useState(false)
  if (avatarUrl && !err) {
    return (
      <img src={avatarUrl} alt="avatar"
        className="w-8 h-8 rounded-full object-cover ring-2 ring-white/30"
        onError={() => setErr(true)} />
    )
  }
  return (
    <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/30">
      {initials}
    </div>
  )
}

export default function Layout({ children }) {
  const { role, signOut } = useRole()
  const { flags, loading: flagsLoading } = useFeatureFlags()
  const { profile, avatarUrl } = useProfile()
  const navigate = useNavigate()
  const location = useLocation()

  const [profileOpen, setProfileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const userMenuRef = useRef()
  const moreMenuRef = useRef()

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) setMoreMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false) }, [location.pathname])

  const handleSignOut = async () => {
    setUserMenuOpen(false)
    await signOut()
    navigate('/')
  }

  const visibleItems = allNavItems.filter(item => {
    if (!item.roles.includes(role)) return false
    if (flagsLoading) return !item.flag   // while loading, only show non-flag items
    if (item.flag && !flags[item.flag]) return false
    return true
  })

  const inlineItems = visibleItems.slice(0, MAX_INLINE)
  const overflowItems = visibleItems.slice(MAX_INLINE)

  const displayName = profile?.full_name || profile?.first_name || '—'
  const initials = profile
    ? `${(profile.first_name || profile.full_name || '?').charAt(0)}${(profile.last_name || '').charAt(0)}`.toUpperCase()
    : '?'

  const linkClass = ({ isActive }) =>
    cn(
      'relative text-sm font-medium transition-colors duration-normal px-1 py-1 whitespace-nowrap group',
      isActive
        ? 'text-primary-500 font-semibold'
        : 'text-neutral-600 hover:text-neutral-800'
    )

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* ── Top navbar: frosted-glass, sticky, h-16, z-50 ── */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center gap-6">

          {/* Brand */}
          <NavLink to="/" className="flex items-center gap-2 flex-shrink-0 mr-2">
            <Logo size="sm" />
          </NavLink>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-5 flex-1">
            {inlineItems.map(item => (
              <NavLink key={item.to} to={item.to} end={item.exact} className={linkClass}>
                {({ isActive }) => (
                  <>
                    {item.label}
                    {/* Active indicator: 2px bottom border in primary */}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />
                    )}
                    {/* Hover underline animation: slides from left 0→100% */}
                    {!isActive && (
                      <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary-500 rounded-full transition-all duration-[250ms] ease-out group-hover:w-full" />
                    )}
                  </>
                )}
              </NavLink>
            ))}

            {/* "More" overflow dropdown */}
            {overflowItems.length > 0 && (
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setMoreMenuOpen(o => !o)}
                  className={cn(
                    'relative text-sm font-medium flex items-center gap-1 transition-colors duration-normal whitespace-nowrap py-1 group',
                    overflowItems.some(item => location.pathname.startsWith(item.to))
                      ? 'text-primary-500 font-semibold'
                      : 'text-neutral-600 hover:text-neutral-800'
                  )}
                >
                  More
                  <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-fast', moreMenuOpen && 'rotate-180')} />
                  {/* Hover underline for More button */}
                  {!overflowItems.some(item => location.pathname.startsWith(item.to)) && (
                    <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary-500 rounded-full transition-all duration-[250ms] ease-out group-hover:w-full" />
                  )}
                  {overflowItems.some(item => location.pathname.startsWith(item.to)) && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />
                  )}
                </button>
                {moreMenuOpen && (
                  <div className="absolute left-0 top-full mt-2 w-48 bg-white/90 backdrop-blur-xl rounded-xl shadow-lg border border-neutral-200 py-1.5 z-50">
                    {overflowItems.map(item => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.exact}
                        onClick={() => setMoreMenuOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'block px-4 py-2.5 text-sm font-medium transition-colors duration-fast rounded-md',
                            isActive
                              ? 'text-primary-500 bg-primary-50'
                              : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'
                          )
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Right side: user menu */}
          <div className="ml-auto flex items-center gap-3">
            {/* User dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors duration-[175ms] hover:bg-neutral-100"
              >
                <AvatarCircle avatarUrl={avatarUrl} initials={initials} />
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-neutral-800 leading-tight max-w-[120px] truncate">{displayName}</div>
                  <div className="text-[10px] text-neutral-400 capitalize">{role}</div>
                </div>
                <ChevronDown className={cn('w-3.5 h-3.5 text-neutral-400 transition-transform duration-fast', userMenuOpen && 'rotate-180')} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white/90 backdrop-blur-xl rounded-xl shadow-lg border border-neutral-200 py-1 z-50">
                  <div className="px-4 py-3 border-b border-neutral-100">
                    <div className="text-sm font-semibold text-neutral-800 truncate">{displayName}</div>
                    <div className="text-xs text-neutral-400 capitalize mt-0.5">{role}</div>
                  </div>
                  <button
                    onClick={() => { setUserMenuOpen(false); setProfileOpen(true) }}
                    className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2.5 transition-colors duration-fast rounded-md"
                  >
                    <User className="w-4 h-4 text-neutral-500" />
                    My Profile
                  </button>
                  <div className="border-t border-neutral-100 mt-1 pt-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2.5 text-sm text-error hover:bg-error-light flex items-center gap-2.5 transition-colors duration-fast rounded-md"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(o => !o)}
              className="md:hidden p-2 rounded-lg transition-colors duration-[175ms] hover:bg-neutral-100"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen
                ? <X className="w-5 h-5 text-neutral-600" />
                : <Menu className="w-5 h-5 text-neutral-600" />}
            </button>
          </div>
        </div>

        {/* Mobile nav drawer — slide-down animation */}
        <div
          className={cn(
            'md:hidden absolute top-16 left-0 right-0 border-b border-gray-200 bg-white/95 backdrop-blur-xl overflow-hidden transition-all duration-[250ms] ease-out',
            mobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="px-6 py-3 space-y-1 max-w-[1280px] mx-auto">
            {visibleItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  cn(
                    'block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-fast',
                    isActive
                      ? 'bg-primary-50 text-primary-500 border-l-2 border-primary-500'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      {/* ── Page content with proper padding and max-width ── */}
      <main className="flex-1 px-6 py-8 max-w-[1280px] mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Profile modal */}
      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </div>
  )
}
