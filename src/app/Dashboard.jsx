import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  GraduationCap,
  BookOpen,
  BookMarked,
  Languages,
  Award,
  Scale,
  FlaskConical,
  Wallet,
  BarChart3,
  ChevronRight,
  AlertCircle,
} from 'lucide-react'
import { useRole } from './RoleProvider'
import { useFeatureFlags } from './FeatureFlagProvider'
import { useProfile } from './useProfile'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, Skeleton, EmptyState, Button, cn } from '../shared/ui'
import { OnboardingTour } from '../shared/OnboardingTour'

const moduleCards = [
  { to: '/student-admin',   label: 'Student Administration', icon: Users,         desc: 'Manage student profiles, enrollment, status changes, and documents.', roles: ['admin'],                              flag: null },
  { to: '/scholar-admin',   label: 'Scholar Management',     icon: GraduationCap, desc: 'Manage faculty profiles, subject assignments, and deactivation.',   roles: ['admin'],                              flag: null },
  { to: '/dars-e-nizami',   label: 'Dars-e-Nizami',          icon: BookOpen,      desc: 'Multi-year curriculum with levels, evaluations, and transcripts.',   roles: ['admin','scholar'],                    flag: 'dars_e_nizami' },
  { to: '/hifz',            label: 'Hifz Program',           icon: BookMarked,    desc: 'Track Quran memorization across all 30 Juz with audit logging.',     roles: ['admin','scholar'],                    flag: 'hifz' },
  { to: '/nazra',           label: 'Nazra Program',          icon: Languages,     desc: 'Lesson-by-lesson Quran recitation tracking with quality notes.',     roles: ['admin','scholar'],                    flag: 'nazra' },
  { to: '/short-courses',   label: 'Short Courses',          icon: Award,         desc: 'Certified courses with enrollment, payment, and certificates.',      roles: ['admin','scholar','student'],          flag: 'short_courses' },
  { to: '/darul-ifta',      label: 'Darul Ifta',             icon: Scale,         desc: 'Submit questions and manage the full fatwa workflow.',               roles: ['admin','scholar','mufti','student'],  flag: 'darul_ifta' },
  { to: '/research-center', label: 'Research Center',        icon: FlaskConical,  desc: 'Academic publications, approvals, and searchable repository.',       roles: ['admin','scholar','student'],          flag: 'research_center' },
  { to: '/wazifa',          label: 'Wazifa',                 icon: Wallet,        desc: 'Stipend eligibility evaluation and disbursement reports.',           roles: ['admin'],                              flag: 'wazifa' },
  { to: '/reports',         label: 'Reports',                icon: BarChart3,     desc: 'Schema-driven institutional reports with PDF and CSV export.',       roles: ['admin','scholar','student'],          flag: 'student_reports' },
]

/**
 * Returns a time-based greeting string.
 * Morning: 05:00–11:59, Afternoon: 12:00–16:59, Evening: 17:00–04:59
 */
function getGreeting() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour <= 11) return 'Good morning'
  if (hour >= 12 && hour <= 16) return 'Good afternoon'
  return 'Good evening'
}

/**
 * Returns the current date formatted as a locale-appropriate string.
 */
function getFormattedDate() {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** Stagger animation variants for the card container */
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05, // 50ms per card
    },
  },
}

/** Animation variants for individual cards */
const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0, 0, 0.2, 1] },
  },
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { role, userId } = useRole()
  const { flags, loading: flagsLoading } = useFeatureFlags()
  const { profile } = useProfile()
  const navigate = useNavigate()

  const [timedOut, setTimedOut] = useState(false)
  const [retrying, setRetrying] = useState(false)

  // 10s timeout for feature flags loading
  useEffect(() => {
    if (!flagsLoading) {
      setTimedOut(false)
      setRetrying(false)
      return
    }

    const timer = setTimeout(() => {
      if (flagsLoading) setTimedOut(true)
    }, 10000)

    return () => clearTimeout(timer)
  }, [flagsLoading, retrying])

  // Skeleton loading state (6 shimmer cards)
  if (flagsLoading && !timedOut) {
    return (
      <div className="max-w-screen-xl mx-auto px-6 py-10">
        {/* Skeleton welcome section */}
        <div className="mb-10 pb-8 border-b border-neutral-200">
          <Skeleton className="h-3 w-24 mb-3" />
          <Skeleton className="h-8 w-72 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        {/* Skeleton grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" aria-live="polite" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  // Error state after 10s timeout
  if (timedOut) {
    return (
      <div className="max-w-screen-xl mx-auto px-6 py-10">
        <div className="flex flex-col items-center justify-center py-24">
          <EmptyState
            icon={AlertCircle}
            title="Unable to load modules"
            description="Feature flags could not be loaded. Please check your connection and try again."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setTimedOut(false)
                  setRetrying(true)
                  window.location.reload()
                }}
              >
                Retry
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  const visibleCards = moduleCards.filter(card => {
    if (!card.roles.includes(role)) return false
    if (card.flag && !flags[card.flag]) return false
    return true
  })

  const firstName = profile?.first_name || profile?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-10">

      {/* Welcome section */}
      <div className="mb-10 pb-8 border-b border-neutral-200">
        <p className="text-neutral-500 text-sm mb-1">{getFormattedDate()}</p>
        <h1 className="font-display text-3xl md:text-4xl text-neutral-900 font-bold mb-1">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-neutral-500 text-base">
          Here's everything available to you. Select a module to get started.
        </p>
      </div>

      {/* Module grid */}
      {visibleCards.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No modules available"
          description="No modules are currently available for your role."
        />
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {visibleCards.map(card => {
            const Icon = card.icon
            return (
              <motion.button
                key={card.to}
                variants={cardVariants}
                onClick={() => navigate(card.to)}
                className={cn(
                  'group text-left bg-white rounded-xl border border-neutral-200 p-6',
                  'shadow-sm transition-all duration-200 ease-[cubic-bezier(0,0,0.2,1)]',
                  'hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors duration-200">
                    <Icon className="w-6 h-6 text-primary-600" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-neutral-800 group-hover:text-primary-600 transition-colors duration-200 mb-1 text-sm">
                      {card.label}
                    </div>
                    <div className="text-xs text-neutral-500 leading-relaxed line-clamp-2">
                      {card.desc}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0 mt-0.5" />
                </div>
              </motion.button>
            )
          })}
        </motion.div>
      )}

      {/* Onboarding tour — shown once per user */}
      <OnboardingTour role={role} userId={userId} />
    </div>
  )
}
