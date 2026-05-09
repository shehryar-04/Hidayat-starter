import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useRole } from './RoleProvider'
import { useProfile } from './useProfile'
import Logo from './Logo'
import ProfileModal from './ProfileModal'

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

/**
 * Single navbar for the entire app — same links for guest and logged-in users.
 * Protected pages redirect guests to /login. Public pages work for everyone.
 * Right side: Login button (guest) or profile dropdown (authenticated).
 */
export default function PublicTopNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { role, signOut } = useRole()
  const { profile, avatarUrl } = useProfile()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const userMenuRef = useRef()

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
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

  // Same links for everyone — protected ones redirect guests to /login
  const navLinks = [
    { label: 'Home',           href: '/',                protected: false },
    { label: 'Darse Nizami',   href: '/dars-e-nizami',   protected: false },
    { label: 'Hifz & Nazrah',  href: '/hifz',            protected: false },
    { label: 'Short Courses',  href: '/short-courses',   protected: true },
    { label: 'Darul Ifta',     href: '/darul-ifta',      protected: false },
    { label: 'Research Center', href: '/research-center', protected: false },
    { label: 'Articles',       href: '/articles',        protected: false },
  ]

  const handleLinkClick = (e, link) => {
    e.preventDefault()
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
      <nav className="fixed top-0 w-full z-50 border-b border-outline bg-background/95 backdrop-blur-md">
        <div className="flex justify-between items-center w-full px-4 sm:px-8 py-3 sm:py-4 max-w-7xl mx-auto">
          <a href="/" onClick={(e) => { e.preventDefault(); navigate('/') }} className="flex items-center">
            <Logo size="lg" />
          </a>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center space-x-5 xl:space-x-7 flex-1 justify-center">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link)}
                className={`font-serif font-medium text-sm cursor-pointer transition-colors whitespace-nowrap ${
                  isActive(link.href) ? 'text-primary border-b-2 border-primary pb-1 font-bold' : 'text-slate-600 hover:text-primary'
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {!role ? (
              <button
                onClick={() => navigate('/login')}
                className="bg-primary text-white px-4 sm:px-6 py-2 rounded-lg font-serif font-medium text-sm hover:opacity-90 transition-all active:scale-95"
              >
                Login
              </button>
            ) : (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-high transition-colors"
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
            )}

            {/* Hamburger */}
            <button onClick={() => setMobileOpen(o => !o)} className="lg:hidden p-2 rounded-lg hover:bg-surface-high transition-colors" aria-label="Menu">
              <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-outline bg-background px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-serif font-medium transition-colors ${
                  isActive(link.href) ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-surface-high hover:text-primary'
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </nav>

      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </>
  )
}
