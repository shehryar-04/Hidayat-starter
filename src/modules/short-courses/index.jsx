import { useState } from 'react'
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
import { QuizBuilder } from './components/QuizBuilder'
import { CourseAnnouncements } from './components/CourseAnnouncements'
import { TeacherAnalytics } from './components/TeacherAnalytics'
import { AdminCourseManager } from './components/AdminCourseManager'
import { cn } from '../../shared/ui'

// ─── Student view ─────────────────────────────────────────────
function StudentShortCourses() {
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [tab, setTab] = useState('dashboard')

  if (selectedCourse) {
    return <StudentCourseView course={selectedCourse} onBack={() => setSelectedCourse(null)} />
  }

  if (tab === 'dashboard') {
    return (
      <div>
        <div className="bg-white border-b border-neutral-200 px-4 sm:px-8 pt-4 pb-0">
          <div className="flex gap-4 overflow-x-auto">
            <button onClick={() => setTab('dashboard')}
              className={cn('px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
                'text-primary-500 font-semibold border-primary-500')}>
              My Dashboard
            </button>
            <button onClick={() => setTab('browse')}
              className="px-4 py-2.5 text-sm font-medium border-b-2 border-transparent text-neutral-500 hover:text-neutral-800 whitespace-nowrap transition-colors">
              Browse Courses
            </button>
          </div>
        </div>
        <StudentDashboard onSelectCourse={setSelectedCourse} />
      </div>
    )
  }

  return (
    <div>
      <div className="bg-white border-b border-neutral-200 px-4 sm:px-8 pt-4 pb-0">
        <div className="flex gap-4 overflow-x-auto">
          <button onClick={() => setTab('dashboard')}
            className="px-4 py-2.5 text-sm font-medium border-b-2 border-transparent text-neutral-500 hover:text-neutral-800 whitespace-nowrap transition-colors">
            My Dashboard
          </button>
          <button onClick={() => setTab('browse')}
            className={cn('px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
              'text-primary-500 font-semibold border-primary-500')}>
            Browse Courses
          </button>
        </div>
      </div>
      <StudentCourseList onSelectCourse={setSelectedCourse} />
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
    ['courses', 'All Courses'],
    ['pending', '⏳ Pending Approval'],
    ['create', 'Create Course'],
    ['revenue', 'Revenue & Analytics'],
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

  const isActive = (key) => view === key || (view === 'enrollment' && key === 'courses') || (view === 'edit' && key === 'courses') || (view === 'manage' && key === 'courses')

  return (
    <div>
      <div className="bg-white border-b border-neutral-200 px-8 pt-6 pb-0">
        <h1 className="text-xl font-bold text-primary mb-4">Short Courses</h1>
        <div className="flex border-b border-neutral-200 overflow-x-auto">
          {tabs.map(([key, label]) => (
            <button key={key}
              onClick={() => { setView(key); setSelectedCourse(null); setEditingCourse(null) }}
              className={cn(
                'relative px-4 py-2.5 text-sm font-medium transition-colors duration-150 whitespace-nowrap outline-none',
                isActive(key)
                  ? 'text-primary-500 font-semibold border-b-2 border-primary-500'
                  : 'text-neutral-500 hover:text-neutral-800'
              )}>
              {label}
            </button>
          ))}
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
    ['courses', 'My Courses'],
    ['create', 'Create Course'],
  ]

  const handleEdit = async (course) => {
    const { data } = await supabase.from('short_courses').select('*').eq('id', course.id).single()
    if (data) { setEditingCourse(data); setView('edit') }
  }

  const isActive = (key) => view === key || (view === 'enrollment' && key === 'courses') || (view === 'edit' && key === 'courses')

  return (
    <div>
      <div className="bg-white border-b border-neutral-200 px-8 pt-6 pb-0">
        <h1 className="text-xl font-bold text-primary mb-4">Short Courses</h1>
        <div className="flex border-b border-neutral-200 overflow-x-auto">
          {tabs.map(([key, label]) => (
            <button key={key}
              onClick={() => { setView(key); setSelectedCourse(null); setEditingCourse(null) }}
              className={cn(
                'relative px-4 py-2.5 text-sm font-medium transition-colors duration-150 whitespace-nowrap outline-none',
                isActive(key)
                  ? 'text-primary-500 font-semibold border-b-2 border-primary-500'
                  : 'text-neutral-500 hover:text-neutral-800'
              )}>
              {label}
            </button>
          ))}
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
