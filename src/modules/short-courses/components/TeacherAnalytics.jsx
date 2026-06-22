import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Award, TrendingUp, DollarSign, BookOpen, CheckCircle } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { Spinner, EmptyState } from '../../../shared/ui'

/**
 * TeacherAnalytics — Per-course analytics for teachers/admins.
 * Shows: students, completion rate, quiz stats, certificates, revenue.
 */
export function TeacherAnalytics({ courseId }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (courseId) loadStats() }, [courseId])

  const loadStats = async () => {
    setLoading(true)
    try {
      const [enrollRes, completedRes, quizRes, certRes, revenueRes] = await Promise.all([
        // Total enrollments
        supabase
          .from('short_course_enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('course_id', courseId)
          .in('status', ['active', 'completed']),

        // Completed enrollments
        supabase
          .from('short_course_enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('course_id', courseId)
          .eq('status', 'completed'),

        // Quiz attempts
        supabase
          .from('quiz_attempts')
          .select('id, passed, percentage')
          .in('quiz_id', (
            await supabase.from('quizzes').select('id').eq('course_id', courseId)
          ).data?.map(q => q.id) || []),

        // Certificates issued
        supabase
          .from('certificates')
          .select('id', { count: 'exact', head: true })
          .eq('course_id', courseId),

        // Revenue (fee × active enrollments)
        supabase
          .from('short_courses')
          .select('fee, is_free')
          .eq('id', courseId)
          .single(),
      ])

      const totalStudents = enrollRes.count || 0
      const completedStudents = completedRes.count || 0
      const quizAttempts = quizRes.data || []
      const quizPassCount = quizAttempts.filter(a => a.passed).length
      const avgQuizScore = quizAttempts.length > 0
        ? Math.round(quizAttempts.reduce((s, a) => s + (a.percentage || 0), 0) / quizAttempts.length)
        : 0
      const certificatesIssued = certRes.count || 0
      const courseFee = revenueRes.data?.is_free ? 0 : (revenueRes.data?.fee || 0)
      const revenue = courseFee * totalStudents

      setStats({
        totalStudents,
        activeStudents: totalStudents - completedStudents,
        completedStudents,
        completionRate: totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0,
        quizAttempts: quizAttempts.length,
        quizPassRate: quizAttempts.length > 0 ? Math.round((quizPassCount / quizAttempts.length) * 100) : 0,
        avgQuizScore,
        certificatesIssued,
        revenue,
      })
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  if (loading) return <div className="py-12 flex justify-center"><Spinner size="lg" /></div>
  if (!stats) return <EmptyState icon={TrendingUp} title="No data" description="Analytics will appear once students enroll." />

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Students" value={stats.totalStudents} color="blue" />
        <StatCard icon={BookOpen} label="Active" value={stats.activeStudents} color="primary" />
        <StatCard icon={CheckCircle} label="Completion Rate" value={`${stats.completionRate}%`} color="green" />
        <StatCard icon={TrendingUp} label="Quiz Pass Rate" value={`${stats.quizPassRate}%`} color="purple" />
        <StatCard icon={Award} label="Avg Quiz Score" value={`${stats.avgQuizScore}%`} color="yellow" />
        <StatCard icon={Award} label="Certificates" value={stats.certificatesIssued} color="indigo" />
        <StatCard icon={DollarSign} label="Revenue" value={`Rs. ${stats.revenue}`} color="green" />
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-4"
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <p className="text-xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </motion.div>
  )
}
