import { useRole } from './RoleProvider'
import { useFeatureFlags } from './FeatureFlagProvider'
import { useProfile } from './useProfile'
import { useNavigate } from 'react-router-dom'

const moduleCards = [
  { to: '/student-admin',   label: 'Student Administration', icon: '👨‍🎓', desc: 'Manage student profiles, enrollment, status changes, and documents.', roles: ['admin'],                          flag: null },
  { to: '/scholar-admin',   label: 'Scholar Management',     icon: '👨‍🏫', desc: 'Manage faculty profiles, subject assignments, and deactivation.',   roles: ['admin'],                          flag: null },
  { to: '/dars-e-nizami',   label: 'Dars-e-Nizami',          icon: '📚', desc: 'Multi-year curriculum with levels, evaluations, and transcripts.',   roles: ['admin','scholar'],                flag: 'dars_e_nizami' },
  { to: '/hifz',            label: 'Hifz Program',           icon: '📖', desc: 'Track Quran memorization across all 30 Juz with audit logging.',     roles: ['admin','scholar'],                flag: 'hifz' },
  { to: '/nazra',           label: 'Nazra Program',          icon: '🔤', desc: 'Lesson-by-lesson Quran recitation tracking with quality notes.',     roles: ['admin','scholar'],                flag: 'nazra' },
  { to: '/short-courses',   label: 'Short Courses',          icon: '🎓', desc: 'Certified courses with enrollment, payment, and certificates.',      roles: ['admin','scholar','student'],      flag: 'short_courses' },
  { to: '/darul-ifta',      label: 'Darul Ifta',             icon: '⚖️', desc: 'Submit questions and manage the full fatwa workflow.',               roles: ['admin','scholar','mufti','student'], flag: 'darul_ifta' },
  { to: '/research-center', label: 'Research Center',        icon: '🔬', desc: 'Academic publications, approvals, and searchable repository.',       roles: ['admin','scholar','student'],      flag: 'research_center' },
  { to: '/wazifa',          label: 'Wazifa',                 icon: '💰', desc: 'Stipend eligibility evaluation and disbursement reports.',           roles: ['admin'],                          flag: 'wazifa' },
  { to: '/reports',         label: 'Reports',                icon: '📊', desc: 'Schema-driven institutional reports with PDF and CSV export.',       roles: ['admin','scholar','student'],      flag: 'student_reports' },
]

export default function Dashboard() {
  const { role } = useRole()
  const { flags } = useFeatureFlags()
  const { profile } = useProfile()
  const navigate = useNavigate()

  const visibleCards = moduleCards.filter(card => {
    if (!card.roles.includes(role)) return false
    if (card.flag && !flags[card.flag]) return false
    return true
  })

  const firstName = profile?.first_name || profile?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-10">

      {/* Welcome banner */}
      <div className="mb-10 pb-8 border-b border-gray-200">
        <p className="text-secondary font-sans text-xs font-bold tracking-widest uppercase mb-2">Welcome back</p>
        <h1 className="font-serif text-3xl md:text-4xl text-primary font-bold mb-2">
          As-salamu alaykum, {firstName}
        </h1>
        <p className="text-gray-500 text-base">
          Here's everything available to you. Select a module to get started.
        </p>
      </div>

      {/* Module grid */}
      {visibleCards.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">🔒</div>
          <p className="text-sm">No modules are currently available for your role.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleCards.map(card => (
            <button
              key={card.to}
              onClick={() => navigate(card.to)}
              className="group text-left bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md hover:-translate-y-0.5 hover:border-primary-200 transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center text-2xl flex-shrink-0 group-hover:bg-primary group-hover:scale-105 transition-all duration-200">
                  <span className="group-hover:grayscale-0">{card.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 group-hover:text-primary transition-colors mb-1 text-sm">
                    {card.label}
                  </div>
                  <div className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                    {card.desc}
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
