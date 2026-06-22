import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Award, Clock, PlayCircle, GraduationCap, Download } from 'lucide-react'
import { useRole } from '../../app/RoleProvider'
import { supabase } from '../../lib/supabase'
import { getStudentDashboardData, getRecentActivity } from './services/progressService'
import { CourseProgressBar } from './components/CourseProgressBar'
import { Button, Spinner, EmptyState, Badge } from '../../shared/ui'

/**
 * StudentDashboard — Dedicated LMS dashboard for students.
 *
 * Shows:
 * - Enrolled courses with progress
 * - Completed courses with certificate status
 * - Recent activity feed
 * - Quick stats
 */
export function StudentDashboard({ onSelectCourse }) {
  const { userId } = useRole()
  const [studentId, setStudentId] = useState(null)
  const [dashData, setDashData] = useState({ active: [], completed: [] })
  const [activity, setActivity] = useState([])
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) loadDashboard()
  }, [userId])

  const loadDashboard = async () => {
    setLoading(true)
    try {
      // Get student ID
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', userId)
        .single()

      if (!student) { setLoading(false); return }
      setStudentId(student.id)

      // Load all dashboard data in parallel
      const [dash, activityData, certData] = await Promise.all([
        getStudentDashboardData(student.id),
        getRecentActivity(student.id, 5),
        supabase
          .from('certificates')
          .select('id, certificate_number, course_title, issued_at, pdf_url')
          .eq('student_id', student.id)
          .order('issued_at', { ascending: false })
          .limit(10),
      ])

      setDashData(dash)
      setActivity(activityData)
      setCertificates(certData.data || [])
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  const totalCourses = dashData.active.length + dashData.completed.length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Learning</h1>
        <p className="text-gray-500 text-sm">Track your progress and continue where you left off.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard icon={BookOpen} label="Enrolled" value={dashData.active.length} color="primary" />
        <StatCard icon={Award} label="Completed" value={dashData.completed.length} color="green" />
        <StatCard icon={GraduationCap} label="Certificates" value={certificates.length} color="blue" />
        <StatCard icon={Clock} label="Total Courses" value={totalCourses} color="purple" />
      </div>

      {/* Continue Learning */}
      {dashData.active.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-primary-500" />
            Continue Learning
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {dashData.active.map((enrollment, i) => (
              <motion.div
                key={enrollment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <CourseCard
                  enrollment={enrollment}
                  onClick={() => onSelectCourse(enrollment.course)}
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Completed Courses */}
      {dashData.completed.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-green-500" />
            Completed Courses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {dashData.completed.map((enrollment, i) => (
              <motion.div
                key={enrollment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <CourseCard
                  enrollment={enrollment}
                  onClick={() => onSelectCourse(enrollment.course)}
                  isCompleted
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Certificates */}
      {certificates.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-500" />
            My Certificates
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificates.map(cert => (
              <div key={cert.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{cert.course_title}</p>
                  <p className="text-xs text-gray-400">{cert.certificate_number}</p>
                  <p className="text-xs text-gray-400">{new Date(cert.issued_at).toLocaleDateString()}</p>
                </div>
                <Link
                  to={`/certificate/${cert.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  View
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Activity */}
      {activity.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            Recent Activity
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {activity.map(item => (
              <div key={item.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">
                    Completed: <span className="font-medium">{item.course_lectures?.title}</span>
                  </p>
                  <p className="text-xs text-gray-400">{item.short_courses?.title}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(item.completed_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {totalCourses === 0 && (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Enroll in a course to start your learning journey."
        />
      )}
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  )
}

function CourseCard({ enrollment, onClick, isCompleted = false }) {
  const course = enrollment.course
  if (!course) return null

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md hover:border-primary-200 transition-all"
    >
      {/* Thumbnail */}
      <div className="h-32 bg-gray-100 overflow-hidden relative">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-700 to-primary-500 flex items-center justify-center">
            <GraduationCap className="w-10 h-10 text-white/30" />
          </div>
        )}
        {isCompleted && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            ✓ Complete
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-1 group-hover:text-primary-600 transition-colors">
          {course.title}
        </h3>
        {course.profiles?.full_name && (
          <p className="text-xs text-gray-400 mb-3">{course.profiles.full_name}</p>
        )}

        <CourseProgressBar
          percentage={enrollment.progress}
          total={0}
          completed={0}
          size="sm"
          showLabel={false}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500">{Math.round(enrollment.progress)}% complete</span>
          <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
            {isCompleted ? 'Review' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  )
}
