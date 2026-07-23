import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Sparkles, BookOpen, GraduationCap, Scale, FileText, Users, Award } from 'lucide-react'

const STORAGE_KEY = 'hidayat_onboarding_completed'

/**
 * Role-aware onboarding tour steps.
 * Shown once per user (persisted in localStorage).
 */
const TOUR_STEPS = {
  student: [
    {
      icon: Sparkles,
      title: 'Welcome to Hidayat!',
      description: 'Your digital learning companion for Islamic education, professional development, and spiritual growth.',
      color: 'from-primary-500 to-primary-700',
    },
    {
      icon: GraduationCap,
      title: 'Short Courses',
      description: 'Browse and enroll in professional courses. Watch video lectures, take quizzes, and earn certificates upon completion.',
      path: '/short-courses',
      color: 'from-blue-500 to-blue-700',
    },
    {
      icon: Scale,
      title: 'Darul Ifta',
      description: 'Submit questions to qualified Muftis and browse 60,000+ authenticated Islamic rulings from trusted institutions.',
      path: '/darul-ifta',
      color: 'from-emerald-500 to-emerald-700',
    },
    {
      icon: FileText,
      title: 'Research Center',
      description: 'Access a searchable repository of academic publications and scholarly papers on Islamic sciences.',
      path: '/research-center',
      color: 'from-purple-500 to-purple-700',
    },
    {
      icon: Award,
      title: 'Your Dashboard',
      description: 'Track your learning progress, view certificates, and continue where you left off — all from one place.',
      path: '/short-courses',
      color: 'from-amber-500 to-amber-700',
    },
  ],
  scholar: [
    {
      icon: Sparkles,
      title: 'Welcome, Scholar!',
      description: 'You have access to teaching tools, student management, and academic research features.',
      color: 'from-primary-500 to-primary-700',
    },
    {
      icon: GraduationCap,
      title: 'Create Courses',
      description: 'Design video courses with sections, lectures, quizzes, and announcements. Track enrolled students and revenue.',
      path: '/short-courses',
      color: 'from-blue-500 to-blue-700',
    },
    {
      icon: Users,
      title: 'Student Progress',
      description: 'Record evaluations for Dars-e-Nizami, track Hifz memorization progress, and manage Nazra recitation lessons.',
      path: '/dars-e-nizami',
      color: 'from-emerald-500 to-emerald-700',
    },
    {
      icon: FileText,
      title: 'Publish Research',
      description: 'Submit academic publications to the Research Center for peer review and public access.',
      path: '/research-center',
      color: 'from-purple-500 to-purple-700',
    },
    {
      icon: Scale,
      title: 'Darul Ifta',
      description: 'As a Mufti, respond to questions, review fatwa submissions, and publish authenticated rulings.',
      path: '/darul-ifta',
      color: 'from-amber-500 to-amber-700',
    },
  ],
  admin: [
    {
      icon: Sparkles,
      title: 'Welcome, Admin!',
      description: 'You have full platform control — manage students, scholars, courses, fatwas, and system configuration.',
      color: 'from-primary-500 to-primary-700',
    },
    {
      icon: Users,
      title: 'Student & Scholar Admin',
      description: 'Manage enrollments, bulk-update student statuses, assign scholars to programs, and monitor activity.',
      path: '/student-admin',
      color: 'from-blue-500 to-blue-700',
    },
    {
      icon: GraduationCap,
      title: 'Course Management',
      description: 'Approve pending courses, manage enrollments, verify payments, and view revenue analytics.',
      path: '/short-courses',
      color: 'from-emerald-500 to-emerald-700',
    },
    {
      icon: Scale,
      title: 'Moderation & Fatwas',
      description: 'Review submitted questions, moderate content, assign to Muftis, and publish approved fatwas.',
      path: '/fatwas/moderation',
      color: 'from-purple-500 to-purple-700',
    },
    {
      icon: BookOpen,
      title: 'Bulk Import & Analytics',
      description: 'Import fatwa content in bulk, monitor search analytics, and manage feature flags.',
      path: '/fatwas/import',
      color: 'from-amber-500 to-amber-700',
    },
  ],
  mufti: [
    {
      icon: Sparkles,
      title: 'Welcome, Mufti!',
      description: 'You have authority to respond to questions, review, and publish authenticated Islamic rulings.',
      color: 'from-primary-500 to-primary-700',
    },
    {
      icon: Scale,
      title: 'Fatwa Workflow',
      description: 'Questions are assigned to you by admins. Craft detailed responses with references, then submit for review and publication.',
      path: '/darul-ifta',
      color: 'from-emerald-500 to-emerald-700',
    },
    {
      icon: FileText,
      title: 'Moderate & Review',
      description: 'Review incoming questions for appropriateness, flag spam, and approve content for the Mufti queue.',
      path: '/fatwas/moderation',
      color: 'from-purple-500 to-purple-700',
    },
    {
      icon: GraduationCap,
      title: 'Teaching & Research',
      description: 'Create courses, submit publications, and contribute to the Islamic knowledge repository.',
      path: '/research-center',
      color: 'from-amber-500 to-amber-700',
    },
  ],
}

/**
 * OnboardingTour — Full-screen modal tour shown once per user.
 * @param {{ role: string, userId: string }} props
 */
export function OnboardingTour({ role, userId }) {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  const storageKey = `${STORAGE_KEY}_${userId}`
  const steps = TOUR_STEPS[role] || TOUR_STEPS.student

  useEffect(() => {
    // Show tour only if user hasn't completed it
    const completed = localStorage.getItem(storageKey)
    if (!completed && userId) {
      // Small delay so it doesn't flash before content loads
      const timer = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(timer)
    }
  }, [userId, storageKey])

  const handleNext = useCallback(() => {
    if (step < steps.length - 1) {
      setStep(s => s + 1)
    } else {
      handleComplete()
    }
  }, [step, steps.length])

  const handlePrev = useCallback(() => {
    if (step > 0) setStep(s => s - 1)
  }, [step])

  const handleComplete = useCallback(() => {
    localStorage.setItem(storageKey, 'true')
    setVisible(false)
  }, [storageKey])

  const handleSkip = useCallback(() => {
    localStorage.setItem(storageKey, 'true')
    setVisible(false)
  }, [storageKey])

  if (!visible) return null

  const current = steps[step]
  const Icon = current.icon
  const isLast = step === steps.length - 1

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        onClick={(e) => e.target === e.currentTarget && handleSkip()}
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header gradient */}
          <div className={`bg-gradient-to-br ${current.color} p-8 text-center`}>
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mx-auto flex items-center justify-center mb-4">
              <Icon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{current.title}</h2>
          </div>

          {/* Body */}
          <div className="p-6">
            <p className="text-sm text-gray-600 leading-relaxed text-center">
              {current.description}
            </p>

            {/* Step dots */}
            <div className="flex items-center justify-center gap-1.5 mt-6">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step ? 'w-6 bg-primary-500' : 'w-1.5 bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={handleSkip}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Skip tour
              </button>

              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button
                    onClick={handlePrev}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-100"
                  >
                    <ChevronLeft size={14} /> Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 px-5 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary-600 transition-colors shadow-sm"
                >
                  {isLast ? 'Get Started' : 'Next'}
                  {!isLast && <ChevronRight size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-3 right-3 p-1.5 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10"
            aria-label="Close tour"
          >
            <X size={18} />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Hook to check if onboarding is completed.
 * Useful for showing contextual hints after the tour.
 */
export function useOnboardingComplete(userId) {
  const [completed, setCompleted] = useState(true)

  useEffect(() => {
    if (userId) {
      const done = localStorage.getItem(`${STORAGE_KEY}_${userId}`)
      setCompleted(!!done)
    }
  }, [userId])

  const resetTour = useCallback(() => {
    if (userId) {
      localStorage.removeItem(`${STORAGE_KEY}_${userId}`)
      setCompleted(false)
    }
  }, [userId])

  return { completed, resetTour }
}
