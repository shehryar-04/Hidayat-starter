import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { StudentCourseView } from './StudentCourseView'
import { Button, Badge, Spinner, EmptyState, ConfirmDialog } from '../../shared/ui'
import { CheckCircle, Clock, Eye, Check, X } from 'lucide-react'

const LEVEL_VARIANT = {
  Beginner: 'success',
  Intermediate: 'warning',
  Advanced: 'error',
  'All levels': 'info',
}

export function AdminCourseReview() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [msg, setMsg] = useState(null)
  const [previewing, setPreviewing] = useState(null)
  const [rejectingCourseId, setRejectingCourseId] = useState(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const { data, error: err } = await supabase
        .from('short_courses')
        .select(`id, title, subtitle, description, thumbnail_url, level, status,
                 category, language, is_free, fee, learning_objectives, tags,
                 promo_video_url, requirements,
                 profiles:created_by(full_name)`)
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false })
      if (err) throw err
      setCourses(data || [])
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleApprove = async (courseId) => {
    try {
      const { error: err } = await supabase
        .from('short_courses')
        .update({ status: 'published' })
        .eq('id', courseId)
      if (err) throw err
      setCourses(c => c.filter(x => x.id !== courseId))
      setPreviewing(null)
      setMsg('Course approved and published.')
      setTimeout(() => setMsg(null), 3000)
    } catch (err) { setError(err.message) }
  }

  const confirmReject = async () => {
    if (!rejectingCourseId) return
    const courseId = rejectingCourseId
    try {
      const { error: err } = await supabase
        .from('short_courses')
        .update({ status: 'draft' })
        .eq('id', courseId)
      if (err) throw err
      setCourses(c => c.filter(x => x.id !== courseId))
      setPreviewing(null)
      setRejectingCourseId(null)
      setMsg('Course rejected and moved to draft.')
      setTimeout(() => setMsg(null), 3000)
    } catch (err) { setError(err.message) }
  }

  // Preview mode
  if (previewing) {
    return (
      <div className="space-y-4">
        {/* Approval bar */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-2xl px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <Badge variant="warning" dot>Pending Approval</Badge>
            <span className="text-sm text-neutral-700 dark:text-neutral-300">Submitted by <strong className="text-neutral-900 dark:text-white">{previewing.profiles?.full_name || 'Unknown'}</strong></span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="primary" size="sm" onClick={() => handleApprove(previewing.id)}>
              <Check className="w-3.5 h-3.5 mr-1" />
              Approve & Publish
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setRejectingCourseId(previewing.id)}>
              <X className="w-3.5 h-3.5 mr-1" />
              Reject
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPreviewing(null)}>
              ← Back to Queue
            </Button>
          </div>
        </div>

        {/* Render student course view for preview */}
        <StudentCourseView course={previewing} onBack={() => setPreviewing(null)} />

        <ConfirmDialog
          open={!!rejectingCourseId}
          onClose={() => setRejectingCourseId(null)}
          onConfirm={confirmReject}
          title="Reject Course"
          message="Reject this course? It will be moved back to draft status and the instructor can revise it."
          confirmText="Reject Course"
          variant="warning"
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size="lg" />
        <span className="text-sm text-neutral-400 mt-3 font-medium">Loading approval queue...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}
      {msg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-sm">
          {msg}
        </div>
      )}

      {courses.length === 0 ? (
        <div className="bg-white dark:bg-[#0f1a14] rounded-2xl border border-neutral-200/80 dark:border-[#1a2e23] p-12">
          <EmptyState
            icon={CheckCircle}
            title="Review queue is clear"
            description="All submitted short courses have been reviewed. New submissions will appear here."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map(course => (
            <div key={course.id} className="bg-white dark:bg-[#0f1a14] rounded-2xl border border-neutral-200/80 dark:border-[#1a2e23] shadow-xs overflow-hidden flex flex-col hover:shadow-xl hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all duration-300">
              {/* Thumbnail */}
              <div className="h-40 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-[#112018] dark:to-[#09140e] flex items-center justify-center overflow-hidden border-b border-neutral-100 dark:border-[#1a2e23]">
                {course.thumbnail_url
                  ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                  : <span className="text-4xl">🎓</span>}
              </div>

              <div className="p-5 flex flex-col flex-1">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                  <Badge variant="warning" dot>Pending Review</Badge>
                  {course.level && <Badge variant={LEVEL_VARIANT[course.level] || 'default'}>{course.level}</Badge>}
                  {course.language && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-[#14221b] text-neutral-600 dark:text-neutral-400 border border-neutral-200/60 dark:border-[#1a2e23]">
                      {course.language}
                    </span>
                  )}
                </div>

                <h3 className="font-display font-bold text-neutral-900 dark:text-neutral-100 text-base mb-1">{course.title}</h3>
                {course.subtitle && <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{course.subtitle}</p>}
                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 flex-1 leading-relaxed">{course.description}</p>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-[#1a2e23] flex items-center gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setPreviewing(course)}>
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Preview
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => handleApprove(course.id)}>
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setRejectingCourseId(course.id)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!rejectingCourseId}
        onClose={() => setRejectingCourseId(null)}
        onConfirm={confirmReject}
        title="Reject Course"
        message="Reject this course? It will be moved back to draft status and the instructor can revise it."
        confirmText="Reject Course"
        variant="warning"
      />
    </div>
  )
}
