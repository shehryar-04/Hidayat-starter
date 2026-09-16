import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, Spinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../shared/ui'
import { DollarSign, Users, BookOpen, TrendingUp } from 'lucide-react'

/**
 * Revenue View Component
 * Displays enrollment counts and revenue totals for short courses
 */
export function RevenueView() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalEnrollments, setTotalEnrollments] = useState(0)

  useEffect(() => {
    loadRevenueData()
  }, [])

  const loadRevenueData = async () => {
    setLoading(true)
    try {
      const { data: coursesData, error: err1 } = await supabase
        .from('short_courses')
        .select('*')
        .order('start_date', { ascending: false })

      if (err1) throw err1

      const coursesWithStats = await Promise.all(
        (coursesData || []).map(async (course) => {
          const { data: enrollments, error: err2 } = await supabase
            .from('short_course_enrollments')
            .select('id, status')
            .eq('course_id', course.id)

          if (err2) throw err2

          const totalEnrolled = enrollments?.length || 0
          const completedEnrolled = enrollments?.filter(
            (e) => e.status === 'completed'
          ).length || 0
          const courseRevenue = (totalEnrolled * (course.fee || 0)) || 0

          return {
            ...course,
            totalEnrolled,
            completedEnrolled,
            courseRevenue,
          }
        })
      )

      setCourses(coursesWithStats)

      const revenue = coursesWithStats.reduce(
        (sum, course) => sum + course.courseRevenue,
        0
      )
      const enrollments = coursesWithStats.reduce(
        (sum, course) => sum + course.totalEnrolled,
        0
      )

      setTotalRevenue(revenue)
      setTotalEnrollments(enrollments)
    } catch (err) {
      setError(err.message)
      console.error('Error loading revenue data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size="lg" />
        <span className="text-sm text-neutral-400 mt-3">Loading analytics...</span>
      </div>
    )
  }

  const activeCourses = courses.filter((c) => {
    const now = new Date()
    const start = new Date(c.start_date)
    const end = new Date(c.end_date)
    return start <= now && now <= end
  })

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-[#0f1a14] border border-neutral-200/80 dark:border-[#1a2e23] rounded-2xl shadow-xs p-5 transition-colors">
          <div className="flex items-center gap-3.5 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Total Revenue</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white">${totalRevenue.toFixed(2)}</p>
        </div>

        <div className="bg-white dark:bg-[#0f1a14] border border-neutral-200/80 dark:border-[#1a2e23] rounded-2xl shadow-xs p-5 transition-colors">
          <div className="flex items-center gap-3.5 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Total Enrollments</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white">{totalEnrollments}</p>
        </div>

        <div className="bg-white dark:bg-[#0f1a14] border border-neutral-200/80 dark:border-[#1a2e23] rounded-2xl shadow-xs p-5 transition-colors">
          <div className="flex items-center gap-3.5 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Active Courses</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white">{activeCourses.length}</p>
        </div>
      </div>

      {/* Course Analytics Table */}
      <div className="bg-white dark:bg-[#0f1a14] border border-neutral-200/80 dark:border-[#1a2e23] rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-[#1a2e23] flex items-center justify-between">
          <h3 className="font-display font-bold text-neutral-900 dark:text-neutral-100 text-base">Course Analytics Breakdown</h3>
          <span className="text-xs text-neutral-400">{courses.length} courses total</span>
        </div>
        {courses.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={BookOpen}
              title="No courses available"
              description="Create courses to see analytics and enrollment breakdowns here."
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Title</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Total Enrolled</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Course Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium text-neutral-900 dark:text-neutral-100">{course.title}</TableCell>
                  <TableCell>${course.fee || 0}</TableCell>
                  <TableCell>{course.totalEnrolled}</TableCell>
                  <TableCell>{course.completedEnrolled}</TableCell>
                  <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">${course.courseRevenue.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
