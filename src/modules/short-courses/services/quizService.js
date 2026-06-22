/**
 * Quiz Service — Simple MCQ quiz system.
 * Teachers create questions with 4 options and 1 correct answer.
 * Students attempt, auto-graded instantly.
 */

import { supabase } from '../../../lib/supabase'

// ─── Teacher Operations ──────────────────────────────────────

export async function createQuiz(courseId, title, passingScore, createdBy, sectionId = null) {
  const { data, error } = await supabase
    .from('quizzes')
    .insert({
      course_id: courseId,
      title,
      passing_score: passingScore,
      section_id: sectionId,
      is_published: false,
      created_by: createdBy,
    })
    .select('id')
    .single()

  if (error) throw error
  return data
}

export async function updateQuiz(quizId, updates) {
  const { error } = await supabase
    .from('quizzes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', quizId)
  if (error) throw error
}

export async function deleteQuiz(quizId) {
  const { error } = await supabase.from('quizzes').delete().eq('id', quizId)
  if (error) throw error
}

export async function publishQuiz(quizId) {
  return updateQuiz(quizId, { is_published: true })
}

export async function addQuestion(quizId, questionText, options, correctIndex, points = 1) {
  // Get next position
  const { count } = await supabase
    .from('quiz_questions')
    .select('id', { count: 'exact', head: true })
    .eq('quiz_id', quizId)

  const { data: question, error: qErr } = await supabase
    .from('quiz_questions')
    .insert({
      quiz_id: quizId,
      question_type: 'multiple_choice',
      question_text: questionText,
      points,
      position: (count || 0),
    })
    .select('id')
    .single()

  if (qErr) throw qErr

  // Insert options
  const optionRows = options.map((text, i) => ({
    question_id: question.id,
    option_text: text,
    is_correct: i === correctIndex,
    position: i,
  }))

  const { error: oErr } = await supabase.from('quiz_options').insert(optionRows)
  if (oErr) throw oErr

  return question
}

export async function deleteQuestion(questionId) {
  const { error } = await supabase.from('quiz_questions').delete().eq('id', questionId)
  if (error) throw error
}

export async function getQuizWithQuestions(quizId) {
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .single()

  if (!quiz) return null

  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('id, question_text, points, position')
    .eq('quiz_id', quizId)
    .order('position')

  const questionIds = (questions || []).map(q => q.id)

  let options = []
  if (questionIds.length > 0) {
    const { data } = await supabase
      .from('quiz_options')
      .select('id, question_id, option_text, is_correct, position')
      .in('question_id', questionIds)
      .order('position')
    options = data || []
  }

  // Attach options to questions
  const questionsWithOptions = (questions || []).map(q => ({
    ...q,
    options: options.filter(o => o.question_id === q.id),
  }))

  return { ...quiz, questions: questionsWithOptions }
}

export async function getCourseQuizzes(courseId) {
  const { data } = await supabase
    .from('quizzes')
    .select('id, title, passing_score, is_published, section_id, created_at, course_sections:section_id(title)')
    .eq('course_id', courseId)
    .order('created_at')

  return data || []
}

// ─── Student Operations ──────────────────────────────────────

export async function getQuizForStudent(quizId) {
  // Returns quiz WITHOUT correct answers marked
  const quiz = await getQuizWithQuestions(quizId)
  if (!quiz) return null

  // Strip is_correct from options
  return {
    ...quiz,
    questions: quiz.questions.map(q => ({
      ...q,
      options: q.options.map(o => ({ id: o.id, option_text: o.option_text, position: o.position })),
    })),
  }
}

export async function submitQuizAttempt(quizId, studentId, answers) {
  // answers: { [questionId]: selectedOptionId }

  // Create attempt
  const { data: attempt, error: aErr } = await supabase
    .from('quiz_attempts')
    .insert({
      quiz_id: quizId,
      student_id: studentId,
      started_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (aErr) throw aErr

  // Get correct answers
  const quiz = await getQuizWithQuestions(quizId)
  if (!quiz) throw new Error('Quiz not found')

  let totalPoints = 0
  let earnedPoints = 0
  const answerRows = []

  for (const question of quiz.questions) {
    totalPoints += question.points
    const selectedOptionId = answers[question.id]
    const correctOption = question.options.find(o => o.is_correct)
    const isCorrect = selectedOptionId === correctOption?.id

    if (isCorrect) earnedPoints += question.points

    answerRows.push({
      attempt_id: attempt.id,
      question_id: question.id,
      selected_option_id: selectedOptionId || null,
      is_correct: isCorrect,
      points_earned: isCorrect ? question.points : 0,
    })
  }

  // Save answers
  await supabase.from('quiz_answers').insert(answerRows)

  // Calculate score
  const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
  const passed = percentage >= quiz.passing_score

  // Update attempt with score
  await supabase
    .from('quiz_attempts')
    .update({ score: earnedPoints, percentage, passed })
    .eq('id', attempt.id)

  // If passed, recalculate course progress (quiz counts toward completion)
  if (passed) {
    // Get course_id from quiz
    const { data: quizRow } = await supabase.from('quizzes').select('course_id').eq('id', quizId).single()
    if (quizRow) {
      // Dynamic import to avoid circular deps
      const { getCourseProgress } = await import('./progressService.js')
      // Trigger a dummy progress recalc by calling the internal logic
      // We do this via a direct enrollment update query
      const { count: totalLectures } = await supabase
        .from('course_lectures')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', quizRow.course_id)

      const { count: completedLectures } = await supabase
        .from('course_progress')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', quizRow.course_id)
        .eq('student_id', studentId)

      const { data: allQuizzes } = await supabase
        .from('quizzes')
        .select('id')
        .eq('course_id', quizRow.course_id)
        .eq('is_published', true)

      const totalQuizzes = (allQuizzes || []).length
      let passedQuizCount = 0
      if (totalQuizzes > 0) {
        const { data: passedAttempts } = await supabase
          .from('quiz_attempts')
          .select('quiz_id')
          .eq('student_id', studentId)
          .in('quiz_id', (allQuizzes || []).map(q => q.id))
          .eq('passed', true)
        passedQuizCount = new Set((passedAttempts || []).map(a => a.quiz_id)).size
      }

      const totalItems = (totalLectures || 0) + totalQuizzes
      const completedItems = (completedLectures || 0) + passedQuizCount
      const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100 * 10) / 10 : 0

      const updateData = { progress_pct: pct }
      if (pct >= 100) {
        updateData.course_completed_at = new Date().toISOString()
        updateData.status = 'completed'
      }

      await supabase
        .from('short_course_enrollments')
        .update(updateData)
        .eq('course_id', quizRow.course_id)
        .eq('student_id', studentId)
        .in('status', ['active'])
    }
  }

  return { attemptId: attempt.id, score: earnedPoints, totalPoints, percentage, passed }
}

export async function getStudentAttempts(quizId, studentId) {
  const { data } = await supabase
    .from('quiz_attempts')
    .select('id, score, percentage, passed, submitted_at')
    .eq('quiz_id', quizId)
    .eq('student_id', studentId)
    .order('submitted_at', { ascending: false })

  return data || []
}

export async function getAttemptDetails(attemptId) {
  const { data: attempt } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('id', attemptId)
    .single()

  if (!attempt) return null

  const { data: answers } = await supabase
    .from('quiz_answers')
    .select(`
      id, question_id, selected_option_id, is_correct, points_earned,
      quiz_questions:question_id (question_text, points),
      quiz_options:selected_option_id (option_text)
    `)
    .eq('attempt_id', attemptId)

  return { ...attempt, answers: answers || [] }
}
