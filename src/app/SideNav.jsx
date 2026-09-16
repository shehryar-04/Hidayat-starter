import { useState, useMemo } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  BookMarked,
  Languages,
  Scale,
  Search,
  FlaskConical,
  FileText,
  Download,
  Wallet,
  BarChart3,
  HelpCircle,
  Users,
  UserCheck,
  History,
  ShieldCheck,
  TrendingUp,
  Info,
  Briefcase,
  Calendar,
  Phone,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  X,
  ExternalLink,
} from 'lucide-react'
import { useRole } from './RoleProvider'
import { useFeatureFlags } from './FeatureFlagProvider'
import { useProfile } from './useProfile'
import Logo from './Logo'
import ProfileModal from './ProfileModal'
import { cn } from '../shared/ui'

function AvatarCircle({ avatarUrl, initials }) {
  const [err, setErr] = useState(false)
  if (avatarUrl && !err) {
    return (
      <img
        src={avatarUrl}
        alt="avatar"
        className="w-9 h-9 rounded-xl object-cover ring-2 ring-primary-500/20 shadow-sm"
        onError={() => setErr(true)}
      />
    )
  }
  return (
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white text-xs font-bold ring-2 ring-primary-500/20 shadow-sm">
      {initials}
    </div>
  )
}

export default function SideNav({ collapsed = false, onToggleCollapse, isMobile = false, onCloseMobile }) {
  const { role, signOut } = useRole()
  const { flags, loading: flagsLoading } = useFeatureFlags()
  const { profile, avatarUrl } = useProfile()
  const navigate = useNavigate()
  const location = useLocation()
  const [profileOpen, setProfileOpen] = useState(false)

  const displayName = profile?.full_name || profile?.first_name || 'User'
  const initials = profile
    ? `${(profile.first_name || profile.full_name || '?').charAt(0)}${(profile.last_name || '').charAt(0)}`.toUpperCase()
    : '?'

  const handleSignOut = async () => {
    if (onCloseMobile) onCloseMobile()
    await signOut()
    navigate('/')
  }

  // Navigation sections definition
  const navSections = useMemo(() => [
    {
      title: 'Main',
      items: [
        { to: '/', label: 'Public Website', icon: Home, exact: true, badge: 'Web', isPublic: true },
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      ],
    },
    {
      title: 'Academic Programs',
      items: [
        { to: '/short-courses', label: 'Short Courses', icon: GraduationCap, flag: 'short_courses', roles: ['admin', 'scholar', 'student'] },
        { to: '/dars-e-nizami', label: 'Dars-e-Nizami', icon: BookOpen, flag: 'dars_e_nizami', roles: ['admin', 'scholar'] },
        { to: '/hifz', label: 'Hifz Program', icon: BookMarked, flag: 'hifz', roles: ['admin', 'scholar'] },
        { to: '/nazra', label: 'Nazra Program', icon: Languages, flag: 'nazra', roles: ['admin', 'scholar'] },
      ],
    },
    {
      title: 'Services & Knowledge',
      items: [
        { to: '/darul-ifta', label: 'Darul Ifta', icon: Scale, flag: 'darul_ifta', roles: ['admin', 'scholar', 'mufti', 'student'] },
        { to: '/fatwas', label: 'Fatwa Platform', icon: Search, roles: ['admin', 'scholar', 'mufti', 'student'] },
        { to: '/research-center', label: 'Research Center', icon: FlaskConical, flag: 'research_center', roles: ['admin', 'scholar', 'student'] },
        { to: '/articles', label: 'Articles', icon: FileText, roles: ['admin', 'scholar', 'mufti', 'student'] },
        { to: '/downloads', label: 'Downloads', icon: Download, roles: ['admin', 'scholar', 'mufti', 'student'] },
        { to: '/wazifa', label: 'Wazifa', icon: Wallet, flag: 'wazifa', roles: ['admin'] },
        { to: '/reports', label: 'Reports', icon: BarChart3, flag: 'student_reports', roles: ['admin', 'scholar', 'student'] },
        { to: '/knowledge-test', label: 'Knowledge Test', icon: HelpCircle, roles: ['admin', 'scholar', 'student', 'mufti'] },
      ],
    },
    {
      title: 'Administration',
      adminOnly: true,
      items: [
        { to: '/admin-dashboard', label: 'Operations Dashboard', icon: LayoutDashboard, roles: ['admin'], exact: true },
        { to: '/student-admin', label: 'Student Admin', icon: Users, roles: ['admin'] },
        { to: '/scholar-admin', label: 'Scholar Admin', icon: UserCheck, roles: ['admin'] },
        { to: '/admin-dashboard/audit-log', label: 'Audit Log', icon: History, roles: ['admin'] },
        { to: '/fatwas/moderation', label: 'Fatwa Moderation', icon: ShieldCheck, roles: ['admin'] },
        { to: '/fatwas/analytics', label: 'Search Analytics', icon: TrendingUp, roles: ['admin'] },
      ],
    },
    {
      title: 'Institutional',
      items: [
        { to: '/about', label: 'About Us', icon: Info, isPublic: true },
        { to: '/services', label: 'Services', icon: Briefcase, isPublic: true },
        { to: '/events', label: 'Events', icon: Calendar, isPublic: true },
        { to: '/contact', label: 'Contact', icon: Phone, isPublic: true },
      ],
    },
  ], [])

  const filteredSections = navSections
    .filter((section) => {
      if (section.adminOnly && role !== 'admin') return false
      return true
    })
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.roles && !item.roles.includes(role)) return false
        if (item.flag && !flagsLoading && !flags[item.flag]) return false
        return true
      }),
    }))
    .filter((section) => section.items.length > 0)

  const isLinkActive = (to, exact) => {
    if (exact || to === '/') {
      return location.pathname === to
    }
    return location.pathname.startsWith(to)
  }

  const handleLinkClick = () => {
    if (isMobile && onCloseMobile) {
      onCloseMobile()
    }
  }

  return (
    <>
      <aside
        className={cn(
          'flex flex-col h-full bg-white dark:bg-[#0c1410] border-r border-neutral-200/80 dark:border-[#1a2e23] transition-all duration-300 ease-in-out select-none shadow-sm z-30',
          collapsed && !isMobile ? 'w-[72px]' : 'w-[270px]'
        )}
      >
        {/* Header / Brand */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-neutral-100 dark:border-[#1a2e23] flex-shrink-0 bg-white dark:bg-[#0c1410] transition-colors">
          <div
            onClick={() => {
              navigate('/dashboard')
              handleLinkClick()
            }}
            className="flex items-center gap-3 cursor-pointer group overflow-hidden"
          >
            <div className="flex-shrink-0">
              <Logo size="sm" />
            </div>
            {(!collapsed || isMobile) && (
              <div className="flex flex-col overflow-hidden">
                <span className="font-display font-bold text-base text-neutral-900 dark:text-neutral-100 leading-tight tracking-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  Hidayat
                </span>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium tracking-wider uppercase">
                  Portal & LMS
                </span>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle or mobile close button */}
          {isMobile ? (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#14221b] transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#14221b] transition-colors"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Quick public site indicator if inside portal */}
        {(!collapsed || isMobile) && (
          <div className="px-3 pt-3 pb-1">
            <NavLink
              to="/"
              onClick={handleLinkClick}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#111c16] hover:bg-primary-50/70 dark:hover:bg-[#182b20] border border-neutral-200/70 dark:border-[#1a2e23] text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary-700 dark:hover:text-primary-400 transition-colors group"
            >
              <span className="flex items-center gap-2">
                <Home className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 group-hover:text-primary-500 dark:group-hover:text-primary-400" />
                <span>Public Website</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600 group-hover:text-primary-500 dark:group-hover:text-primary-400" />
            </NavLink>
          </div>
        )}

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 custom-scrollbar">
          {filteredSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {(!collapsed || isMobile) && (
                <div className="px-3 py-1 text-[11px] font-semibold tracking-wider text-neutral-400 dark:text-emerald-500/70 uppercase">
                  {section.title}
                </div>
              )}
              {collapsed && !isMobile && (
                <div className="w-full h-px bg-neutral-100 dark:bg-[#1a2e23] my-2" />
              )}

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const active = isLinkActive(item.to, item.exact)

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={handleLinkClick}
                      className={cn(
                        'group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150',
                        active
                          ? 'bg-primary-500 dark:bg-primary-600 text-white shadow-sm shadow-primary-500/20 font-semibold'
                          : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/80 dark:hover:bg-[#14221b]',
                        collapsed && !isMobile && 'justify-center px-0'
                      )}
                      title={collapsed && !isMobile ? item.label : undefined}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4 flex-shrink-0 transition-transform duration-150',
                          active
                            ? 'text-white'
                            : 'text-neutral-400 dark:text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-white group-hover:scale-105'
                        )}
                      />

                      {(!collapsed || isMobile) && (
                        <span className="truncate flex-1">{item.label}</span>
                      )}

                      {(!collapsed || isMobile) && item.badge && (
                        <span
                          className={cn(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider',
                            active
                              ? 'bg-white/20 text-white'
                              : 'bg-neutral-200/70 dark:bg-[#1a2e23] text-neutral-600 dark:text-neutral-300'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer User Profile & Actions */}
        <div className="p-3 border-t border-neutral-200/80 dark:border-[#1a2e23] bg-neutral-50/50 dark:bg-[#0c1410] flex-shrink-0">
          <div
            className={cn(
              'flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-[#111c16] border border-neutral-200/80 dark:border-[#1a2e23] shadow-xs transition-colors',
              collapsed && !isMobile ? 'justify-center p-1.5' : ''
            )}
          >
            <button
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer group"
              title="Edit Profile"
            >
              <AvatarCircle avatarUrl={avatarUrl} initials={initials} />

              {(!collapsed || isMobile) && (
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {displayName}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 capitalize truncate">
                      {role || 'Guest'}
                    </span>
                  </div>
                </div>
              )}
            </button>

            {(!collapsed || isMobile) && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setProfileOpen(true)}
                  className="p-1.5 rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#182b20] transition-colors"
                  title="My Profile"
                >
                  <User className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Profile Modal */}
      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </>
  )
}
