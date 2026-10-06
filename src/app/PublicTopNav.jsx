import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, ChevronDown, User, LogOut } from 'lucide-react'
import { useRole } from './RoleProvider'
import { useProfile } from './useProfile'
import Logo from './Logo'
import ProfileModal from './ProfileModal'
import { Button, cn, ThemeLanguageToggle, AuthBypassBadge } from '../shared/ui'

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

/**
 * NavLink item with hover underline animation (slides in from left, 0→100% width, 250ms).
 * Active route shows primary color text + 2px bottom border.
 */
function NavItem({ to, onClick, children, isActive }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative font-medium text-sm cursor-pointer transition-colors duration-normal whitespace-nowrap py-1 group',
        isActive
          ? 'text-primary-600 dark:text-emerald-400 font-semibold'
          : 'text-neutral-700 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white'
      )}
    >
      {children}
      {/* Active indicator: 2px bottom border in primary */}
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 dark:bg-emerald-400 rounded-full" />
      )}
      {/* Hover underline animation: slides from left 0→100% */}
      {!isActive && (
        <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary-500 dark:bg-emerald-400 rounded-full transition-all duration-[250ms] ease-out group-hover:w-full" />
      )}
    </button>
  )
}

export default function PublicTopNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { role, signOut } = useRole()
  const { profile, avatarUrl } = useProfile()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const userMenuRef = useRef()
  const moreMenuRef = useRef()

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) setMoreMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const handleSignOut = async () => {
    setUserMenuOpen(false)
    await signOut()
    navigate('/')
  }

  // Primary links shown directly in navbar
  const authPrimaryLinks = role ? [
    { label: 'Dashboard',     href: '/dashboard',     protected: true },
  ] : []

  const basePrimaryLinks = [
    { label: 'Home',          href: '/',              protected: false },
    ...authPrimaryLinks,
    { label: 'Darse Nizami',  href: '/dars-e-nizami', protected: false },
    { label: 'Hifz & Nazrah', href: '/hifz',          protected: false },
    { label: 'Short Courses', href: '/short-courses', protected: true },
    { label: 'Darul Ifta',    href: '/darul-ifta',    protected: false },
  ]

  // Admin-only links
  const adminLinks = role === 'admin' ? [
    { label: 'Admin Hub',     href: '/admin-dashboard',           protected: true },
    { label: 'Students',      href: '/student-admin',             protected: true },
  ] : []

  const primaryLinks = [...basePrimaryLinks, ...adminLinks]

  // Secondary links grouped under "More" dropdown
  const baseMoreLinks = [
    { label: 'Research Center', href: '/research-center', protected: false },
    { label: 'Articles',        href: '/articles',        protected: false },
    { label: 'Downloads',       href: '/downloads',       protected: false },
  ]

  // Admin-only "More" links
  const adminMoreLinks = role === 'admin' ? [
    { label: 'Scholars',        href: '/scholar-admin',             protected: true },
    { label: 'Audit Log',       href: '/admin-dashboard/audit-log', protected: true },
    { label: 'Moderation',      href: '/fatwas/moderation',         protected: true },
    { label: 'Search Analytics', href: '/fatwas/analytics',         protected: true },
  ] : []

  const moreLinks = [...baseMoreLinks, ...adminMoreLinks]
  const navLinks = [...primaryLinks, ...moreLinks]

  const handleLinkClick = (link) => {
    if (link.protected && !role) {
      navigate('/login')
    } else {
      navigate(link.href)
    }
    setMobileOpen(false)
  }

  const isActive = (href) => {
    if (href === '/') return location.pathname === '/'
    return location.pathname.startsWith(href)
  }

  const displayName = profile?.full_name || profile?.first_name || '—'
  const initials = profile
    ? `${(profile.first_name || profile.full_name || '?').charAt(0)}${(profile.last_name || '').charAt(0)}`.toUpperCase()
    : '?'

  return (
    <>
      <nav className="sticky top-0 w-full z-50 border-b border-neutral-200/90 dark:border-[#1a2e23] bg-white/85 dark:bg-[#0c1410]/90 backdrop-blur-xl h-16 flex items-center transition-colors duration-200">
        <div className="flex justify-between items-center w-full px-4 sm:px-6 max-w-[1280px] mx-auto">
          {/* Logo */}
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); navigate('/') }}
            className="flex items-center shrink-0"
          >
            <Logo size="md" />
          </a>

          {/* Desktop nav — hidden below md (768px) */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8 flex-1 justify-center">
            {primaryLinks.map((link) => (
              <NavItem
                key={link.label}
                to={link.href}
                isActive={isActive(link.href)}
                onClick={() => handleLinkClick(link)}
              >
                {link.label}
              </NavItem>
            ))}

            {/* More dropdown */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setMoreMenuOpen((o) => !o)}
                className={cn(
                  'relative font-medium text-sm cursor-pointer transition-colors duration-normal whitespace-nowrap flex items-center gap-1 py-1 group',
                  moreLinks.some((l) => isActive(l.href))
                    ? 'text-primary-600 dark:text-emerald-400 font-semibold'
                    : 'text-neutral-700 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white'
                )}
              >
                More
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 transition-transform duration-fast',
                    moreMenuOpen && 'rotate-180'
                  )}
                />
                {!moreLinks.some((l) => isActive(l.href)) && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary-500 dark:bg-emerald-400 rounded-full transition-all duration-[250ms] ease-out group-hover:w-full" />
                )}
                {moreLinks.some((l) => isActive(l.href)) && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 dark:bg-emerald-400 rounded-full" />
                )}
              </button>

              {moreMenuOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-52 bg-white dark:bg-[#0f1a14] rounded-xl shadow-xl border border-neutral-200 dark:border-[#1a2e23] p-1.5 z-50">
                  {moreLinks.map((link) => (
                    <button
                      key={link.label}
                      onClick={() => { handleLinkClick(link); setMoreMenuOpen(false) }}
                      className={cn(
                        'block w-full text-left px-3.5 py-2 text-sm font-medium transition-colors rounded-lg',
                        isActive(link.href)
                          ? 'text-primary-600 dark:text-emerald-400 bg-primary-50 dark:bg-primary-950/60 font-semibold'
                          : 'text-neutral-700 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#14221b]'
                      )}
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right side: Language, Theme, Login / User menu + Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            <AuthBypassBadge />
            <ThemeLanguageToggle className="hidden xs:flex" />

            {!role ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/login')}
                className="font-medium"
              >
                Login
              </Button>
            ) : (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="hidden sm:inline-flex items-center gap-1.5 font-medium shadow-xs"
                >
                  <span>Dashboard</span>
                </Button>
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((o) => !o)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors duration-150 hover:bg-neutral-100 dark:hover:bg-[#14221b] cursor-pointer"
                  >
                    <AvatarCircle avatarUrl={avatarUrl} initials={initials} />
                    <div className="hidden sm:block text-left">
                      <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 leading-tight max-w-[120px] truncate">
                        {displayName}
                      </div>
                      <div className="text-[10px] text-neutral-400 dark:text-neutral-500 capitalize">{role}</div>
                    </div>
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 transition-transform duration-fast',
                        userMenuOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#0f1a14] rounded-xl shadow-xl border border-neutral-200 dark:border-[#1a2e23] p-1.5 z-50 text-sm">
                      <div className="px-3 py-2.5 border-b border-neutral-100 dark:border-[#1a2e23] mb-1">
                        <div className="font-semibold text-neutral-800 dark:text-neutral-100 truncate">{displayName}</div>
                        <div className="text-xs text-neutral-400 dark:text-neutral-500 capitalize mt-0.5">{role} Account</div>
                      </div>
                      <button
                        onClick={() => { setUserMenuOpen(false); navigate('/dashboard') }}
                        className="w-full text-left px-3 py-2 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#14221b] flex items-center gap-2.5 transition-colors rounded-lg"
                      >
                        <span className="w-4 h-4 flex items-center justify-center font-bold text-xs text-primary-600 dark:text-emerald-400">📊</span>
                        Dashboard
                      </button>
                      <button
                        onClick={() => { setUserMenuOpen(false); setProfileOpen(true) }}
                        className="w-full text-left px-3 py-2 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#14221b] flex items-center gap-2.5 transition-colors rounded-lg"
                      >
                        <User className="w-4 h-4 text-neutral-500" />
                        My Profile
                      </button>
                      <div className="border-t border-neutral-100 dark:border-[#1a2e23] mt-1 pt-1">
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-3 py-2 text-error dark:text-red-400 hover:bg-error-light dark:hover:bg-red-950/40 flex items-center gap-2.5 transition-colors rounded-lg"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Hamburger */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden p-2 rounded-xl transition-colors hover:bg-neutral-100 dark:hover:bg-[#14221b] text-neutral-700 dark:text-neutral-200"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <div
          className={cn(
            'md:hidden absolute top-16 left-0 right-0 border-b border-neutral-200 dark:border-[#1a2e23] bg-white/95 dark:bg-[#0c1410]/95 backdrop-blur-xl overflow-hidden transition-all duration-[250ms] ease-out shadow-xl',
            mobileOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="px-4 py-3 space-y-1 max-w-[1280px] mx-auto">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleLinkClick(link)}
                className={cn(
                  'block w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  isActive(link.href)
                    ? 'text-primary-600 dark:text-emerald-400 bg-primary-50 dark:bg-primary-950/50 font-semibold'
                    : 'text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#14221b]'
                )}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </>
  )
}
