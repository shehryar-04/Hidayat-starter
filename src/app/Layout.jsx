import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useRole } from './RoleProvider'
import { useFeatureFlags } from './FeatureFlagProvider'
import { useProfile } from './useProfile'
import Logo from './Logo'
import ProfileModal from './ProfileModal'

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
    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/30">
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
    `text-sm font-medium transition-colors px-1 py-0.5 border-b-2 ${
      isActive
        ? 'text-primary border-secondary'
        : 'text-gray-600 border-transparent hover:text-primary hover:border-primary-300'
    }`

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* ── Top navbar ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center gap-6">

          {/* Brand */}
          <NavLink to="/" className="flex items-center gap-2 flex-shrink-0 mr-2">
            <Logo size="sm" />
          </NavLink>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-5 flex-1">
            {inlineItems.map(item => (
              <NavLink key={item.to} to={item.to} end={item.exact} className={linkClass}>
                {item.label}
              </NavLink>
            ))}

            {/* "More" overflow dropdown */}
            {overflowItems.length > 0 && (
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setMoreMenuOpen(o => !o)}
                  className="text-sm font-medium text-gray-600 hover:text-primary flex items-center gap-1 transition-colors"
                >
                  More
                  <svg className={`w-3.5 h-3.5 transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {moreMenuOpen && (
                  <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    {overflowItems.map(item => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.exact}
                        onClick={() => setMoreMenuOpen(false)}
                        className={({ isActive }) =>
                          `block px-4 py-2.5 text-sm transition-colors ${isActive ? 'text-primary bg-neutral-50 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-primary'}`
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
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <AvatarCircle avatarUrl={avatarUrl} initials={initials} />
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-gray-800 leading-tight max-w-[120px] truncate">{displayName}</div>
                  <div className="text-[10px] text-gray-400 capitalize">{role}</div>
                </div>
                <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="text-sm font-semibold text-gray-800 truncate">{displayName}</div>
                    <div className="text-xs text-gray-400 capitalize mt-0.5">{role}</div>
                  </div>
                  <button
                    onClick={() => { setUserMenuOpen(false); setProfileOpen(true) }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-neutral-50 flex items-center gap-2.5 transition-colors"
                  >
                    <span className="text-base">👤</span> My Profile
                  </button>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2.5 text-sm text-tertiary hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                    >
                      <span className="text-base">🚪</span> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(o => !o)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-6 py-3 space-y-1">
            {visibleItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-neutral-100 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* ── Page content ── */}
      <main className="flex-1">
        {children}
      </main>

      {/* Profile modal */}
      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </div>
  )
}
