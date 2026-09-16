import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Award, Clock, PlayCircle, GraduationCap, Download, Play, Sparkles } from 'lucide-react'
import { useRole } from '../../app/RoleProvider'
import { supabase } from '../../lib/supabase'
import { getStudentDashboardData, getRecentActivity } from './services/progressService'
import { CourseProgressBar } from './components/CourseProgressBar'
import { Button, Spinner, EmptyState, Badge, DashboardSkeleton } from '../../shared/ui'

/**
 * StudentDashboard — Dedicated LMS dashboard for students.
 */
export function StudentDashboard({ onSelectCourse }) {
  const { userId } = useRole()
  const [studentId, setStudentId] = useState(null)
  const [dashData, setDashData] = useState({ active: [], completed: [] })
  const [activity, setActivity] = useState([])
  const [certificates, setCertificates] = useState([])
  const [continueData, setContinueData] = useState(null)
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

      // Load "continue where you left off" — most recent partially-watched lecture
      const { data: lastWatched } = await supabase
        .from('course_progress')
        .select(`
          lecture_id, watch_percent, course_id, completed_at,
          course_lectures:lecture_id (id, title, section_id, video_url),
          short_courses:course_id (id, title, thumbnail_url)
        `)
        .eq('student_id', student.id)
        .is('completed_at', null)
        .gt('watch_percent', 0)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (lastWatched && lastWatched.course_lectures && lastWatched.short_courses) {
        setContinueData({
          lectureTitle: lastWatched.course_lectures.title,
          courseTitle: lastWatched.short_courses.title,
          courseId: lastWatched.course_id,
          watchPercent: lastWatched.watch_percent,
          course: lastWatched.short_courses,
        })
      }
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  const totalCourses = dashData.active.length + dashData.completed.length

  return (
    <div className="space-y-8">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Enrolled" value={dashData.active.length} color="primary" />
        <StatCard icon={Award} label="Completed" value={dashData.completed.length} color="green" />
        <StatCard icon={GraduationCap} label="Certificates" value={certificates.length} color="blue" />
        <StatCard icon={Clock} label="Total Courses" value={totalCourses} color="purple" />
      </div>

      {/* Continue Where You Left Off Banner */}
      {continueData && (
        <div
          onClick={() => onSelectCourse(continueData.course)}
          className="bg-gradient-to-r from-primary-500/10 via-emerald-500/5 to-transparent dark:from-primary-950/40 dark:via-[#11241a] dark:to-[#0f1a14] rounded-2xl border border-primary-300/60 dark:border-[#1a2e23] p-5 sm:p-6 cursor-pointer hover:shadow-lg transition-all group"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-500 text-white flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <Play className="w-5 h-5 ml-0.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-primary-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  Continue where you left off
                </p>
                <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100 truncate">{continueData.lectureTitle}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{continueData.courseTitle}</p>
              </div>
            </div>
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center flex-shrink-0">
              <div className="text-xl font-display font-bold text-primary-600 dark:text-emerald-400">{continueData.watchPercent}%</div>
              <p className="text-[10px] text-neutral-400">completed</p>
            </div>
          </div>
          {/* Mini progress bar */}
          <div className="mt-4 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 dark:bg-emerald-400 rounded-full transition-all" style={{ width: `${continueData.watchPercent}%` }} />
          </div>
        </div>
      )}

      {/* Active Courses */}
      {dashData.active.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-display font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-primary-500 dark:text-emerald-400" />
            Continue Learning
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashData.active.map((enrollment, i) => (
              <motion.div
                key={enrollment.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
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
        <section className="space-y-4">
          <h2 className="text-lg font-display font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-500" />
            Completed Courses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashData.completed.map((enrollment, i) => (
              <motion.div
                key={enrollment.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
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

      {/* Certificates Section */}
      {certificates.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-display font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-500" />
            My Verified Certificates
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificates.map(cert => (
              <div key={cert.id} className="bg-white dark:bg-[#0f1a14] rounded-2xl border border-neutral-200/80 dark:border-[#1a2e23] p-4 flex items-center gap-4 shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                  <Award className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 truncate">{cert.course_title}</p>
                  <p className="text-xs text-neutral-400">{cert.certificate_number}</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">{new Date(cert.issued_at).toLocaleDateString()}</p>
                </div>
                <Link
                  to={`/certificate/${cert.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-emerald-400 hover:underline whitespace-nowrap"
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
        <section className="space-y-4">
          <h2 className="text-lg font-display font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-neutral-400" />
            Recent Activity
          </h2>
          <div className="bg-white dark:bg-[#0f1a14] rounded-2xl border border-neutral-200/80 dark:border-[#1a2e23] divide-y divide-neutral-100 dark:divide-[#1a2e23] overflow-hidden shadow-xs">
            {activity.map(item => (
              <div key={item.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-800 dark:text-neutral-200 truncate">
                    Completed lesson: <span className="font-semibold">{item.course_lectures?.title}</span>
                  </p>
                  <p className="text-xs text-neutral-400">{item.short_courses?.title}</p>
                </div>
                <span className="text-xs text-neutral-400 flex-shrink-0">
                  {new Date(item.completed_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {totalCourses === 0 && (
        <div className="bg-white dark:bg-[#0f1a14] rounded-2xl border border-neutral-200/80 dark:border-[#1a2e23] p-12">
          <EmptyState
            icon={BookOpen}
            title="No enrolled courses yet"
            description="Browse our short course offerings and enroll to start your learning journey."
          />
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    primary: 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-emerald-400 border-primary-100 dark:border-emerald-900/30',
    green: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30',
    blue: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30',
    purple: 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30',
  }

  return (
    <div className="bg-white dark:bg-[#0f1a14] rounded-2xl border border-neutral-200/80 dark:border-[#1a2e23] p-4 sm:p-5 shadow-xs transition-colors">
      <div className="flex items-center gap-3.5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xl sm:text-2xl font-display font-bold text-neutral-900 dark:text-white">{value}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
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
      className="group bg-white dark:bg-[#0f1a14] rounded-2xl border border-neutral-200/80 dark:border-[#1a2e23] overflow-hidden cursor-pointer hover:shadow-xl hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all duration-300 flex flex-col hover:-translate-y-0.5"
    >
      {/* Thumbnail */}
      <div className="h-36 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-[#112018] dark:to-[#09140e] overflow-hidden relative border-b border-neutral-100 dark:border-[#1a2e23] flex items-center justify-center">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-neutral-200/50 dark:border-white/10 flex items-center justify-center text-2xl shadow-sm">
            🎓
          </div>
        )}
        {isCompleted && (
          <div className="absolute top-2.5 right-2.5 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
            ✓ Complete
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <h3 className="text-sm sm:text-base font-display font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2 mb-1 group-hover:text-primary-600 dark:group-hover:text-emerald-400 transition-colors">
          {course.title}
        </h3>
        {course.profiles?.full_name && (
          <p className="text-xs text-neutral-400 mb-3">{course.profiles.full_name}</p>
        )}

        <div className="mt-auto pt-3">
          <CourseProgressBar
            percentage={enrollment.progress}
            total={0}
            completed={0}
            size="sm"
            showLabel={false}
          />
          <div className="flex items-center justify-between mt-2.5">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{Math.round(enrollment.progress)}% complete</span>
            <Button variant="ghost" size="sm" className="text-xs h-7 px-2.5">
              {isCompleted ? 'Review' : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
