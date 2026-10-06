import { useState } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, Clock, PlusCircle, BarChart3, LayoutDashboard, Compass } from 'lucide-react'
import { useRole } from '../../app/RoleProvider'
import { supabase } from '../../lib/supabase'
import { CourseList } from './CourseList'
import { CourseForm } from './CourseForm'
import { EnrollmentView } from './EnrollmentView'
import { RevenueView } from './RevenueView'
import { AdminCourseReview } from './AdminCourseReview'
import { StudentCourseList } from './StudentCourseList'
import { StudentCourseView } from './StudentCourseView'
import { StudentDashboard } from './StudentDashboard'
import { AdminCourseManager } from './components/AdminCourseManager'
import { cn } from '../../shared/ui'

// ─── Student view ─────────────────────────────────────────────
function StudentShortCourses() {
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [tab, setTab] = useState('dashboard')

  if (selectedCourse) {
    return <StudentCourseView course={selectedCourse} onBack={() => setSelectedCourse(null)} />
  }

  const tabs = [
    { key: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { key: 'browse', label: 'Browse Courses', icon: Compass },
  ]

  return (
    <div className="space-y-6">
      {/* Header with modern tab navigation */}
      <div className="bg-white dark:bg-[#0f1a14] border border-neutral-200/80 dark:border-[#1a2e23] rounded-2xl p-4 sm:p-6 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-emerald-400 flex items-center justify-center border border-primary-100 dark:border-emerald-900/30">
                <GraduationCap className="w-4 h-4" />
              </span>
              Short Courses & LMS
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Explore online modules, track your study progress, and obtain verified certificates
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-100/80 dark:bg-[#14221b] rounded-xl border border-neutral-200/60 dark:border-[#1a2e23] self-start sm:self-auto">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer',
                  tab === key
                    ? 'bg-white dark:bg-primary-600 text-neutral-900 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === 'dashboard' ? (
        <StudentDashboard onSelectCourse={setSelectedCourse} />
      ) : (
        <StudentCourseList onSelectCourse={setSelectedCourse} />
      )}
    </div>
  )
}

// ─── Admin view — includes approval queue ─────────────────────
function AdminShortCourses() {
  const { userId } = useRole()
  const [view, setView] = useState('courses')
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [editingCourse, setEditingCourse] = useState(null)

  const tabs = [
    { key: 'courses', label: 'All Courses', icon: GraduationCap },
    { key: 'pending', label: 'Pending Approval', icon: Clock },
    { key: 'create', label: 'Create Course', icon: PlusCircle },
    { key: 'revenue', label: 'Revenue & Analytics', icon: BarChart3 },
  ]

  const handleEdit = async (course) => {
    const { data } = await supabase
      .from('short_courses')
      .select('*')
      .eq('id', course.id)
      .single()
    if (data) {
      setEditingCourse(data)
      setView('edit')
    }
  }

  const handleManageCourse = (course) => {
    setSelectedCourse(course)
    setView('manage')
  }

  const isActive = (key) =>
    view === key ||
    (view === 'enrollment' && key === 'courses') ||
    (view === 'edit' && key === 'courses') ||
    (view === 'manage' && key === 'courses')

  return (
    <div className="space-y-6">
      {/* Header Container */}
      <div className="bg-white dark:bg-[#0f1a14] border border-neutral-200/80 dark:border-[#1a2e23] rounded-2xl p-4 sm:p-6 shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-emerald-400 flex items-center justify-center border border-primary-100 dark:border-emerald-900/30">
                <GraduationCap className="w-4 h-4" />
              </span>
              Short Courses Management
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Curate, review, approve and monitor interactive Islamic courses and student progress
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100/80 dark:bg-[#14221b] rounded-xl border border-neutral-200/60 dark:border-[#1a2e23] overflow-x-auto custom-scrollbar">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => {
                  setView(key)
                  setSelectedCourse(null)
                  setEditingCourse(null)
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 whitespace-nowrap cursor-pointer',
                  isActive(key)
                    ? 'bg-white dark:bg-primary-600 text-neutral-900 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'courses' && !selectedCourse && (
        <CourseList
          onSelectCourse={handleManageCourse}
          onEditCourse={handleEdit}
        />
      )}
      {view === 'pending' && <AdminCourseReview />}
      {view === 'create' && <CourseForm onComplete={() => setView('courses')} />}
      {view === 'edit' && editingCourse && (
        <CourseForm editCourse={editingCourse} onComplete={() => { setEditingCourse(null); setView('courses') }} />
      )}
      {view === 'enrollment' && selectedCourse && (
        <EnrollmentView course={selectedCourse} onBack={() => { setSelectedCourse(null); setView('courses') }} />
      )}
      {view === 'manage' && selectedCourse && (
        <AdminCourseManager
          course={selectedCourse}
          userId={userId}
          onBack={() => { setSelectedCourse(null); setView('courses') }}
          onEditCourse={handleEdit}
        />
      )}
      {view === 'revenue' && <RevenueView />}
    </div>
  )
}

// ─── Scholar view — can create courses but no approval tab ────
function ScholarShortCourses() {
  const [view, setView] = useState('courses')
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [editingCourse, setEditingCourse] = useState(null)

  const tabs = [
    { key: 'courses', label: 'My Courses', icon: GraduationCap },
    { key: 'create', label: 'Create Course', icon: PlusCircle },
  ]

  const handleEdit = async (course) => {
    const { data } = await supabase.from('short_courses').select('*').eq('id', course.id).single()
    if (data) { setEditingCourse(data); setView('edit') }
  }

  const isActive = (key) =>
    view === key ||
    (view === 'enrollment' && key === 'courses') ||
    (view === 'edit' && key === 'courses')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#0f1a14] border border-neutral-200/80 dark:border-[#1a2e23] rounded-2xl p-4 sm:p-6 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-emerald-400 flex items-center justify-center border border-primary-100 dark:border-emerald-900/30">
                <GraduationCap className="w-4 h-4" />
              </span>
              Scholar Course Portal
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Create curriculum, upload lessons, manage enrolled students, and publish quizzes
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-neutral-100/80 dark:bg-[#14221b] rounded-xl border border-neutral-200/60 dark:border-[#1a2e23] self-start sm:self-auto">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setView(key); setSelectedCourse(null); setEditingCourse(null) }}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer',
                  isActive(key)
                    ? 'bg-white dark:bg-primary-600 text-neutral-900 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'courses' && !selectedCourse && (
        <CourseList
          onSelectCourse={c => { setSelectedCourse(c); setView('enrollment') }}
          onEditCourse={handleEdit}
        />
      )}
      {view === 'create' && <CourseForm onComplete={() => setView('courses')} />}
      {view === 'edit' && editingCourse && (
        <CourseForm editCourse={editingCourse} onComplete={() => { setEditingCourse(null); setView('courses') }} />
      )}
      {view === 'enrollment' && selectedCourse && (
        <EnrollmentView course={selectedCourse} onBack={() => { setSelectedCourse(null); setView('courses') }} />
      )}
    </div>
  )
}

// ─── Root: branch by role ─────────────────────────────────────
export default function ShortCoursesModule() {
  const { role } = useRole()

  if (role === 'student') return <StudentShortCourses />
  if (role === 'admin') return <AdminShortCourses />
  return <ScholarShortCourses />
}
