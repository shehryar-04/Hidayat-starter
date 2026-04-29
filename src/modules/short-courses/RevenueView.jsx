import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

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
    return <div className="loading">Loading revenue data...</div>
  }

  return (
    <div className="revenue-view">
      <h2>Revenue & Analytics</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="summary-cards">
        <div className="summary-card">
          <h3>Total Revenue</h3>
          <p className="amount">${totalRevenue.toFixed(2)}</p>
        </div>

        <div className="summary-card">
          <h3>Total Enrollments</h3>
          <p className="amount">{totalEnrollments}</p>
        </div>

        <div className="summary-card">
          <h3>Active Courses</h3>
          <p className="amount">
            {courses.filter((c) => {
              const now = new Date()
              const start = new Date(c.start_date)
              const end = new Date(c.end_date)
              return start <= now && now <= end
            }).length}
          </p>
        </div>
      </div>

      <div className="courses-analytics">
        <h3>Course Analytics</h3>
        {courses.length === 0 ? (
          <p>No courses available</p>
        ) : (
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Course Title</th>
                <th>Fee</th>
                <th>Total Enrolled</th>
                <th>Completed</th>
                <th>Course Revenue</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>{course.title}</td>
                  <td>${course.fee || 0}</td>
                  <td>{course.totalEnrolled}</td>
                  <td>{course.completedEnrolled}</td>
                  <td>${course.courseRevenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
