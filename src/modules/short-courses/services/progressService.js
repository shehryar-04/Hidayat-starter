/**
 * Student Learning Progress Service
 *
 * Handles lecture completion tracking, progress calculation,
 * and course completion detection.
 */

import { supabase } from '../../../lib/supabase'

/**
 * Mark a lecture as completed for the current student.
 * @param {string} courseId
 * @param {string} lectureId
 * @param {string} studentId
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function markLectureComplete(courseId, lectureId, studentId) {
  const { error } = await supabase
    .from('course_progress')
    .upsert({
      course_id: courseId,
      student_id: studentId,
      lecture_id: lectureId,
      completed_at: new Date().toISOString(),
      watch_percent: 100,
    }, { onConflict: 'student_id,lecture_id' })

  if (error) return { ok: false, error: error.message }

  // Update enrollment progress percentage
  await updateEnrollmentProgress(courseId, studentId)

  return { ok: true }
}

/**
 * Save partial watch progress for a lecture (e.g. 45% watched).
 * Does NOT mark as completed — just saves how far the student got.
 * Called periodically while video plays.
 */
export async function saveWatchProgress(courseId, lectureId, studentId, watchPercent) {
  const { error } = await supabase
    .from('course_progress')
    .upsert({
      course_id: courseId,
      student_id: studentId,
      lecture_id: lectureId,
      watch_percent: Math.min(100, Math.max(0, Math.round(watchPercent))),
      // Only set completed_at if >= 90%
      ...(watchPercent >= 90 ? { completed_at: new Date().toISOString() } : {}),
    }, { onConflict: 'student_id,lecture_id' })

  if (error) return { ok: false, error: error.message }

  // Update enrollment progress
  await updateEnrollmentProgress(courseId, studentId)

  return { ok: true }
}

/**
 * Get the saved watch percent for a specific lecture.
 */
export async function getLectureWatchPercent(lectureId, studentId) {
  const { data } = await supabase
    .from('course_progress')
    .select('watch_percent, completed_at')
    .eq('student_id', studentId)
    .eq('lecture_id', lectureId)
    .maybeSingle()

  return data ? { watchPercent: data.watch_percent || 0, isCompleted: !!data.completed_at } : { watchPercent: 0, isCompleted: false }
}

/**
 * Unmark a lecture completion.
 */
export async function unmarkLectureComplete(courseId, lectureId, studentId) {
  const { error } = await supabase
    .from('course_progress')
    .delete()
    .eq('student_id', studentId)
    .eq('lecture_id', lectureId)

  if (error) return { ok: false, error: error.message }

  await updateEnrollmentProgress(courseId, studentId)
  return { ok: true }
}

/**
 * Get all completed lecture IDs for a student in a course.
 * @returns {Promise<Set<string>>}
 */
export async function getCompletedLectures(courseId, studentId) {
  const { data } = await supabase
    .from('course_progress')
    .select('lecture_id')
    .eq('course_id', courseId)
    .eq('student_id', studentId)

  return new Set((data || []).map(r => r.lecture_id))
}

/**
 * Get progress stats for a student in a course.
 * @returns {Promise<{total: number, completed: number, percentage: number}>}
 */
export async function getCourseProgress(courseId, studentId) {
  const { data } = await supabase.rpc('get_course_progress', {
    p_student_id: studentId,
    p_course_id: courseId,
  })

  if (data && data.length > 0) {
    return {
      total: data[0].total_lectures,
      completed: data[0].completed_lectures,
      percentage: Number(data[0].progress_pct) || 0,
    }
  }

  return { total: 0, completed: 0, percentage: 0 }
}

/**
 * Get all enrolled courses with progress for the student dashboard.
 * @returns {Promise<Array>}
 */
export async function getStudentDashboardData(studentId) {
  // Get enrollments with course data
  const { data: enrollments } = await supabase
    .from('short_course_enrollments')
    .select(`
      id, status, enrolled_at, completed_at, course_completed_at, progress_pct,
      course_id,
      short_courses:course_id (
        id, title, subtitle, thumbnail_url, level, category,
        profiles:created_by (full_name)
      )
    `)
    .eq('student_id', studentId)
    .in('status', ['active', 'completed'])
    .order('enrolled_at', { ascending: false })

  if (!enrollments) return { active: [], completed: [] }

  // Calculate live progress for each enrollment from course_progress table
  const courseIds = enrollments.map(e => e.course_id).filter(Boolean)

  // Get completed lecture counts per course
  const { data: progressData } = await supabase
    .from('course_progress')
    .select('course_id, lecture_id, completed_at')
    .eq('student_id', studentId)
    .in('course_id', courseIds.length > 0 ? courseIds : ['__none__'])

  // Get total lecture counts per course
  const { data: lectureData } = await supabase
    .from('course_lectures')
    .select('course_id')
    .in('course_id', courseIds.length > 0 ? courseIds : ['__none__'])

  // Build progress map: courseId → { completed, total, pct }
  const progressMap = {}
  for (const cid of courseIds) {
    const total = (lectureData || []).filter(l => l.course_id === cid).length
    const completed = (progressData || []).filter(p => p.course_id === cid && p.completed_at).length
    progressMap[cid] = {
      total,
      completed,
      pct: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  }

  const active = enrollments
    .filter(e => e.status === 'active')
    .map(e => ({
      ...e,
      course: e.short_courses,
      progress: progressMap[e.course_id]?.pct || Number(e.progress_pct) || 0,
    }))

  const completed = enrollments
    .filter(e => e.status === 'completed')
    .map(e => ({
      ...e,
      course: e.short_courses,
      progress: progressMap[e.course_id]?.pct || 100,
    }))

  return { active, completed }
}

/**
 * Get recent activity for dashboard.
 */
export async function getRecentActivity(studentId, limit = 10) {
  const { data } = await supabase
    .from('course_progress')
    .select(`
      id, completed_at,
      course_lectures:lecture_id (title, course_id),
      short_courses:course_id (title)
    `)
    .eq('student_id', studentId)
    .order('completed_at', { ascending: false })
    .limit(limit)

  return data || []
}

/**
 * Internal: update the enrollment's progress_pct and detect completion.
 * Progress = (completed lectures + passed section quizzes) / (total lectures + total section quizzes)
 * When progress reaches 100%, auto-generates a certificate.
 */
async function updateEnrollmentProgress(courseId, studentId) {
  // Get total lectures
  const { count: totalLectures } = await supabase
    .from('course_lectures')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', courseId)

  // Get completed lectures
  const { count: completedLectures } = await supabase
    .from('course_progress')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', courseId)
    .eq('student_id', studentId)

  // Get required quizzes for this course (published ones)
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id')
    .eq('course_id', courseId)
    .eq('is_published', true)

  const totalQuizzes = (quizzes || []).length

  // Get passed quizzes
  let passedQuizzes = 0
  if (totalQuizzes > 0) {
    const quizIds = quizzes.map(q => q.id)
    const { data: passedAttempts } = await supabase
      .from('quiz_attempts')
      .select('quiz_id')
      .eq('student_id', studentId)
      .in('quiz_id', quizIds)
      .eq('passed', true)

    // Count unique passed quizzes
    const passedSet = new Set((passedAttempts || []).map(a => a.quiz_id))
    passedQuizzes = passedSet.size
  }

  // Calculate progress: lectures + quizzes
  const totalItems = (totalLectures || 0) + totalQuizzes
  const completedItems = (completedLectures || 0) + passedQuizzes
  const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100 * 10) / 10 : 0

  // Update enrollment
  const updateData = { progress_pct: pct }

  // Check if course is complete
  if (pct >= 100) {
    updateData.course_completed_at = new Date().toISOString()
    updateData.status = 'completed'

    // Auto-generate certificate
    await autoGenerateCertificate(courseId, studentId)
  }

  await supabase
    .from('short_course_enrollments')
    .update(updateData)
    .eq('course_id', courseId)
    .eq('student_id', studentId)
    .in('status', ['active'])
}

/**
 * Auto-generate a certificate when a course is completed.
 * Only creates if one doesn't already exist.
 */
async function autoGenerateCertificate(courseId, studentId) {
  // Check if certificate already exists
  const { data: existing } = await supabase
    .from('certificates')
    .select('id')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .limit(1)
    .maybeSingle()

  if (existing) return // Already has certificate

  // Get student name
  const { data: student } = await supabase
    .from('students')
    .select('profile_id, profiles:profile_id(full_name)')
    .eq('id', studentId)
    .single()

  // Get course + instructor
  const { data: course } = await supabase
    .from('short_courses')
    .select('title, profiles:created_by(full_name)')
    .eq('id', courseId)
    .single()

  if (!student || !course) return

  const studentName = student.profiles?.full_name || 'Student'
  const courseTitle = course.title || 'Course'
  const instructorName = course.profiles?.full_name || 'Hidayat Academy'

  // Generate unique certificate number and verification code
  const certNumber = `HDY-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
  const verCode = 'HDY' + Math.random().toString(36).substring(2, 11).toUpperCase()

  await supabase.from('certificates').insert({
    student_id: studentId,
    course_id: courseId,
    certificate_number: certNumber,
    verification_code: verCode,
    student_name: studentName,
    course_title: courseTitle,
    instructor_name: instructorName,
    is_active: true,
  })
}
