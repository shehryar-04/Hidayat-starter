import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Nazra Progress View Component
 * Displays lesson-by-lesson progress with quality notes and auto-complete detection
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export function NazraProgressView({ student, onBack }) {
  const [lessons, setLessons] = useState([])
  const [progress, setProgress] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [nazraStatus, setNazraStatus] = useState('in_progress')
  const [showCompletionForm, setShowCompletionForm] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState(null)
  const [qualityNote, setQualityNote] = useState('')

  useEffect(() => {
    loadLessons()
    loadProgress()
  }, [student.id])

  const loadLessons = async () => {
    try {
      const { data, error: err } = await supabase
        .from('nazra_lessons')
        .select('*')
        .order('sequence_order')

      if (err) throw err
      setLessons(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Error loading lessons:', err)
    }
  }

  const loadProgress = async () => {
    setLoading(true)
    try {
      const { data, error: err } = await supabase
        .from('nazra_progress')
        .select(
          `
          id,
          student_id,
          lesson_id,
          completed_at,
          scholar_id,
          quality_note,
          scholars:scholar_id (
            id,
            profile_id,
            profiles:profile_id (
              id,
              full_name
            )
          )
        `
        )
        .eq('student_id', student.id)

      if (err) throw err

      // Build progress map
      const progressMap = {}
      data?.forEach((p) => {
        progressMap[p.lesson_id] = p
      })
      setProgress(progressMap)

      // Check if all lessons are completed
      if (lessons.length > 0 && data && data.length === lessons.length) {
        setNazraStatus('complete')
      }
    } catch (err) {
      setError(err.message)
      console.error('Error loading progress:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkComplete = async (e) => {
    e.preventDefault()
    if (!selectedLesson) return

    try {
      const { data: user } = await supabase.auth.getUser()
      const { data: scholar } = await supabase
        .from('scholars')
        .select('id')
        .eq('profile_id', user.user.id)
        .single()

      const { error: err } = await supabase
        .from('nazra_progress')
        .insert({
          student_id: student.id,
          lesson_id: selectedLesson,
          completed_at: new Date().toISOString().split('T')[0],
          scholar_id: scholar?.id,
          quality_note: qualityNote || null,
        })

      if (err) throw err

      setSelectedLesson(null)
      setQualityNote('')
      setShowCompletionForm(false)
      await loadProgress()
    } catch (err) {
      setError(err.message)
      console.error('Error marking lesson complete:', err)
    }
  }

  const handleRemoveCompletion = async (lessonId) => {
    try {
      const { error: err } = await supabase
        .from('nazra_progress')
        .delete()
        .eq('student_id', student.id)
        .eq('lesson_id', lessonId)

      if (err) throw err
      await loadProgress()
    } catch (err) {
      setError(err.message)
      console.error('Error removing completion:', err)
    }
  }

  if (loading) {
    return <div className="loading">Loading Nazra progress...</div>
  }

  const completedCount = Object.keys(progress).length
  const totalLessons = lessons.length
  const progressPercentage =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  return (
    <div className="nazra-progress-view">
      <button onClick={onBack} className="back-button">
        ← Back to Search
      </button>

      <div className="progress-header">
        <h2>Nazra Progress - {student.profiles?.full_name}</h2>
        <div className="status-info">
          <p>
            <strong>Enrollment:</strong> {student.enrollment_number}
          </p>
          <p>
            <strong>Overall Status:</strong>{' '}
            <span className={`status-badge ${nazraStatus}`}>
              {nazraStatus === 'complete' ? 'Complete' : 'In Progress'}
            </span>
          </p>
          <p>
            <strong>Progress:</strong> {completedCount} / {totalLessons} lessons
            ({progressPercentage}%)
          </p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {nazraStatus === 'complete' && (
        <div className="success-message">
          <strong>Nazra Complete!</strong> All lessons have been completed.
        </div>
      )}

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <button
        onClick={() => setShowCompletionForm(!showCompletionForm)}
        className="add-completion-button"
      >
        {showCompletionForm ? 'Cancel' : 'Mark Lesson Complete'}
      </button>

      {showCompletionForm && (
        <form onSubmit={handleMarkComplete} className="completion-form">
          <div className="form-group">
            <label htmlFor="lesson-select">Lesson</label>
            <select
              id="lesson-select"
              value={selectedLesson || ''}
              onChange={(e) => setSelectedLesson(e.target.value)}
              required
            >
              <option value="">Select a lesson...</option>
              {lessons
                .filter((lesson) => !progress[lesson.id])
                .map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </option>
                ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="quality-note">Quality Note (Optional)</label>
            <textarea
              id="quality-note"
              value={qualityNote}
              onChange={(e) => setQualityNote(e.target.value)}
              placeholder="Add notes about recitation quality..."
              rows="3"
            />
          </div>

          <button type="submit">Mark Complete</button>
        </form>
      )}

      <div className="lessons-list">
        <h3>Lessons</h3>
        {lessons.length === 0 ? (
          <p>No lessons configured</p>
        ) : (
          <div className="lesson-items">
            {lessons.map((lesson) => {
              const lessonProgress = progress[lesson.id]
              const isCompleted = !!lessonProgress

              return (
                <div
                  key={lesson.id}
                  className={`lesson-item ${isCompleted ? 'completed' : ''}`}
                >
                  <div className="lesson-info">
                    <div className="lesson-number">
                      {lesson.sequence_order}
                    </div>
                    <div className="lesson-details">
                      <h4>{lesson.title}</h4>
                      {isCompleted && (
                        <>
                          <p className="completed-date">
                            Completed:{' '}
                            {new Date(
                              lessonProgress.completed_at
                            ).toLocaleDateString()}
                          </p>
                          {lessonProgress.quality_note && (
                            <p className="quality-note">
                              Note: {lessonProgress.quality_note}
                            </p>
                          )}
                          <p className="scholar-name">
                            By: {lessonProgress.scholars?.profiles?.full_name}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {isCompleted && (
                    <button
                      onClick={() => handleRemoveCompletion(lesson.id)}
                      className="remove-button"
                    >
                      Remove
                    </button>
                  )}

                  {isCompleted && (
                    <div className="completion-badge">✓</div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
