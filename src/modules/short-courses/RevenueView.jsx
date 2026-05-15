import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, Spinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../shared/ui'
import { DollarSign, Users, BookOpen } from 'lucide-react'

/**
 * Revenue View Component
 * Displays enrollment counts and revenue totals for short courses
 * Requirements: 7.4
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
      // Get all courses with enrollment counts
      const { data: coursesData, error: err1 } = await supabase
        .from('short_courses')
        .select('*')
        .order('start_date', { ascending: false })

      if (err1) throw err1

      // Get enrollment data for each course
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

      // Calculate totals
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
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
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
    <div className="max-w-[1280px] mx-auto px-4 py-6 md:px-6 md:py-8">
      <h2 className="text-xl font-bold text-neutral-800 mb-6">Revenue & Analytics</h2>

      {error && <div className="bg-error-light text-error-dark rounded-lg p-4 text-sm mb-4">{error}</div>}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-sm font-medium text-neutral-500">Total Revenue</h3>
          </div>
          <p className="text-2xl font-bold text-neutral-800">${totalRevenue.toFixed(2)}</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-sm font-medium text-neutral-500">Total Enrollments</h3>
          </div>
          <p className="text-2xl font-bold text-neutral-800">{totalEnrollments}</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-sm font-medium text-neutral-500">Active Courses</h3>
          </div>
          <p className="text-2xl font-bold text-neutral-800">{activeCourses.length}</p>
        </div>
      </div>

      {/* Course Analytics Table */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h3 className="font-semibold text-neutral-700">Course Analytics</h3>
        </div>
        {courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No courses available"
            description="Create courses to see analytics here."
          />
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
                  <TableCell className="font-medium">{course.title}</TableCell>
                  <TableCell>${course.fee || 0}</TableCell>
                  <TableCell>{course.totalEnrolled}</TableCell>
                  <TableCell>{course.completedEnrolled}</TableCell>
                  <TableCell className="font-semibold">${course.courseRevenue.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
