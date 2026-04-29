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

// ─── Student view ─────────────────────────────────────────────
function StudentShortCourses() {
  const [selectedCourse, setSelectedCourse] = useState(null)

  if (selectedCourse) {
    return <StudentCourseView course={selectedCourse} onBack={() => setSelectedCourse(null)} />
  }

  return <StudentCourseList onSelectCourse={setSelectedCourse} />
}

// ─── Admin view — includes approval queue ─────────────────────
function AdminShortCourses() {
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
    // Fetch full course data for editing
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

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-8 pt-6 pb-0">
        <h1 className="text-xl font-bold text-primary mb-4">Short Courses</h1>
        <div className="tab-bar">
          {tabs.map(([key, label]) => (
            <button key={key}
              onClick={() => { setView(key); setSelectedCourse(null); setEditingCourse(null) }}
              className={`tab ${view === key || (view === 'enrollment' && key === 'courses') || (view === 'edit' && key === 'courses') ? 'active' : ''}`}>
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
      {view === 'pending' && <AdminCourseReview />}
      {view === 'create' && <CourseForm onComplete={() => setView('courses')} />}
      {view === 'edit' && editingCourse && (
        <CourseForm editCourse={editingCourse} onComplete={() => { setEditingCourse(null); setView('courses') }} />
      )}
      {view === 'enrollment' && selectedCourse && (
        <EnrollmentView course={selectedCourse} onBack={() => { setSelectedCourse(null); setView('courses') }} />
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

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-8 pt-6 pb-0">
        <h1 className="text-xl font-bold text-primary mb-4">Short Courses</h1>
        <div className="tab-bar">
          {tabs.map(([key, label]) => (
            <button key={key}
              onClick={() => { setView(key); setSelectedCourse(null); setEditingCourse(null) }}
              className={`tab ${view === key || (view === 'enrollment' && key === 'courses') || (view === 'edit' && key === 'courses') ? 'active' : ''}`}>
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
