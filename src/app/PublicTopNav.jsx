import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, ChevronDown, User, LogOut } from 'lucide-react'
import { useRole } from './RoleProvider'
import { useProfile } from './useProfile'
import Logo from './Logo'
import ProfileModal from './ProfileModal'
import { Button, cn } from '../shared/ui'

function AvatarCircle({ avatarUrl, initials }) {
  const [err, setErr] = useState(false)
  if (avatarUrl && !err) {
    return (
      <img
        src={avatarUrl}
        alt="avatar"
        className="w-8 h-8 rounded-full object-cover ring-2 ring-white/30"
        onError={() => setErr(true)}
      />
    )
  }
  return (
    <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/30">
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
          ? 'text-primary-500 font-semibold'
          : 'text-neutral-600 hover:text-neutral-800'
      )}
    >
      {children}
      {/* Active indicator: 2px bottom border in primary */}
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />
      )}
      {/* Hover underline animation: slides from left 0→100% */}
      {!isActive && (
        <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary-500 rounded-full transition-all duration-[250ms] ease-out group-hover:w-full" />
      )}
    </button>
  )
}

/**
 * Single navbar for the entire app — same links for guest and logged-in users.
 * Protected pages redirect guests to /login. Public pages work for everyone.
 * Right side: Login button (guest) or profile dropdown (authenticated).
 *
 * Design: Frosted-glass effect, hover underline animations, active route indicator,
 * mobile hamburger at md breakpoint with slide-down drawer, max-width 1280px, 64px height, sticky.
 */
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
  const basePrimaryLinks = [
    { label: 'Home',          href: '/',              protected: false },
    { label: 'Darse Nizami',  href: '/dars-e-nizami', protected: false },
    { label: 'Hifz & Nazrah', href: '/hifz',          protected: false },
    { label: 'Short Courses', href: '/short-courses', protected: true },
    { label: 'Darul Ifta',    href: '/darul-ifta',    protected: false },
  ]

  // Admin-only links (shown in primary nav when admin is logged in)
  const adminLinks = role === 'admin' ? [
    { label: 'Dashboard',     href: '/admin-dashboard',           protected: true },
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

  // All links combined (for mobile drawer)
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
      {/* Frosted-glass navbar: backdrop-blur-xl, bg-white/80, 1px bottom border gray-200, sticky, h-16, z-50 */}
      <nav className="sticky top-0 w-full z-50 border-b border-gray-200 bg-white/80 backdrop-blur-xl h-16 flex items-center">
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
                    ? 'text-primary-500 font-semibold'
                    : 'text-neutral-600 hover:text-neutral-800'
                )}
              >
                More
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 transition-transform duration-fast',
                    moreMenuOpen && 'rotate-180'
                  )}
                />
                {/* Hover underline for More button */}
                {!moreLinks.some((l) => isActive(l.href)) && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary-500 rounded-full transition-all duration-[250ms] ease-out group-hover:w-full" />
                )}
                {moreLinks.some((l) => isActive(l.href)) && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />
                )}
              </button>

              {moreMenuOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 bg-white/90 backdrop-blur-xl rounded-xl shadow-lg border border-neutral-200 py-1.5 z-50">
                  {moreLinks.map((link) => (
                    <button
                      key={link.label}
                      onClick={() => { handleLinkClick(link); setMoreMenuOpen(false) }}
                      className={cn(
                        'block w-full text-left px-4 py-2.5 text-sm font-medium transition-colors rounded-md mx-auto',
                        isActive(link.href)
                          ? 'text-primary-500 bg-primary-50'
                          : 'text-neutral-600 hover:text-neutral-800 hover:bg-neutral-50'
                      )}
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right side: Login / User menu + Hamburger */}
          <div className="flex items-center gap-3">
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
              <div className="relative" ref={userMenuRef}>
                {/* Avatar trigger with hover background transition 150–200ms */}
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors duration-[175ms] hover:bg-neutral-100"
                >
                  <AvatarCircle avatarUrl={avatarUrl} initials={initials} />
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-semibold text-neutral-800 leading-tight max-w-[120px] truncate">
                      {displayName}
                    </div>
                    <div className="text-[10px] text-neutral-400 capitalize">{role}</div>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 text-neutral-400 transition-transform duration-fast',
                      userMenuOpen && 'rotate-180'
                    )}
                  />
                </button>

                {/* User dropdown */}
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
            )}

            {/* Hamburger — visible below md (768px) */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden p-2 rounded-lg transition-colors duration-[175ms] hover:bg-neutral-100"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? (
                <X className="w-5 h-5 text-neutral-600" />
              ) : (
                <Menu className="w-5 h-5 text-neutral-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile drawer — slide-down animation 200–300ms */}
        <div
          className={cn(
            'md:hidden absolute top-16 left-0 right-0 border-b border-gray-200 bg-white/95 backdrop-blur-xl overflow-hidden transition-all duration-[250ms] ease-out',
            mobileOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="px-4 py-3 space-y-1 max-w-[1280px] mx-auto">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleLinkClick(link)}
                className={cn(
                  'block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-fast',
                  isActive(link.href)
                    ? 'bg-primary-50 text-primary-500 border-l-2 border-primary-500'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'
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
