import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Button, Input, Card, CardContent, Badge, Spinner, EmptyState, Modal } from '../../shared/ui'
import { ArrowLeft, BookOpen, CheckCircle } from 'lucide-react'

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

      const progressMap = {}
      data?.forEach((p) => {
        progressMap[p.lesson_id] = p
      })
      setProgress(progressMap)

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
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  const completedCount = Object.keys(progress).length
  const totalLessons = lessons.length
  const progressPercentage =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} size="sm">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Search
      </Button>

      <Card>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-neutral-800">
                Nazra Progress - {student.profiles?.full_name}
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                Enrollment: {student.enrollment_number}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={nazraStatus === 'complete' ? 'success' : 'warning'} dot>
                {nazraStatus === 'complete' ? 'Complete' : 'In Progress'}
              </Badge>
              <span className="text-sm text-neutral-600">
                {completedCount} / {totalLessons} ({progressPercentage}%)
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3" role="alert">
          {error}
        </div>
      )}

      {nazraStatus === 'complete' && (
        <Card className="border-l-4 border-l-green-500 bg-green-50">
          <CardContent>
            <p className="font-semibold text-green-800">Nazra Complete!</p>
            <p className="text-sm text-green-700">All lessons have been completed.</p>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={() => setShowCompletionForm(!showCompletionForm)}
        variant={showCompletionForm ? 'outline' : 'primary'}
      >
        {showCompletionForm ? 'Cancel' : 'Mark Lesson Complete'}
      </Button>

      <Modal open={showCompletionForm} onClose={() => setShowCompletionForm(false)} size="sm">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Mark Lesson Complete</h3>
        <form onSubmit={handleMarkComplete} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="lesson-select" className="text-sm font-medium text-neutral-700">Lesson</label>
            <select
              id="lesson-select"
              value={selectedLesson || ''}
              onChange={(e) => setSelectedLesson(e.target.value)}
              required
              className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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

          <div className="space-y-2">
            <label htmlFor="quality-note" className="text-sm font-medium text-neutral-700">Quality Note (Optional)</label>
            <textarea
              id="quality-note"
              value={qualityNote}
              onChange={(e) => setQualityNote(e.target.value)}
              placeholder="Add notes about recitation quality..."
              rows="3"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>

          <Button type="submit" className="w-full">
            Mark Complete
          </Button>
        </form>
      </Modal>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-neutral-800">Lessons</h3>
        {lessons.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No lessons configured"
            description="Nazra lessons have not been set up yet."
          />
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson) => {
              const lessonProgress = progress[lesson.id]
              const isCompleted = !!lessonProgress

              return (
                <Card
                  key={lesson.id}
                  className={isCompleted ? 'border-l-4 border-l-green-400 bg-green-50/30' : ''}
                >
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-sm font-medium text-neutral-600">
                          {lesson.sequence_order}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-medium text-neutral-800 truncate">{lesson.title}</h4>
                          {isCompleted && (
                            <div className="text-xs text-neutral-500 mt-0.5 space-y-0.5">
                              <p>Completed: {new Date(lessonProgress.completed_at).toLocaleDateString()}</p>
                              {lessonProgress.quality_note && (
                                <p className="italic">Note: {lessonProgress.quality_note}</p>
                              )}
                              <p>By: {lessonProgress.scholars?.profiles?.full_name}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isCompleted && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveCompletion(lesson.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </Button>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
